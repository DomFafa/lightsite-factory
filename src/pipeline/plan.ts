import fs from "node:fs";
import path from "node:path";
import { getRunPaths, siteIdFromKeyword } from "../run/run-paths";
import { ensureDir, writeJson } from "../utils/json";
import { logger } from "../utils/logger";
import { isCanvasEditorTool } from "../utils/tool-classification";

export type PlanComplexity = "simple" | "medium" | "complex";

export type ToolPlan = {
  keyword: string;
  site_id: string;
  inferred_tool_type: string;
  complexity: PlanComplexity;
  recommended_v1_scope: string;
  must_have_interactions: string[];
  optional_interactions: string[];
  seo_sections: string[];
  competitor_research_needed: boolean;
  risk_notes: string[];
};

export function inferToolPlan(keyword: string): ToolPlan {
  const siteId = siteIdFromKeyword(keyword);
  const lower = keyword.toLowerCase();

  if (isCanvasEditorTool({ keyword })) {
    return {
      keyword,
      site_id: siteId,
      inferred_tool_type: "canvas-editor",
      complexity: "complex",
      recommended_v1_scope:
        "Build a focused local canvas editor with visible workspace, essential tools, preview, and import/export. Avoid full professional editor scope.",
      must_have_interactions: [
        "visible canvas/workspace",
        "draw or edit control",
        "erase or clear control",
        "color picker when pixels/colors are edited",
        "import/export or download when files are involved",
        "local-only privacy copy"
      ],
      optional_interactions: [
        "fill tool",
        "color picker tool",
        "undo/redo",
        "preview panel",
        "mobile precision warning"
      ],
      seo_sections: [
        "tool",
        "how to use",
        "file format or compatibility guide",
        "privacy and unofficial/fan-tool note when relevant",
        "FAQ"
      ],
      competitor_research_needed: true,
      risk_notes: [
        "This is a complex interactive tool. Confirm the V1 scope before full generation.",
        "Canvas tools can burn tokens and still miss edge-case editing behavior.",
        "Keep the first version local-only and avoid accounts, cloud saves, and backend APIs."
      ]
    };
  }

  if (/\bword counter\b|\bcharacter counter\b|\btext counter\b/.test(lower)) {
    return {
      keyword,
      site_id: siteId,
      inferred_tool_type: "text-tool",
      complexity: "simple",
      recommended_v1_scope:
        "Build a local text utility with one textarea, live counts, clear/copy actions, and concise SEO helper content.",
      must_have_interactions: ["textarea", "live word/character counts", "clear action"],
      optional_interactions: ["copy results", "reading time", "sentence/paragraph counts"],
      seo_sections: ["tool", "how it works", "common use cases", "FAQ"],
      competitor_research_needed: false,
      risk_notes: ["Simple tools can usually go straight to generate."]
    };
  }

  if (/\bcalculator\b|\bestimator\b|\bconverter\b/.test(lower)) {
    return {
      keyword,
      site_id: siteId,
      inferred_tool_type: "calculator-or-converter",
      complexity: "medium",
      recommended_v1_scope:
        "Build the core input/output workflow, clear validation, reset behavior, and explanation sections.",
      must_have_interactions: ["inputs", "primary result", "validation", "reset action"],
      optional_interactions: ["table or chart", "scenario comparison"],
      seo_sections: ["calculator", "how the estimate works", "assumptions", "FAQ"],
      competitor_research_needed: false,
      risk_notes: ["Keep formulas explicit and only include domain-specific disclaimers when needed."]
    };
  }

  return {
    keyword,
    site_id: siteId,
    inferred_tool_type: "generic-static-tool",
    complexity: "medium",
    recommended_v1_scope:
      "Build one focused local tool workflow with visible controls, immediate output, and concise supporting content.",
    must_have_interactions: ["primary input", "primary output", "reset or clear action"],
    optional_interactions: ["copy/export", "examples", "settings"],
    seo_sections: ["tool", "how to use", "tips", "FAQ"],
    competitor_research_needed: false,
    risk_notes: ["Confirm the core interaction if the keyword is ambiguous."]
  };
}

export function writePlan(keyword: string, cwd = process.cwd()): string {
  const plan = inferToolPlan(keyword);
  const paths = getRunPaths(plan.site_id, cwd);
  ensureDir(paths.runDir);

  const planJsonPath = path.join(paths.runDir, "plan.json");
  const planMdPath = path.join(paths.runDir, "plan.md");
  writeJson(planJsonPath, plan);
  writePlanMarkdown(planMdPath, plan);
  logger.info(`Plan written: ${planJsonPath}`);
  logger.info(`Plan notes: ${planMdPath}`);
  return paths.runDir;
}

function writePlanMarkdown(filePath: string, plan: ToolPlan): void {
  const lines = [
    `# Plan: ${plan.keyword}`,
    "",
    `- Site ID: ${plan.site_id}`,
    `- Inferred tool type: ${plan.inferred_tool_type}`,
    `- Complexity: ${plan.complexity}`,
    `- Competitor research needed: ${plan.competitor_research_needed ? "yes" : "no"}`,
    "",
    "## Recommended V1 Scope",
    "",
    plan.recommended_v1_scope,
    "",
    "## Must-have Interactions",
    "",
    ...plan.must_have_interactions.map((item) => `- ${item}`),
    "",
    "## Optional Interactions",
    "",
    ...plan.optional_interactions.map((item) => `- ${item}`),
    "",
    "## SEO Sections",
    "",
    ...plan.seo_sections.map((item) => `- ${item}`),
    "",
    "## Risk Notes",
    "",
    ...plan.risk_notes.map((item) => `- ${item}`)
  ];

  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${lines.join("\n")}\n`, "utf8");
}
