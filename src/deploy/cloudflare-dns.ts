import { getEnv, loadEnv, requireEnv } from "../utils/env";
import { normalizeDomain } from "../run/run-meta";

export type CloudflareDnsRecord = {
  id?: string;
  type: string;
  name: string;
  content: string;
  proxied?: boolean;
  ttl?: number;
};

export type DnsPlan =
  | { action: "create"; record: CloudflareDnsRecord }
  | { action: "keep"; record: CloudflareDnsRecord }
  | { action: "replace"; existing: CloudflareDnsRecord; record: CloudflareDnsRecord }
  | { action: "conflict"; existing: CloudflareDnsRecord; record: CloudflareDnsRecord; reason: string };

type CloudflareResponse<T> = {
  success: boolean;
  result: T;
  errors?: Array<{ code?: number; message?: string }>;
};

type FetchLike = typeof fetch;

export function buildPagesDnsRecord(hostname: string, targetPagesHost: string): CloudflareDnsRecord {
  return {
    type: "CNAME",
    name: normalizeDomain(hostname),
    content: targetPagesHost,
    proxied: true,
    ttl: 1
  };
}

export function planDnsRecordChange(args: {
  existing?: CloudflareDnsRecord;
  desired: CloudflareDnsRecord;
  replaceDns?: boolean;
}): DnsPlan {
  if (!args.existing) return { action: "create", record: args.desired };

  const sameRecord =
    args.existing.type === args.desired.type &&
    args.existing.name === args.desired.name &&
    args.existing.content === args.desired.content;

  if (sameRecord) return { action: "keep", record: args.existing };
  if (args.replaceDns) {
    return { action: "replace", existing: args.existing, record: args.desired };
  }

  return {
    action: "conflict",
    existing: args.existing,
    record: args.desired,
    reason: `DNS record for ${args.desired.name} already exists and points to ${args.existing.content}. Use --replace-dns to replace it.`
  };
}

export async function findCloudflareZone(args: {
  domain: string;
  cwd?: string;
  fetchImpl?: FetchLike;
}): Promise<{ id: string; name: string }> {
  loadEnv(args.cwd);
  const envZoneId = getEnv("CLOUDFLARE_ZONE_ID");
  if (envZoneId) return { id: envZoneId, name: normalizeDomain(args.domain) };

  const accountId = requireEnv("CLOUDFLARE_ACCOUNT_ID");
  const token = requireEnv("CLOUDFLARE_API_TOKEN");
  const fetchImpl = args.fetchImpl ?? fetch;

  for (const candidate of zoneCandidates(args.domain)) {
    const response = await cloudflareFetch<Array<{ id: string; name: string }>>({
      path: `/zones?name=${encodeURIComponent(candidate)}&account.id=${encodeURIComponent(accountId)}`,
      token,
      fetchImpl
    });
    if (response.length > 0) return response[0];
  }

  throw new Error(
    [
      `Cloudflare zone not found for ${args.domain}.`,
      "Check that the domain has been added to Cloudflare.",
      "Check that nameservers point to Cloudflare.",
      "Check CLOUDFLARE_ACCOUNT_ID and API token permissions."
    ].join(" ")
  );
}

export async function ensurePagesDnsRecord(args: {
  zoneId: string;
  hostname: string;
  targetPagesHost: string;
  replaceDns?: boolean;
  fetchImpl?: FetchLike;
}): Promise<DnsPlan> {
  const token = requireEnv("CLOUDFLARE_API_TOKEN");
  const fetchImpl = args.fetchImpl ?? fetch;
  const desired = buildPagesDnsRecord(args.hostname, args.targetPagesHost);
  const existing = await findDnsRecord({
    zoneId: args.zoneId,
    hostname: args.hostname,
    fetchImpl
  });
  const plan = planDnsRecordChange({ existing, desired, replaceDns: args.replaceDns });

  if (plan.action === "conflict" || plan.action === "keep") return plan;
  if (plan.action === "replace" && plan.existing.id) {
    await cloudflareFetch({
      path: `/zones/${args.zoneId}/dns_records/${plan.existing.id}`,
      token,
      method: "DELETE",
      fetchImpl
    });
  }

  await cloudflareFetch({
    path: `/zones/${args.zoneId}/dns_records`,
    token,
    method: "POST",
    body: desired,
    fetchImpl
  });

  return plan;
}

async function findDnsRecord(args: {
  zoneId: string;
  hostname: string;
  fetchImpl: FetchLike;
}): Promise<CloudflareDnsRecord | undefined> {
  const token = requireEnv("CLOUDFLARE_API_TOKEN");
  const records = await cloudflareFetch<CloudflareDnsRecord[]>({
    path: `/zones/${args.zoneId}/dns_records?name=${encodeURIComponent(normalizeDomain(args.hostname))}`,
    token,
    fetchImpl: args.fetchImpl
  });
  return records[0];
}

async function cloudflareFetch<T = unknown>(args: {
  path: string;
  token: string;
  method?: string;
  body?: unknown;
  fetchImpl: FetchLike;
}): Promise<T> {
  const response = await args.fetchImpl(`https://api.cloudflare.com/client/v4${args.path}`, {
    method: args.method ?? "GET",
    headers: {
      Authorization: `Bearer ${args.token}`,
      "Content-Type": "application/json"
    },
    body: args.body === undefined ? undefined : JSON.stringify(args.body)
  });
  const parsed = (await response.json()) as CloudflareResponse<T>;
  if (!response.ok || !parsed.success) {
    const message = parsed.errors?.map((error) => error.message).filter(Boolean).join("; ");
    throw new Error(message || `Cloudflare API request failed: ${args.path}`);
  }
  return parsed.result;
}

function zoneCandidates(domain: string): string[] {
  const labels = normalizeDomain(domain).split(".");
  const candidates: string[] = [];
  for (let index = 0; index <= labels.length - 2; index += 1) {
    candidates.push(labels.slice(index).join("."));
  }
  return candidates;
}
