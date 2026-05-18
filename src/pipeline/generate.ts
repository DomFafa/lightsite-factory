import { writeJson } from "../utils/json";
import { logger } from "../utils/logger";
import { createRun } from "../run/create-run";
import { getRunPaths } from "../run/run-paths";
import { writeGeneratedSiteFiles } from "../run/write-files";
import { ensureIndexNowConfig } from "../indexing/indexnow";
import { readPrompt } from "../llm/prompts";
import { requestStructuredJson } from "../llm/openai";
import {
  GeneratedSiteSchema,
  PlanningArtifactsSchema,
  generatedSiteJsonSchema,
  planningArtifactsJsonSchema
} from "../llm/schemas";
import { createDesignSeed } from "../design/design-seed";

export type GenerateOptions = {
  keyword: string;
  domain?: string;
  language?: string;
  cwd?: string;
};

export async function generateSite(options: GenerateOptions): Promise<string> {
  const { run, runDir } = createRun(options);
  const cwd = options.cwd ?? process.cwd();
  const paths = getRunPaths(run.site_id, cwd);

  logger.info(`Run folder: ${runDir}`);
  const indexnow = ensureIndexNowConfig(run.site_id, cwd);
  const designSeed = createDesignSeed(run.keyword);

  const planningPrompt = readPrompt("generate-brief.md", cwd);
  const planning = await requestStructuredJson({
    schemaName: "planning artifacts",
    jsonSchema: planningArtifactsJsonSchema,
    zodSchema: PlanningArtifactsSchema,
    messages: [
      {
        role: "system",
        content: planningPrompt
      },
      {
        role: "user",
        content: JSON.stringify(
          {
            keyword: run.keyword,
            domain: run.domain,
            language: run.language,
            design_seed: designSeed,
            required_401k_inputs: [
              "current_age",
              "retirement_age",
              "current_balance",
              "annual_salary",
              "employee_contribution_percent",
              "employer_match_percent",
              "match_limit_percent",
              "annual_return_percent",
              "salary_increase_percent"
            ],
            required_401k_outputs: [
              "projected_balance",
              "user_contributions",
              "employer_match",
              "investment_growth",
              "monthly_retirement_income",
              "balance_over_time"
            ]
          },
          null,
          2
        )
      }
    ]
  });

  writeJson(paths.briefJson, planning.brief);
  writeJson(paths.designBriefJson, planning.design_brief);
  writeJson(paths.seoPlanJson, planning.seo_plan);
  writeJson(paths.toolSpecJson, planning.tool_spec);
  writeJson(paths.uiFingerprintJson, planning.ui_fingerprint);

  const sitePrompt = readPrompt("generate-site.md", cwd);
  const generatedSite = await requestStructuredJson({
    schemaName: "generated site",
    jsonSchema: generatedSiteJsonSchema,
    zodSchema: GeneratedSiteSchema,
    messages: [
      {
        role: "system",
        content: sitePrompt
      },
      {
        role: "user",
        content: JSON.stringify(
          {
            run,
            brief: planning.brief,
            design_brief: planning.design_brief,
            seo_plan: planning.seo_plan,
            tool_spec: planning.tool_spec,
            ui_fingerprint: planning.ui_fingerprint,
            indexnow: {
              key_file_is_written_by_system: indexnow.key_file,
              do_not_generate_key_file: true
            }
          },
          null,
          2
        )
      }
    ]
  });

  writeGeneratedSiteFiles(runDir, generatedSite.files);
  ensureIndexNowConfig(run.site_id, cwd);

  writeJson(paths.runJson, { ...run, status: "generated" });
  logger.info(`Generated static site in ${paths.siteDir}`);
  return runDir;
}
