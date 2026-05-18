import path from "node:path";
import fs from "node:fs";
import { getRunPaths } from "../run/run-paths";
import { startStaticServer } from "../utils/server";
import { logger } from "../utils/logger";

export async function previewRun(runPath: string): Promise<void> {
  const paths = getRunPaths(runPath);
  if (!fs.existsSync(path.join(paths.siteDir, "index.html"))) {
    throw new Error(`Missing site/index.html in ${paths.runDir}`);
  }

  const server = await startStaticServer(paths.siteDir);
  logger.info(`Preview URL: ${server.url}`);
  logger.info(`Serving: ${paths.siteDir}`);
  logger.info("Press Ctrl+C to stop.");

  const close = async () => {
    await server.close();
    process.exit(0);
  };
  process.on("SIGINT", close);
  process.on("SIGTERM", close);

  await new Promise(() => undefined);
}
