import test from "node:test";
import assert from "node:assert/strict";
import { ToolSpecSchema } from "./schemas";

test("ToolSpec allows generator tools without formula summary", () => {
  const spec = ToolSpecSchema.parse({
    tool_family: "generator-tool",
    complexity: "simple",
    inputs: ["start date", "end date"],
    outputs: ["random date list"],
    controls: ["date inputs", "count input"],
    primary_actions: ["generate dates"],
    secondary_actions: ["copy", "download CSV"],
    states: ["empty", "generated", "validation error"],
    validation_rules: ["end date must be after start date"],
    local_only_requirements: ["run in browser"],
    disclaimer: "Convenience generator only.",
    implementation_notes: ["Use browser-side randomization."]
  });

  assert.equal(spec.tool_family, "generator-tool");
  assert.equal(spec.formula_summary, undefined);
});

test("ToolSpec allows 401k formula summary", () => {
  const spec = ToolSpecSchema.parse({
    tool_family: "finance-calculator",
    complexity: "medium",
    inputs: ["current age"],
    outputs: ["projected balance"],
    controls: ["number inputs"],
    primary_actions: ["calculate"],
    secondary_actions: ["reset"],
    states: ["valid", "invalid"],
    validation_rules: ["retirement age must be greater than current age"],
    local_only_requirements: ["run locally"],
    disclaimer: "Educational estimate only.",
    implementation_notes: ["Compound annually."],
    formula_summary: "Compound contributions annually."
  });

  assert.equal(spec.formula_summary, "Compound contributions annually.");
});
