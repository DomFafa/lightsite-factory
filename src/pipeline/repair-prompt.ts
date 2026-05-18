import fs from "node:fs";
import path from "node:path";
import { getRunPaths } from "../run/run-paths";
import { IndexNowConfigSchema } from "../indexing/indexnow";
import { readJson } from "../utils/json";
import { readPrompt } from "../llm/prompts";
import { logger } from "../utils/logger";

export function createRepairPrompt(runPath: string, cwd = process.cwd()): string {
  const paths = getRunPaths(runPath, cwd);
  const qaReportPath = path.join(paths.qaDir, "qa-report.json");
  if (!fs.existsSync(qaReportPath)) {
    throw new Error(`Missing QA report. Run pnpm qa ${runPath} first.`);
  }

  const qaReport = readJson<{ failures?: string[]; status?: string }>(qaReportPath);
  const indexnow = fs.existsSync(paths.indexnowJson)
    ? readJson(paths.indexnowJson, IndexNowConfigSchema)
    : undefined;
  const basePrompt = readPrompt("repair-prompt.md", cwd);
  const keyFile = indexnow ? `site/${indexnow.key_file}` : "site/<indexnow-key>.txt";

  const content = [
    basePrompt.trim(),
    "",
    `# Repair Prompt`,
    "",
    `Run path: ${paths.runDir}`,
    `QA status: ${qaReport.status ?? "unknown"}`,
    "",
    `## Failed QA Items`,
    "",
    ...(qaReport.failures?.length
      ? qaReport.failures.map((failure) => `- ${failure}`)
      : ["- No failures listed. Review QA artifacts before editing."]),
    "",
    `## Relevant Screenshots`,
    "",
    `- ${path.join(paths.screenshotsDir, "desktop.png")}`,
    `- ${path.join(paths.screenshotsDir, "mobile.png")}`,
    "",
    `## Allowed Files To Modify`,
    "",
    `- site/index.html`,
    `- site/css/style.css`,
    `- site/js/app.js`,
    `- site/robots.txt`,
    `- site/sitemap.xml`,
    `- ${keyFile}`,
    "",
    `## Forbidden Changes`,
    "",
    `- Do not change the tool type.`,
    `- Do not delete the calculator.`,
    `- Do not delete the required disclaimer.`,
    `- Do not weaken QA standards or fake QA reports.`,
    `- Do not add a backend, login, database, external dependency, or API key.`,
    `- Do not delete the IndexNow key file.`,
    `- Do not implement Google Search Console API submission.`,
    "",
    `## Repair Goals`,
    "",
    `- Fix every failed QA item without changing product direction.`,
    `- Keep the first viewport as a usable calculator.`,
    `- Preserve local-only HTML/CSS/vanilla JS.`,
    `- Keep the IndexNow key file content exactly equal to the key.`,
    "",
    `## Required Verification After Fix`,
    "",
    `- pnpm qa ${path.relative(cwd, paths.runDir)}`,
    `- pnpm repair-prompt ${path.relative(cwd, paths.runDir)} if QA still fails`,
    "",
    `Maximum repair rounds: 2. If round 2 still fails, stop and summarize root causes.`
  ].join("\n");

  fs.mkdirSync(paths.repairDir, { recursive: true });
  const target = path.join(paths.repairDir, "repair-prompt.md");
  fs.writeFileSync(target, `${content}\n`, "utf8");
  logger.info(`Wrote ${target}`);
  return target;
}
