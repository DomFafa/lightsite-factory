import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createDesignTarget, buildDesignTargetPrompt } from "./design-target";
import { getRunPaths } from "../run/run-paths";
import type { PlanningArtifacts } from "../llm/schemas";
import type { RunMeta } from "../run/run-meta";

const run: RunMeta = {
  site_id: "random-date-generator",
  keyword: "random date generator",
  language: "en",
  created_at: "2026-05-18T00:00:00.000Z",
  status: "created",
  version: "1.0"
};

const planning: PlanningArtifacts = {
  brief: {
    keyword: "random date generator",
    site_type: "generator tool",
    target_users: ["writers"],
    primary_goal: "Generate random dates.",
    non_goals: ["cryptographic randomness"]
  },
  design_brief: {
    visual_mood: "refined playful utility",
    layout_archetype: "centered-tool-lab",
    senior_friendly: true,
    style_rules: ["compact UI tokens"],
    forbidden_styles: ["generic form"]
  },
  seo_plan: {
    title: "Random Date Generator",
    meta_description: "Generate random dates.",
    canonical_url: "https://example.com/",
    h1: "Random Date Generator",
    required_sections: ["tool", "FAQ"],
    structured_data: ["SoftwareApplication", "FAQPage"]
  },
  tool_spec: {
    tool_family: "generator-tool",
    complexity: "simple",
    inputs: ["start date"],
    outputs: ["date list"],
    controls: ["date input"],
    primary_actions: ["generate"],
    secondary_actions: ["copy"],
    states: ["empty", "generated"],
    validation_rules: ["valid date range"],
    local_only_requirements: ["browser-only"],
    disclaimer: "Convenience generator only.",
    implementation_notes: ["Generate browser-side dates."]
  },
  ui_fingerprint: {
    layout_archetype: "centered-tool-lab",
    background_style: "warm playful",
    primary_color_family: "warm coral mint",
    card_style: "soft rounded",
    typography_style: "friendly sans",
    hero_strategy: "tool-first",
    result_panel_style: "compact list"
  }
};

test("build design prompt includes tool family and global visual rules", () => {
  const prompt = buildDesignTargetPrompt({
    basePrompt: "Use compact UI tokens.",
    run,
    planning,
    goldenQualityLessons: { global_rules: ["H1 should be strong but not oversized."] }
  });

  assert.match(prompt, /generator-tool/);
  assert.match(prompt, /compact UI tokens/);
  assert.match(prompt, /H1 should be strong but not oversized/);
});

test("design target manifest paths are relative to run dir", async () => {
  const cwd = preparePromptCwd();
  const manifest = await createDesignTarget({
    run,
    planning,
    goldenQualityLessons: {},
    cwd,
    imageGenerator: async () => ({
      model: "mock-image-model",
      size: "1536x1024",
      bytes: Buffer.from("png")
    })
  });

  assert.equal(manifest.prompt_path, "design/design-target-prompt.md");
  assert.equal(manifest.target_desktop, "design/target-desktop.png");
  assert.equal(fs.existsSync(path.join(cwd, "runs/random-date-generator/design/target-desktop.png")), true);
});

test("reuse design uses existing target without image generation", async () => {
  const cwd = preparePromptCwd();
  const paths = getRunPaths("random-date-generator", cwd);
  fs.mkdirSync(paths.designDir, { recursive: true });
  fs.writeFileSync(paths.designTargetDesktop, "existing");

  const manifest = await createDesignTarget({
    run,
    planning,
    goldenQualityLessons: {},
    cwd,
    reuseDesign: true,
    imageGenerator: async () => {
      throw new Error("image generator should not be called");
    }
  });

  assert.equal(manifest.status, "reused");
  assert.equal(manifest.target_desktop, "design/target-desktop.png");
});

function preparePromptCwd(): string {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "lightsite-design-target-"));
  fs.mkdirSync(path.join(cwd, "prompts"), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, "prompts", "design-target.md"),
    "Generate target. Use compact UI tokens."
  );
  return cwd;
}
