import fs from "node:fs";
import path from "node:path";
import { getRunPaths } from "../run/run-paths";
import { RunMetaSchema } from "../run/run-meta";
import { IndexNowConfigSchema, submitIndexNow } from "../indexing/indexnow";
import {
  deployToCloudflarePages,
  type CloudflareDeployResult
} from "../deploy/cloudflare-pages";
import { bindCloudflarePagesDomain } from "../deploy/cloudflare-pages-domain";
import { applyIndexingState, type IndexingState } from "../seo/indexing-state";
import { readJson, writeJson } from "../utils/json";
import { logger } from "../utils/logger";

export type DeployOptions = {
  force?: boolean;
  indexnow?: boolean;
  bindDomain?: boolean;
  publish?: boolean;
  replaceDns?: boolean;
  reason?: string;
};

export async function deployRun(runPath: string, options: DeployOptions = {}): Promise<void> {
  const paths = getRunPaths(runPath);
  const run = readJson(paths.runJson, RunMetaSchema);
  const qaReportPath = path.join(paths.qaDir, "qa-report.json");

  assertRequiredFile(path.join(paths.siteDir, "index.html"));
  assertRequiredFile(path.join(paths.siteDir, "robots.txt"));
  assertRequiredFile(path.join(paths.siteDir, "sitemap.xml"));
  const indexnow = readJson(paths.indexnowJson, IndexNowConfigSchema);
  assertRequiredFile(path.join(paths.siteDir, indexnow.key_file));
  assertRequiredFile(qaReportPath);

  const qaReport = readJson<{ passed?: boolean; status?: string }>(qaReportPath);
  if (!qaReport.passed && !options.force) {
    throw new Error("QA did not pass. Use --force to deploy anyway and record forced: true.");
  }

  const indexingState: IndexingState = options.publish ? "published" : "draft";
  if (options.publish && !run.domain) {
    throw new Error("--publish requires run.json.domain");
  }
  applyIndexingState({
    siteDir: paths.siteDir,
    state: indexingState,
    domain: run.domain
  });
  writeJson(paths.runJson, { ...run, indexing_state: indexingState });

  const deployedAt = new Date().toISOString();
  let deployResult: CloudflareDeployResult;
  try {
    deployResult = await deployToCloudflarePages({
      siteDir: paths.siteDir,
      projectName: run.site_id
    });
  } catch (error) {
    writeJson(paths.deployJson, {
      provider: "cloudflare-pages",
      project_name: run.site_id,
      domain: run.domain,
      deployed_at: deployedAt,
      status: "failed",
      forced: Boolean(options.force),
      reason: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }

  const deployJson: Record<string, unknown> = {
    provider: "cloudflare-pages",
    project_name: deployResult.project_name,
    domain: run.domain,
    deployed_at: deployedAt,
    status: "success",
    deployment_url: deployResult.deployment_url,
    forced: Boolean(options.force),
    reason: options.reason,
    indexing_state: indexingState
  };

  let domainBindFailed = false;
  if (options.bindDomain) {
    if (!run.domain) throw new Error("--bind-domain requires run.json.domain");
    const domainBind = await bindCloudflarePagesDomain({
      projectName: deployResult.project_name,
      domain: run.domain,
      replaceDns: options.replaceDns
    });
    writeJson(paths.domainBindJson, domainBind);
    deployJson.domain_bind = domainBind;
    domainBindFailed = domainBind.status === "failed";
  }

  if (options.indexnow !== false && run.domain && indexingState === "published") {
    try {
      const result = await submitIndexNow({ runPathOrSiteId: runPath });
      deployJson.indexnow =
        result.status === "success"
          ? {
              status: "success",
              submitted_urls: result.submitted_urls
            }
          : {
              status: "failed",
              reason: result.reason,
              next_action: result.next_action
            };
    } catch (error) {
      deployJson.indexnow = {
        status: "failed",
        reason: error instanceof Error ? error.message : String(error),
        next_action:
          "Deploy succeeded, but IndexNow submission failed. Check the domain binding, key file availability, and IndexNow endpoint, then run pnpm indexnow for this run."
      };
    }
  } else if (options.indexnow === false) {
    deployJson.indexnow = { status: "skipped" };
  } else if (indexingState === "draft") {
    deployJson.indexnow = {
      status: "skipped",
      reason: "Draft deploy keeps noindex,nofollow. Publish before submitting IndexNow."
    };
  }

  writeJson(paths.deployJson, deployJson);
  logger.info(`Deploy status: success`);
  if (deployResult.deployment_url) logger.info(`Deployment URL: ${deployResult.deployment_url}`);
  if (domainBindFailed) {
    throw new Error("Deploy succeeded, but domain binding failed. See domain-bind.json.");
  }
}

function assertRequiredFile(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required deploy file: ${filePath}`);
  }
}
