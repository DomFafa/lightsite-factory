import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPlanningInput,
  buildSiteGenerationInput,
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
      inputs: ["canvas", "brush color"],
      outputs: ["downloadable PNG"],
      formula_summary: "Canvas edits update a PNG.",
      disclaimer: "Unofficial fan tool."
    },
    uiFingerprint: {},
    goldenQualityLessons: {},
    indexNowKeyFile: "key.txt"
  });

  assert.equal(input.tool_requirements_source, "planning_tool_spec");
  assert.match(String(input.instruction), /tool_spec/);
  assert.equal("required_401k_inputs" in input, false);
});
