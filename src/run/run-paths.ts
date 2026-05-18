import path from "node:path";
import { slugifyKeyword } from "../utils/slug";

export type RunPaths = {
  root: string;
  runDir: string;
  runJson: string;
  briefJson: string;
  designBriefJson: string;
  seoPlanJson: string;
  toolSpecJson: string;
  uiFingerprintJson: string;
  indexnowJson: string;
  siteDir: string;
  designDir: string;
  designTargetPrompt: string;
  designTargetDesktop: string;
  designTargetManifest: string;
  usageJsonl: string;
  screenshotsDir: string;
  qaDir: string;
  repairDir: string;
  deployJson: string;
  domainBindJson: string;
  indexnowSubmitJson: string;
};

export function getRunPaths(runPathOrSiteId: string, cwd = process.cwd()): RunPaths {
  const root = path.resolve(cwd);
  const runDir = resolveRunDir(runPathOrSiteId, root);

  return {
    root,
    runDir,
    runJson: path.join(runDir, "run.json"),
    briefJson: path.join(runDir, "brief.json"),
    designBriefJson: path.join(runDir, "design-brief.json"),
    seoPlanJson: path.join(runDir, "seo-plan.json"),
    toolSpecJson: path.join(runDir, "tool-spec.json"),
    uiFingerprintJson: path.join(runDir, "ui-fingerprint.json"),
    indexnowJson: path.join(runDir, "indexnow.json"),
    siteDir: path.join(runDir, "site"),
    designDir: path.join(runDir, "design"),
    designTargetPrompt: path.join(runDir, "design", "design-target-prompt.md"),
    designTargetDesktop: path.join(runDir, "design", "target-desktop.png"),
    designTargetManifest: path.join(runDir, "design", "target-manifest.json"),
    usageJsonl: path.join(runDir, "usage.jsonl"),
    screenshotsDir: path.join(runDir, "screenshots"),
    qaDir: path.join(runDir, "qa"),
    repairDir: path.join(runDir, "repair"),
    deployJson: path.join(runDir, "deploy.json"),
    domainBindJson: path.join(runDir, "domain-bind.json"),
    indexnowSubmitJson: path.join(runDir, "indexnow-submit.json")
  };
}

export function siteIdFromKeyword(keyword: string): string {
  return slugifyKeyword(keyword);
}

export function getIndexNowKeyFilePath(runDir: string, key: string): string {
  return path.join(runDir, "site", `${key}.txt`);
}

function resolveRunDir(runPathOrSiteId: string, root: string): string {
  if (path.isAbsolute(runPathOrSiteId)) {
    return path.resolve(runPathOrSiteId);
  }

  if (runPathOrSiteId.includes("/") || runPathOrSiteId.includes("\\")) {
    return path.resolve(root, runPathOrSiteId);
  }

  return path.resolve(root, "runs", runPathOrSiteId);
}
