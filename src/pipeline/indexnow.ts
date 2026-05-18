import { submitIndexNow } from "../indexing/indexnow";
import { logger } from "../utils/logger";

export async function submitRunIndexNow(runPath: string): Promise<void> {
  const result = await submitIndexNow({ runPathOrSiteId: runPath });
  logger.info(`IndexNow status: ${result.status}`);
  if (result.status === "failed") {
    logger.info(`Reason: ${result.reason}`);
    logger.info(result.next_action);
    throw new Error(`IndexNow failed: ${result.reason}. ${result.next_action}`);
  }
}
