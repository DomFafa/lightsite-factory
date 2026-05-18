import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { inferToolPlan, writePlan } from "./plan";

test("minecraft skin maker is a complex canvas editor", () => {
  const plan = inferToolPlan("minecraft skin maker");

  assert.equal(plan.inferred_tool_type, "canvas-editor");
  assert.equal(plan.complexity, "complex");
  assert.ok(
    plan.risk_notes.includes(
      "This is a complex interactive tool. Confirm the V1 scope before full generation."
    )
  );
});

test("word counter is a simple text tool", () => {
  const plan = inferToolPlan("word counter");

  assert.equal(plan.inferred_tool_type, "text-tool");
  assert.equal(plan.complexity, "simple");
  assert.equal(plan.competitor_research_needed, false);
});

test("writes plan json and markdown files", () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "lightsite-plan-"));
  const runDir = writePlan("word counter", cwd);

  assert.equal(fs.existsSync(path.join(runDir, "plan.json")), true);
  assert.equal(fs.existsSync(path.join(runDir, "plan.md")), true);
});
