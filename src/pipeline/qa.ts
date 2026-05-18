import { runPlaywrightAudit } from "../qa/playwright-audit";
import { logger } from "../utils/logger";

export async function runQa(runPath: string): Promise<void> {
  const report = await runPlaywrightAudit(runPath);
  logger.info(`QA status: ${report.status}`);
  if (report.failures.length) {
    logger.info(`Failures: ${report.failures.length}`);
  }
  if (!report.passed) {
    throw new Error(`QA failed. See ${report.run_path}/qa/qa-report.md for details.`);
  }
}
