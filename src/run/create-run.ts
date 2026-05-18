import fs from "node:fs";
import { siteIdFromKeyword, getRunPaths } from "./run-paths";
import { normalizeDomain, RunMeta, RunMetaSchema } from "./run-meta";
import { ensureDir, readJson, writeJson } from "../utils/json";

export type CreateRunOptions = {
  keyword: string;
  domain?: string;
  language?: string;
  cwd?: string;
};

export function createRun(options: CreateRunOptions): { run: RunMeta; runDir: string } {
  const siteId = siteIdFromKeyword(options.keyword);
  const paths = getRunPaths(siteId, options.cwd);
  const domain = options.domain ? normalizeDomain(options.domain) : undefined;

  ensureDir(paths.runDir);
  ensureDir(paths.siteDir);
  ensureDir(paths.designDir);
  ensureDir(paths.qaDir);
  ensureDir(paths.screenshotsDir);
  ensureDir(paths.repairDir);

  if (fs.existsSync(paths.runJson)) {
    const existing = readJson(paths.runJson, RunMetaSchema);
    if (existing.keyword !== options.keyword) {
      throw new Error(
        `Run folder already exists for a different keyword: ${paths.runJson}`
      );
    }
    if (domain && existing.domain && existing.domain !== domain) {
      throw new Error(
        `Run folder already exists with domain ${existing.domain}; got ${domain}`
      );
    }
    if (domain && !existing.domain) {
      const updated = { ...existing, domain };
      writeJson(paths.runJson, updated);
      return { run: updated, runDir: paths.runDir };
    }
    return { run: existing, runDir: paths.runDir };
  }

  const run: RunMeta = {
    site_id: siteId,
    keyword: options.keyword,
    ...(domain ? { domain } : {}),
    language: options.language ?? "en",
    created_at: new Date().toISOString(),
    status: "created",
    version: "1.0"
  };

  writeJson(paths.runJson, run);
  return { run, runDir: paths.runDir };
}
