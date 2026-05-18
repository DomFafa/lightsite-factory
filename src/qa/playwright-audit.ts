import fs from "node:fs";
import path from "node:path";
import { Browser, chromium } from "playwright";
import { getRunPaths } from "../run/run-paths";
import { RunMetaSchema } from "../run/run-meta";
import { ensureDir, readJson, writeJson } from "../utils/json";
import { startStaticServer } from "../utils/server";
import { auditSeoFiles } from "./seo-audit";
import { runBehaviorAudit } from "./behavior-audit";
import { auditScreenshots } from "./screenshot-audit";
import { auditIndexNowReadiness } from "./indexnow-audit";
import { runVisionReview } from "./vision-review";

export type QaReport = {
  status: "passed" | "failed";
  passed: boolean;
  generated_at: string;
  run_path: string;
  failures: string[];
  checks: Record<string, unknown>;
};

export async function runPlaywrightAudit(
  runPathOrSiteId: string,
  cwd = process.cwd()
): Promise<QaReport> {
  const paths = getRunPaths(runPathOrSiteId, cwd);
  const run = readJson(paths.runJson, RunMetaSchema);
  ensureDir(paths.qaDir);
  ensureDir(paths.screenshotsDir);
  const server = await startStaticServer(paths.siteDir);
  let browser: Browser | undefined;
  const consoleErrors: string[] = [];

  try {
    browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(error.message));

    await page.goto(server.url, { waitUntil: "networkidle" });
    const opens = page.url().startsWith(server.url);
    const noHorizontalScroll = await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
    );
    const primaryResultVisible = await page.locator("#projected-balance").isVisible();
    await page.screenshot({
      path: path.join(paths.screenshotsDir, "desktop.png"),
      fullPage: true
    });

    const behavior = await runBehaviorAudit(page);
    const seo = auditSeoFiles(paths.siteDir, run.domain);

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await mobile.goto(server.url, { waitUntil: "networkidle" });
    const mobileNoHorizontalScroll = await mobile.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
    );
    const mobileInputVisible = await mobile.locator("#current-age").isVisible();
    const mobileResultVisible = await mobile.locator("#projected-balance").isVisible();
    await mobile.screenshot({
      path: path.join(paths.screenshotsDir, "mobile.png"),
      fullPage: true
    });
    await mobile.close();

    const screenshot = auditScreenshots(
      path.join(paths.screenshotsDir, "desktop.png"),
      path.join(paths.screenshotsDir, "mobile.png")
    );
    const indexnow = auditIndexNowReadiness(runPathOrSiteId, cwd);

    const vision = await runVisionReview({
      desktopPath: path.join(paths.screenshotsDir, "desktop.png"),
      mobilePath: path.join(paths.screenshotsDir, "mobile.png"),
      designBrief: readJson(paths.designBriefJson),
      toolSpec: readJson(paths.toolSpecJson),
      outputPath: path.join(paths.qaDir, "ux-vision-review.json"),
      cwd
    });

    const programmaticChecks = {
      page_opens: opens,
      no_desktop_horizontal_scroll: noHorizontalScroll,
      no_mobile_horizontal_scroll: mobileNoHorizontalScroll,
      primary_result_visible: primaryResultVisible,
      mobile_input_visible: mobileInputVisible,
      mobile_result_visible: mobileResultVisible,
      no_serious_console_errors: consoleErrors.length === 0
    };

    const failures = [
      ...failedChecks(programmaticChecks, "Programmatic check failed"),
      ...seo.issues,
      ...behavior.issues,
      ...screenshot.issues,
      ...indexnow.issues,
      ...visionFailures(vision),
      ...consoleErrors.map((error) => `Console error: ${error}`)
    ];

    writeJson(path.join(paths.qaDir, "seo-check.json"), seo);
    writeJson(path.join(paths.qaDir, "behavior-check.json"), behavior);
    writeJson(path.join(paths.qaDir, "console-errors.json"), consoleErrors);
    writeJson(path.join(paths.qaDir, "screenshot-check.json"), screenshot);
    writeJson(path.join(paths.qaDir, "indexnow-check.json"), indexnow);

    const report: QaReport = {
      status: failures.length === 0 ? "passed" : "failed",
      passed: failures.length === 0,
      generated_at: new Date().toISOString(),
      run_path: paths.runDir,
      failures,
      checks: {
        programmatic: programmaticChecks,
        seo,
        behavior,
        screenshot,
        indexnow,
        vision
      }
    };

    writeJson(path.join(paths.qaDir, "qa-report.json"), report);
    writeMarkdownReport(path.join(paths.qaDir, "qa-report.md"), report);
    return report;
  } finally {
    if (browser) await browser.close();
    await server.close();
  }
}

function failedChecks(checks: Record<string, boolean>, prefix: string): string[] {
  return Object.entries(checks)
    .filter(([, passed]) => !passed)
    .map(([name]) => `${prefix}: ${name}`);
}

function visionFailures(vision: Awaited<ReturnType<typeof runVisionReview>>): string[] {
  if (vision.status === "skipped") return [vision.reason];
  if ("reason" in vision) return [`UX Vision Review failed: ${vision.reason}`];
  const failures: string[] = [];
  if (vision.visual_polish < 7.5) failures.push("UX Vision Review failed: visual_polish < 7.5");
  if (vision.tool_clarity < 8) failures.push("UX Vision Review failed: tool_clarity < 8");
  if (vision.mobile_quality < 8) failures.push("UX Vision Review failed: mobile_quality < 8");
  if (vision.senior_friendliness < 7.5) {
    failures.push("UX Vision Review failed: senior_friendliness < 7.5");
  }
  if (!vision.first_viewport_is_tool) {
    failures.push("UX Vision Review failed: first viewport is not the usable tool");
  }
  if (vision.default_form_like) failures.push("UX Vision Review failed: page looks like a default form");
  if (vision.admin_dashboard_like) {
    failures.push("UX Vision Review failed: page looks like an admin dashboard");
  }
  if (vision.pure_marketing_landing) {
    failures.push("UX Vision Review failed: page is a pure marketing landing page");
  }
  return failures;
}

function writeMarkdownReport(filePath: string, report: QaReport): void {
  const lines = [
    `# QA Report`,
    "",
    `Status: ${report.status}`,
    `Generated: ${report.generated_at}`,
    `Run path: ${report.run_path}`,
    "",
    "## Failures",
    "",
    ...(report.failures.length ? report.failures.map((failure) => `- ${failure}`) : ["- None"])
  ];

  fs.writeFileSync(filePath, `${lines.join("\n")}\n`, "utf8");
}
