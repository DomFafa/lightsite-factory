#!/usr/bin/env node
import { Command } from "commander";
import { generateSite } from "./pipeline/generate";
import { runQa } from "./pipeline/qa";
import { createRepairPrompt } from "./pipeline/repair-prompt";
import { previewRun } from "./pipeline/preview";
import { deployRun } from "./pipeline/deploy";
import { submitRunIndexNow } from "./pipeline/indexnow";
import { logger } from "./utils/logger";
import { loadEnv } from "./utils/env";

loadEnv();

const program = new Command();

program
  .name("lightsite-factory")
  .description("Lightweight AI static tool-site generator")
  .version("0.1.0");

program
  .command("generate")
  .argument("<keyword>")
  .option("--domain <domain>")
  .option("--language <language>", "Site language", "en")
  .option("--deploy", "Run QA and deploy after generation")
  .action(async (keyword: string, options: { domain?: string; language?: string; deploy?: boolean }) => {
    const runDir = await generateSite({
      keyword,
      domain: options.domain,
      language: options.language
    });
    if (options.deploy) {
      await runQa(runDir);
      await deployRun(runDir);
    }
  });

program
  .command("qa")
  .argument("<runPath>")
  .action(async (runPath: string) => {
    await runQa(runPath);
  });

program
  .command("repair-prompt")
  .argument("<runPath>")
  .action((runPath: string) => {
    createRepairPrompt(runPath);
  });

program
  .command("preview")
  .argument("<runPath>")
  .action(async (runPath: string) => {
    await previewRun(runPath);
  });

program
  .command("deploy")
  .argument("<runPath>")
  .option("--force", "Deploy even if QA failed")
  .option("--no-indexnow", "Skip IndexNow submit after deploy")
  .action(async (runPath: string, options: { force?: boolean; indexnow?: boolean }) => {
    await deployRun(runPath, {
      force: options.force,
      indexnow: options.indexnow
    });
  });

program
  .command("indexnow")
  .argument("<runPath>")
  .action(async (runPath: string) => {
    await submitRunIndexNow(runPath);
  });

program.parseAsync(process.argv).catch((error: unknown) => {
  logger.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
