import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPlanningInput,
  buildSiteGenerationInput,
  shouldStopForComplexTool,
  shouldUseDesignTarget,
  generateSite,
  is401kCalculator,
  required401kFormula
} from "./generate";

test("detects 401k calculator keywords only when calculator intent is clear", () => {
  assert.equal(is401kCalculator("401k calculator"), true);
  assert.equal(is401kCalculator("401(k) calculator"), true);
  assert.equal(is401kCalculator("minecraft skin maker"), false);
});

test("non-401k planning input does not include required 401k fields", () => {
  const input = buildPlanningInput({
    keyword: "minecraft skin maker",
    language: "en",
    designSeed: {},
    goldenQualityLessons: {}
  });

  assert.equal("required_401k_inputs" in input, false);
  assert.equal("required_401k_outputs" in input, false);
  assert.equal("required_401k_formula" in input, false);
});

test("401k planning input includes required 401k fields and formula", () => {
  const input = buildPlanningInput({
    keyword: "401(k) calculator",
    language: "en",
    designSeed: {},
    goldenQualityLessons: {}
  });

  assert.ok(Array.isArray(input.required_401k_inputs));
  assert.ok(Array.isArray(input.required_401k_outputs));
  assert.equal(input.required_401k_formula, required401kFormula);
});

test("site generation input tells non-401k tools to use planning tool spec", () => {
  const input = buildSiteGenerationInput({
    run: { keyword: "minecraft skin maker", site_id: "minecraft-skin-maker" },
    brief: {
      keyword: "minecraft skin maker",
      site_type: "canvas editor",
      target_users: ["players"],
      primary_goal: "Make a skin.",
      non_goals: ["accounts"]
    },
    designBrief: {
      visual_mood: "playful utility",
      layout_archetype: "colorful-generator-studio",
      senior_friendly: true,
      style_rules: ["clear"],
      forbidden_styles: ["backend dashboard"]
    },
    seoPlan: {
      title: "Minecraft Skin Maker",
      meta_description: "Make a skin.",
      canonical_url: "https://example.com/",
      h1: "Minecraft Skin Maker",
      required_sections: ["tool", "FAQ"],
      structured_data: ["SoftwareApplication", "FAQPage"]
    },
    toolSpec: {
      tool_family: "canvas-editor",
      complexity: "complex",
      inputs: ["canvas", "brush color"],
      outputs: ["downloadable PNG"],
      controls: ["toolbar"],
      primary_actions: ["draw"],
      secondary_actions: ["export"],
      states: ["editing"],
      validation_rules: ["PNG only"],
      local_only_requirements: ["local file handling"],
      disclaimer: "Unofficial fan tool.",
      implementation_notes: ["Canvas edits update a PNG."]
    },
    uiFingerprint: {},
    goldenQualityLessons: {},
    indexNowKeyFile: "key.txt"
  });

  assert.equal(input.tool_requirements_source, "planning_tool_spec");
  assert.match(String(input.instruction), /tool_spec/);
  assert.equal("required_401k_inputs" in input, false);
});

test("code-only skips image design target", () => {
  assert.equal(shouldUseDesignTarget({ codeOnly: true }), false);
  assert.equal(shouldUseDesignTarget({}), true);
});

test("complex tool without allow-complex stops before site generation", () => {
  assert.equal(
    shouldStopForComplexTool({
      keyword: "minecraft skin maker",
      siteType: "canvas editor",
      complexity: "complex"
    }),
    true
  );
});

test("simple tool continues generation", () => {
  assert.equal(
    shouldStopForComplexTool({
      keyword: "random date generator",
      siteType: "generator tool",
      complexity: "simple"
    }),
    false
  );
});

test("rejects conflicting code-only and design-only flags", async () => {
  await assert.rejects(
    () =>
      generateSite({
        keyword: "word counter",
        codeOnly: true,
        designOnly: true
      }),
    /Use either --code-only or --design-only/
  );
});
