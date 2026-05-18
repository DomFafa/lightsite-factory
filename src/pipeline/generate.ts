import fs from "node:fs";
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
import { inferToolFamily } from "../tooling/tool-family";
import { createDesignTarget, type DesignTargetManifest } from "./design-target";
import { getEnv } from "../utils/env";
import { writePlan } from "./plan";

export type GenerateOptions = {
  keyword: string;
  domain?: string;
  language?: string;
  cwd?: string;
  codeOnly?: boolean;
  allowComplex?: boolean;
  designOnly?: boolean;
  reuseDesign?: boolean;
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
  const toolFamily = inferToolFamily({ keyword: args.keyword });
  return {
    keyword: args.keyword,
    domain: args.domain,
    language: args.language,
    inferred_tool_family: toolFamily,
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
  designTargetManifest?: DesignTargetManifest | null;
  designTargetPromptSummary?: string | null;
}): Record<string, unknown> {
  const family = inferToolFamily({
    keyword: args.run.keyword,
    siteType: args.brief.site_type
  });
  return {
    run: args.run,
    brief: args.brief,
    design_brief: args.designBrief,
    seo_plan: args.seoPlan,
    tool_spec: args.toolSpec,
    ui_fingerprint: args.uiFingerprint,
    golden_quality_lessons: args.goldenQualityLessons,
    tool_family: family,
    is401k: family.is401k,
    design_target_manifest: args.designTargetManifest ?? null,
    design_target_prompt_summary: args.designTargetPromptSummary ?? null,
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

export function shouldStopForComplexTool(args: {
  keyword: string;
  siteType?: string;
  complexity?: string;
  allowComplex?: boolean;
}): boolean {
  if (args.allowComplex) return false;
  const family = inferToolFamily({ keyword: args.keyword, siteType: args.siteType });
  return args.complexity === "complex" || family.isComplex;
}

export function shouldUseDesignTarget(args: { codeOnly?: boolean }): boolean {
  return !args.codeOnly;
}

export async function generateSite(options: GenerateOptions): Promise<string> {
  if (options.codeOnly && options.designOnly) {
    throw new Error("Use either --code-only or --design-only, not both.");
  }
  const { run, runDir } = createRun(options);
  const cwd = options.cwd ?? process.cwd();
  const paths = getRunPaths(run.site_id, cwd);

  logger.info(`Run folder: ${runDir}`);
  writePlan(run.keyword, cwd);
  const indexnow = ensureIndexNowConfig(run.site_id, cwd);
  const designSeed = createDesignSeed(run.keyword);
  const initialGoldenLessons = loadGoldenLessons({ keyword: run.keyword, cwd });

  const planningPrompt = readPrompt("generate-brief.md", cwd);
  const planning = await requestStructuredJson({
    schemaName: "planning artifacts",
    jsonSchema: planningArtifactsJsonSchema,
    zodSchema: PlanningArtifactsSchema,
    runDir,
    stage: "planning",
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

  if (
    shouldStopForComplexTool({
      keyword: run.keyword,
      siteType: planning.brief.site_type,
      complexity: planning.tool_spec.complexity,
      allowComplex: options.allowComplex
    })
  ) {
    writeJson(paths.runJson, {
      ...run,
      status: "needs_scope_confirmation",
      complexity: "complex"
    });
    logger.warn(
      "This is a complex interactive tool. Confirm the V1 scope, then rerun with --allow-complex to continue full generation."
    );
    return runDir;
  }

  const sitePrompt = readPrompt("generate-site.md", cwd);
  const goldenLessons = loadGoldenLessons({
    keyword: run.keyword,
    siteType: planning.brief.site_type,
    cwd
  });

  let designTargetManifest: DesignTargetManifest | null = null;
  let designTargetPromptSummary: string | null = null;
  if (shouldUseDesignTarget(options)) {
    designTargetManifest = await createDesignTarget({
      run,
      planning,
      goldenQualityLessons: goldenLessons,
      cwd,
      reuseDesign: options.reuseDesign
    });
    designTargetPromptSummary = readDesignTargetPromptSummary(paths.designTargetPrompt);
    if (options.designOnly) {
      writeJson(paths.runJson, { ...run, status: "design_target_generated" });
      logger.info(`Generated design target in ${paths.designDir}`);
      return runDir;
    }
  }

  const siteGenerationInput = buildSiteGenerationInput({
    run,
    brief: planning.brief,
    designBrief: planning.design_brief,
    seoPlan: planning.seo_plan,
    toolSpec: planning.tool_spec,
    uiFingerprint: planning.ui_fingerprint,
    goldenQualityLessons: goldenLessons,
    indexNowKeyFile: indexnow.key_file,
    designTargetManifest,
    designTargetPromptSummary
  });
  const userContent = buildSiteGenerationUserContent({
    input: siteGenerationInput,
    designTargetPath: designTargetManifest ? paths.designTargetDesktop : undefined,
    includeImage: Boolean(designTargetManifest && modelLikelySupportsImage(getEnv("OPENAI_MODEL")))
  });

  const generatedSite = await requestStructuredJson({
    schemaName: "generated site",
    jsonSchema: generatedSiteJsonSchema,
    zodSchema: GeneratedSiteSchema,
    runDir,
    stage: "site-generation",
    messages: [
      {
        role: "system",
        content: sitePrompt
      },
      {
        role: "user",
        content: userContent
      }
    ]
  });

  writeGeneratedSiteFiles(runDir, generatedSite.files);
  ensureIndexNowConfig(run.site_id, cwd);

  writeJson(paths.runJson, { ...run, status: "generated" });
  logger.info(`Generated static site in ${paths.siteDir}`);
  return runDir;
}

export function buildSiteGenerationUserContent(args: {
  input: Record<string, unknown>;
  designTargetPath?: string;
  includeImage?: boolean;
}): unknown {
  const text = JSON.stringify(args.input, null, 2);
  if (!args.includeImage || !args.designTargetPath) return text;

  const image = readJsonIfImageExists(args.designTargetPath);
  if (!image) return text;
  return [
    {
      type: "text",
      text
    },
    {
      type: "image_url",
      image_url: {
        url: `data:image/png;base64,${image}`
      }
    }
  ];
}

function modelLikelySupportsImage(model?: string): boolean {
  if (getEnv("OPENAI_MODEL_SUPPORTS_IMAGE") === "true") return true;
  if (getEnv("OPENAI_MODEL_SUPPORTS_IMAGE") === "false") return false;
  return Boolean(model && /gpt-4o|gpt-4\.1|gpt-5|o3|o4/i.test(model));
}

function readJsonIfImageExists(filePath: string): string | undefined {
  try {
    return readJsonImageBase64(filePath);
  } catch {
    return undefined;
  }
}

function readJsonImageBase64(filePath: string): string {
  return Buffer.from(fs.readFileSync(filePath)).toString("base64");
}

function readDesignTargetPromptSummary(filePath: string): string | null {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return content.slice(0, 3000);
  } catch {
    return null;
  }
}
