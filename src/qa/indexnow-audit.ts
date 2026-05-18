import fs from "node:fs";
import path from "node:path";
import { IndexNowConfigSchema } from "../indexing/indexnow";
import { RunMetaSchema } from "../run/run-meta";
import { getRunPaths } from "../run/run-paths";
import { readJson } from "../utils/json";

export type IndexNowAuditResult = {
  passed: boolean;
  checks: Record<string, boolean>;
  issues: string[];
};

export function auditIndexNowReadiness(
  runPathOrSiteId: string,
  cwd = process.cwd()
): IndexNowAuditResult {
  const paths = getRunPaths(runPathOrSiteId, cwd);
  const checks: Record<string, boolean> = {};
  const issues: string[] = [];

  checks.indexnow_json_exists = fs.existsSync(paths.indexnowJson);
  checks.sitemap_exists = fs.existsSync(path.join(paths.siteDir, "sitemap.xml"));

  let key = "";
  if (checks.indexnow_json_exists) {
    try {
      const config = readJson(paths.indexnowJson, IndexNowConfigSchema);
      key = config.key;
      const keyPath = path.join(paths.siteDir, config.key_file);
      checks.key_file_exists = fs.existsSync(keyPath);
      checks.key_file_content_matches =
        checks.key_file_exists && fs.readFileSync(keyPath, "utf8").trim() === key;
    } catch {
      checks.indexnow_json_valid = false;
    }
  } else {
    checks.key_file_exists = false;
    checks.key_file_content_matches = false;
  }

  if (fs.existsSync(paths.runJson) && fs.existsSync(path.join(paths.siteDir, "sitemap.xml"))) {
    const run = readJson(paths.runJson, RunMetaSchema);
    const sitemap = fs.readFileSync(path.join(paths.siteDir, "sitemap.xml"), "utf8");
    checks.sitemap_domain_matches = run.domain
      ? [...sitemap.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].every((match) =>
          match[1].startsWith(`https://${run.domain}`)
        )
      : false;
  } else {
    checks.sitemap_domain_matches = false;
  }

  for (const [name, passed] of Object.entries(checks)) {
    if (!passed) issues.push(`IndexNow readiness check failed: ${name}`);
  }

  return { passed: issues.length === 0, checks, issues };
}
