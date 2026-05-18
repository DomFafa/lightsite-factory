import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { getEnv, getIndexNowEndpoint, loadEnv } from "../utils/env";
import { ensureDir, readJson, writeJson } from "../utils/json";
import { normalizeDomain, RunMeta, RunMetaSchema } from "../run/run-meta";
import { getIndexNowKeyFilePath, getRunPaths } from "../run/run-paths";

export const IndexNowConfigSchema = z.object({
  key: z.string().regex(/^[A-Za-z0-9_-]{8,128}$/),
  key_file: z.string().min(1),
  endpoint: z.string().url(),
  created_at: z.string().datetime()
});

export type IndexNowConfig = z.infer<typeof IndexNowConfigSchema>;

export type IndexNowPayload = {
  host: string;
  key: string;
  keyLocation: string;
  urlList: string[];
};

export type IndexNowSubmitResult =
  | {
      status: "success";
      endpoint: string;
      host: string;
      key_location: string;
      submitted_urls: string[];
      submitted_at: string;
      response_status: number;
    }
  | {
      status: "failed";
      reason: string;
      key_location?: string;
      next_action: string;
      response_status?: number;
      response_body?: string;
    };

export type FetchLike = (
  input: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  }
) => Promise<{
  ok: boolean;
  status: number;
  text: () => Promise<string>;
}>;

export function generateIndexNowKey(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function buildIndexNowPayload(args: {
  domain: string;
  key: string;
  urls: string[];
}): IndexNowPayload {
  const host = normalizeDomain(args.domain);
  const keyLocation = `https://${host}/${args.key}.txt`;
  return {
    host,
    key: args.key,
    keyLocation,
    urlList: args.urls.length > 0 ? args.urls : [`https://${host}/`]
  };
}

export function extractUrlsFromSitemap(xml: string): string[] {
  const urls: string[] = [];
  const locPattern = /<loc>\s*([^<\s]+)\s*<\/loc>/gi;
  let match: RegExpExecArray | null;
  while ((match = locPattern.exec(xml))) {
    urls.push(match[1]);
  }
  return urls;
}

export function ensureIndexNowConfig(
  runPathOrSiteId: string,
  cwd = process.cwd()
): IndexNowConfig {
  loadEnv(cwd);
  const paths = getRunPaths(runPathOrSiteId, cwd);
  ensureDir(paths.siteDir);

  const envKey = getEnv("INDEXNOW_KEY");
  const existing = fs.existsSync(paths.indexnowJson)
    ? readJson(paths.indexnowJson, IndexNowConfigSchema)
    : undefined;

  const key = envKey ?? existing?.key ?? generateIndexNowKey();
  const config: IndexNowConfig = {
    key,
    key_file: `${key}.txt`,
    endpoint: getIndexNowEndpoint(),
    created_at: existing?.created_at ?? new Date().toISOString()
  };

  IndexNowConfigSchema.parse(config);
  writeJson(paths.indexnowJson, config);
  writeIndexNowKeyFile(paths.runDir, config);
  return config;
}

export function writeIndexNowKeyFile(runDir: string, config: IndexNowConfig): void {
  const keyPath = getIndexNowKeyFilePath(runDir, config.key);
  ensureDir(path.dirname(keyPath));
  fs.writeFileSync(keyPath, config.key, "utf8");
}

export async function submitIndexNow(args: {
  runPathOrSiteId: string;
  cwd?: string;
  fetchImpl?: FetchLike;
  dryRun?: boolean;
}): Promise<IndexNowSubmitResult> {
  loadEnv(args.cwd);
  const cwd = args.cwd ?? process.cwd();
  const paths = getRunPaths(args.runPathOrSiteId, cwd);
  const run = readJson<RunMeta>(paths.runJson, RunMetaSchema);
  const config = readJson(paths.indexnowJson, IndexNowConfigSchema);

  if (!run.domain) {
    return writeSubmitResult(paths.indexnowSubmitJson, {
      status: "failed",
      reason: "DOMAIN_MISSING",
      next_action: "Set run.json.domain before submitting IndexNow."
    });
  }

  const urls = readSitemapUrls(paths.siteDir, run.domain);
  const payload = buildIndexNowPayload({
    domain: run.domain,
    key: config.key,
    urls
  });

  if (args.dryRun) {
    return writeSubmitResult(paths.indexnowSubmitJson, {
      status: "success",
      endpoint: config.endpoint,
      host: payload.host,
      key_location: payload.keyLocation,
      submitted_urls: payload.urlList,
      submitted_at: new Date().toISOString(),
      response_status: 0
    });
  }

  const fetchImpl = args.fetchImpl ?? (globalThis.fetch as unknown as FetchLike);
  const keyCheck = await fetchImpl(payload.keyLocation);
  const keyBody = keyCheck.ok ? (await keyCheck.text()).trim() : "";
  if (!keyCheck.ok || keyBody !== config.key) {
    return writeSubmitResult(paths.indexnowSubmitJson, {
      status: "failed",
      reason: "INDEXNOW_KEY_LOCATION_NOT_REACHABLE",
      key_location: payload.keyLocation,
      next_action:
        "Deploy the latest site and ensure the custom domain points to Cloudflare Pages before submitting IndexNow.",
      response_status: keyCheck.status
    });
  }

  const response = await fetchImpl(config.endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const responseBody = await response.text();

  if (!response.ok) {
    return writeSubmitResult(paths.indexnowSubmitJson, {
      status: "failed",
      reason: "INDEXNOW_ENDPOINT_REJECTED_REQUEST",
      key_location: payload.keyLocation,
      next_action:
        "Check the IndexNow endpoint, domain binding, key file, and submitted URL list.",
      response_status: response.status,
      response_body: responseBody.slice(0, 2000)
    });
  }

  return writeSubmitResult(paths.indexnowSubmitJson, {
    status: "success",
    endpoint: config.endpoint,
    host: payload.host,
    key_location: payload.keyLocation,
    submitted_urls: payload.urlList,
    submitted_at: new Date().toISOString(),
    response_status: response.status
  });
}

function readSitemapUrls(siteDir: string, domain: string): string[] {
  const sitemapPath = path.join(siteDir, "sitemap.xml");
  if (!fs.existsSync(sitemapPath)) return [`https://${domain}/`];

  try {
    const urls = extractUrlsFromSitemap(fs.readFileSync(sitemapPath, "utf8"));
    return urls.length > 0 ? urls : [`https://${domain}/`];
  } catch {
    return [`https://${domain}/`];
  }
}

function writeSubmitResult<T extends IndexNowSubmitResult>(filePath: string, result: T): T {
  writeJson(filePath, result);
  return result;
}
