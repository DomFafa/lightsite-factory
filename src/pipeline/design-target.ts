import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { readPrompt } from "../llm/prompts";
import { generateImageTarget, writeImageFile } from "../llm/image";
import { getRunPaths } from "../run/run-paths";
import { ensureDir, readJson, writeJson } from "../utils/json";
import { inferToolFamily } from "../tooling/tool-family";
import type { PlanningArtifacts } from "../llm/schemas";
import type { RunMeta } from "../run/run-meta";

export const DesignTargetManifestSchema = z.object({
  status: z.enum(["success", "reused"]),
  model: z.string(),
  size: z.string(),
  stage: z.literal("design-target"),
  created_at: z.string(),
  prompt_path: z.string(),
  target_desktop: z.string()
});

export type DesignTargetManifest = z.infer<typeof DesignTargetManifestSchema>;

export type DesignTargetGenerator = (args: {
  prompt: string;
  runDir: string;
}) => Promise<{ model: string; size: string; bytes: Buffer }>;

export async function createDesignTarget(args: {
  run: RunMeta;
  planning: PlanningArtifacts;
  goldenQualityLessons: unknown;
  cwd?: string;
  reuseDesign?: boolean;
  imageGenerator?: DesignTargetGenerator;
}): Promise<DesignTargetManifest> {
  const cwd = args.cwd ?? process.cwd();
  const paths = getRunPaths(args.run.site_id, cwd);
  ensureDir(paths.designDir);

  if (args.reuseDesign && fs.existsSync(paths.designTargetDesktop)) {
    if (fs.existsSync(paths.designTargetManifest)) {
      return readJson(paths.designTargetManifest, DesignTargetManifestSchema);
    }
    const reused = buildDesignTargetManifest({
      status: "reused",
      model: "existing",
      size: "existing",
      cwd,
      paths
    });
    writeJson(paths.designTargetManifest, reused);
    return reused;
  }

  const prompt = buildDesignTargetPrompt({
    basePrompt: readPrompt("design-target.md", cwd),
    run: args.run,
    planning: args.planning,
    goldenQualityLessons: args.goldenQualityLessons
  });
  fs.writeFileSync(paths.designTargetPrompt, prompt, "utf8");

  const generator = args.imageGenerator ?? generateImageTarget;
  const image = await generator({ prompt, runDir: paths.runDir });
  writeImageFile(paths.designTargetDesktop, image.bytes);

  const manifest = buildDesignTargetManifest({
    status: "success",
    model: image.model,
    size: image.size,
    cwd,
    paths
  });
  writeJson(paths.designTargetManifest, manifest);
  return manifest;
}

export function buildDesignTargetPrompt(args: {
  basePrompt: string;
  run: RunMeta;
  planning: PlanningArtifacts;
  goldenQualityLessons: unknown;
}): string {
  const family = inferToolFamily({
    keyword: args.run.keyword,
    siteType: args.planning.brief.site_type
  });
  return [
    args.basePrompt.trim(),
    "",
    "Input context:",
    JSON.stringify(
      {
        keyword: args.run.keyword,
        site_id: args.run.site_id,
        tool_family: family,
        brief: args.planning.brief,
        design_brief: args.planning.design_brief,
        seo_plan: args.planning.seo_plan,
        tool_spec: args.planning.tool_spec,
        ui_fingerprint: args.planning.ui_fingerprint,
        golden_quality_lessons: args.goldenQualityLessons
      },
      null,
      2
    )
  ].join("\n");
}

function buildDesignTargetManifest(args: {
  status: "success" | "reused";
  model: string;
  size: string;
  cwd: string;
  paths: ReturnType<typeof getRunPaths>;
}): DesignTargetManifest {
  return {
    status: args.status,
    model: args.model,
    size: args.size,
    stage: "design-target",
    created_at: new Date().toISOString(),
    prompt_path: path.relative(args.paths.runDir, args.paths.designTargetPrompt),
    target_desktop: path.relative(args.paths.runDir, args.paths.designTargetDesktop)
  };
}
