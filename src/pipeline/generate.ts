import { writeJson } from "../utils/json";
import { logger } from "../utils/logger";
import { createRun } from "../run/create-run";
import { getRunPaths } from "../run/run-paths";
import { writeGeneratedSiteFiles } from "../run/write-files";
import { ensureIndexNowConfig } from "../indexing/indexnow";
import { readPrompt } from "../llm/prompts";
import { requestStructuredJson } from "../llm/openai";
import {
  type Brief,
  type DesignBrief,
  GeneratedSiteSchema,
  PlanningArtifactsSchema,
  type SeoPlan,
  type ToolSpec,
  generatedSiteJsonSchema,
  planningArtifactsJsonSchema
} from "../llm/schemas";
import { createDesignSeed } from "../design/design-seed";
import { loadGoldenLessons } from "../memory/load-golden-lessons";
import { is401kCalculator as matches401kCalculator } from "../utils/tool-classification";

export type GenerateOptions = {
  keyword: string;
  domain?: string;
  language?: string;
  cwd?: string;
};

export { matches401kCalculator as is401kCalculator };

export const required401kInputs = [
  "current_age",
  "retirement_age",
  "current_balance",
  "annual_salary",
  "employee_contribution_percent",
  "employer_match_percent",
  "match_limit_percent",
  "annual_return_percent",
  "salary_increase_percent"
];

export const required401kOutputs = [
  "projected_balance",
  "user_contributions",
  "employer_match",
  "investment_growth",
  "monthly_retirement_income",
  "balance_over_time"
];

export const required401kFormula =
  "Each year: salary = salary * (1 + salaryIncrease); employeeContribution = salary * employeeContributionPercent; eligibleMatchPercent = min(employeeContributionPercent, matchLimitPercent); employerMatch = salary * eligibleMatchPercent * employerMatchPercent; balance = balance * (1 + annualReturn) + employeeContribution + employerMatch. Final monthlyRetirementIncome = projectedBalance * 0.04 / 12.";

export function buildPlanningInput(args: {
  keyword: string;
  domain?: string;
  language: string;
  designSeed: unknown;
  goldenQualityLessons: unknown;
}): Record<string, unknown> {
  return {
    keyword: args.keyword,
    domain: args.domain,
    language: args.language,
    design_seed: args.designSeed,
    golden_quality_lessons: args.goldenQualityLessons,
    ...(matches401kCalculator(args.keyword)
      ? {
          required_401k_inputs: required401kInputs,
          required_401k_outputs: required401kOutputs,
          required_401k_formula: required401kFormula
        }
      : {})
  };
}

export function buildSiteGenerationInput(args: {
  run: { keyword: string; [key: string]: unknown };
  brief: Brief;
  designBrief: DesignBrief;
  seoPlan: SeoPlan;
  toolSpec: ToolSpec;
  uiFingerprint: unknown;
  goldenQualityLessons: unknown;
  indexNowKeyFile: string;
}): Record<string, unknown> {
  return {
    run: args.run,
    brief: args.brief,
    design_brief: args.designBrief,
    seo_plan: args.seoPlan,
    tool_spec: args.toolSpec,
    ui_fingerprint: args.uiFingerprint,
    golden_quality_lessons: args.goldenQualityLessons,
    tool_requirements_source: "planning_tool_spec",
    instruction:
      "Generate stable IDs and interactions based on tool_spec, not 401k unless keyword is 401k calculator.",
    ...(matches401kCalculator(args.run.keyword)
      ? {
          required_401k_inputs: required401kInputs,
          required_401k_outputs: required401kOutputs,
          required_401k_formula: required401kFormula
        }
      : {}),
    indexnow: {
      key_file_is_written_by_system: args.indexNowKeyFile,
      do_not_generate_key_file: true
    }
  };
}

export async function generateSite(options: GenerateOptions): Promise<string> {
  const { run, runDir } = createRun(options);
  const cwd = options.cwd ?? process.cwd();
  const paths = getRunPaths(run.site_id, cwd);

  logger.info(`Run folder: ${runDir}`);
  const indexnow = ensureIndexNowConfig(run.site_id, cwd);
  const designSeed = createDesignSeed(run.keyword);
  const initialGoldenLessons = loadGoldenLessons({ keyword: run.keyword, cwd });

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
          buildPlanningInput({
            keyword: run.keyword,
            domain: run.domain,
            language: run.language,
            designSeed,
            goldenQualityLessons: initialGoldenLessons
          }),
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
  const goldenLessons = loadGoldenLessons({
    keyword: run.keyword,
    siteType: planning.brief.site_type,
    cwd
  });
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
          buildSiteGenerationInput({
            run,
            brief: planning.brief,
            designBrief: planning.design_brief,
            seoPlan: planning.seo_plan,
            toolSpec: planning.tool_spec,
            uiFingerprint: planning.ui_fingerprint,
            goldenQualityLessons: goldenLessons,
            indexNowKeyFile: indexnow.key_file
          }),
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
