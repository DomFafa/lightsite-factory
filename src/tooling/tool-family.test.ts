import test from "node:test";
import assert from "node:assert/strict";
import { inferToolFamily } from "./tool-family";

test("random date generator is a generator tool", () => {
  const family = inferToolFamily({ keyword: "random date generator" });

  assert.equal(family.primary, "generator-tool");
  assert.equal(family.is401k, false);
  assert.equal(family.isComplex, false);
});

test("word counter is a text tool", () => {
  const family = inferToolFamily({ keyword: "word counter" });

  assert.equal(family.primary, "text-tool");
});

test("401k calculator is a finance calculator and 401k sample", () => {
  const family = inferToolFamily({ keyword: "401(k) calculator" });

  assert.equal(family.primary, "finance-calculator");
  assert.equal(family.is401k, true);
  assert.equal(family.isFinancial, true);
});

test("minecraft skin maker is a complex canvas editor with fan-tool secondary", () => {
  const family = inferToolFamily({ keyword: "minecraft skin maker" });

  assert.equal(family.primary, "canvas-editor");
  assert.equal(family.secondary.includes("brand-fan-tool"), true);
  assert.equal(family.isComplex, true);
});
