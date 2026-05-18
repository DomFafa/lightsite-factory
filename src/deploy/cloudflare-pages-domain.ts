import { normalizeDomain } from "../run/run-meta";
import { loadEnv, requireEnv } from "../utils/env";
import { ensurePagesDnsRecord, findCloudflareZone, type DnsPlan } from "./cloudflare-dns";

type FetchLike = typeof fetch;

type CloudflareResponse<T> = {
  success: boolean;
  result: T;
  errors?: Array<{ code?: number; message?: string }>;
};

export type DomainBindResult = {
  status: "success" | "failed";
  project_name: string;
  domain: string;
  zone?: { id: string; name: string };
  hostnames: string[];
  dns: DnsPlan[];
  pages_domains: Array<{ hostname: string; status: "requested" | "already_exists" | "failed"; reason?: string }>;
  reason?: string;
  next_action?: string;
};

export function hostnamesForDomain(domain: string): string[] {
  const normalized = normalizeDomain(domain);
  if (normalized.startsWith("www.")) {
    const apex = normalized.slice(4);
    return [normalized, apex];
  }
  return [normalized, `www.${normalized}`];
}

export function buildPagesDomainPayload(hostname: string): { name: string } {
  return { name: normalizeDomain(hostname) };
}

export async function bindCloudflarePagesDomain(args: {
  projectName: string;
  domain: string;
  replaceDns?: boolean;
  cwd?: string;
  fetchImpl?: FetchLike;
}): Promise<DomainBindResult> {
  loadEnv(args.cwd);
  const accountId = requireEnv("CLOUDFLARE_ACCOUNT_ID");
  const token = requireEnv("CLOUDFLARE_API_TOKEN");
  const fetchImpl = args.fetchImpl ?? fetch;
  const domain = normalizeDomain(args.domain);
  const hostnames = hostnamesForDomain(domain);
  const targetPagesHost = `${args.projectName}.pages.dev`;

  try {
    const zone = await findCloudflareZone({ domain, cwd: args.cwd, fetchImpl });
    const dns: DnsPlan[] = [];
    const pagesDomains: DomainBindResult["pages_domains"] = [];

    for (const hostname of hostnames) {
      const pagesDomain = await requestPagesDomain({
        accountId,
        projectName: args.projectName,
        hostname,
        token,
        fetchImpl
      });
      pagesDomains.push(pagesDomain);
      if (pagesDomain.status === "failed") {
        return {
          status: "failed",
          project_name: args.projectName,
          domain,
          zone,
          hostnames,
          dns,
          pages_domains: pagesDomains,
          reason: pagesDomain.reason || `Could not add Pages custom domain ${hostname}.`,
          next_action: "Check Cloudflare Pages domain status and API token permissions."
        };
      }

      const dnsPlan = await ensurePagesDnsRecord({
        zoneId: zone.id,
        hostname,
        targetPagesHost,
        replaceDns: args.replaceDns,
        fetchImpl
      });
      dns.push(dnsPlan);
      if (dnsPlan.action === "conflict") {
        return {
          status: "failed",
          project_name: args.projectName,
          domain,
          zone,
          hostnames,
          dns,
          pages_domains: pagesDomains,
          reason: dnsPlan.reason,
          next_action: "Review the existing DNS record or rerun deploy with --replace-dns."
        };
      }
    }

    return {
      status: "success",
      project_name: args.projectName,
      domain,
      zone,
      hostnames,
      dns,
      pages_domains: pagesDomains
    };
  } catch (error) {
    return {
      status: "failed",
      project_name: args.projectName,
      domain,
      hostnames,
      dns: [],
      pages_domains: [],
      reason: error instanceof Error ? error.message : String(error),
      next_action:
        "Confirm the domain is in Cloudflare, nameservers point to Cloudflare, and the API token can edit Pages and DNS."
    };
  }
}

async function requestPagesDomain(args: {
  accountId: string;
  projectName: string;
  hostname: string;
  token: string;
  fetchImpl: FetchLike;
}): Promise<DomainBindResult["pages_domains"][number]> {
  const response = await args.fetchImpl(
    `https://api.cloudflare.com/client/v4/accounts/${args.accountId}/pages/projects/${args.projectName}/domains`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${args.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(buildPagesDomainPayload(args.hostname))
    }
  );
  const parsed = (await response.json()) as CloudflareResponse<unknown>;
  if (response.ok && parsed.success) {
    return { hostname: normalizeDomain(args.hostname), status: "requested" };
  }

  const reason = parsed.errors?.map((error) => error.message).filter(Boolean).join("; ") ?? "";
  if (/already|exists/i.test(reason)) {
    return { hostname: normalizeDomain(args.hostname), status: "already_exists", reason };
  }
  return { hostname: normalizeDomain(args.hostname), status: "failed", reason };
}
