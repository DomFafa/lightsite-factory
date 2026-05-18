import fs from "node:fs";

export type ScreenshotAuditResult = {
  passed: boolean;
  checks: Record<string, boolean>;
  issues: string[];
};

export function auditScreenshots(desktopPath: string, mobilePath: string): ScreenshotAuditResult {
  const checks = {
    desktop_exists: existsAndNonEmpty(desktopPath),
    mobile_exists: existsAndNonEmpty(mobilePath)
  };
  const issues = Object.entries(checks)
    .filter(([, passed]) => !passed)
    .map(([name]) => `Screenshot check failed: ${name}`);

  return {
    passed: issues.length === 0,
    checks,
    issues
  };
}

function existsAndNonEmpty(filePath: string): boolean {
  return fs.existsSync(filePath) && fs.statSync(filePath).size > 0;
}
