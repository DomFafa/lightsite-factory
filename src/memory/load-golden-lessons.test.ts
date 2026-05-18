import test from "node:test";
import assert from "node:assert/strict";
import { loadGoldenLessons } from "./load-golden-lessons";

test("random date generator receives compact UI token global rules", () => {
  const lessons = loadGoldenLessons({ keyword: "random date generator" });

  assert.ok(lessons.global_rules.length > 0);
  assert.ok(
    lessons.global_rules.some((rule) => /compact UI tokens/i.test(rule)),
    "random date should inherit compact UI token guidance"
  );
  assert.equal(lessons.calculator_family_rules.length, 0);
  assert.equal(lessons.sample_specific_rules.length, 0);
  assert.equal(lessons.confirmed_sizing_rules.length, 0);
});

test("minecraft skin maker does not receive 401k sample-specific rules", () => {
  const lessons = loadGoldenLessons({ keyword: "minecraft skin maker" });

  assert.ok(lessons.global_rules.length > 0);
  assert.equal(lessons.sample_specific_rules.length, 0);
  assert.equal(
    lessons.global_rules.some((rule) => /401\(k\)|401k/i.test(rule)),
    false
  );
});

test("percentage calculator receives global and calculator-family rules", () => {
  const lessons = loadGoldenLessons({ keyword: "percentage calculator" });

  assert.ok(lessons.global_rules.length > 0);
  assert.ok(lessons.calculator_family_rules.length > 0);
  assert.equal(lessons.sample_specific_rules.length, 0);
  assert.ok(lessons.confirmed_sizing_rules.length > 0);
});

test("401k calculator receives global, calculator-family, and sample-specific rules", () => {
  const lessons = loadGoldenLessons({ keyword: "401(k) calculator" });

  assert.ok(lessons.global_rules.length > 0);
  assert.ok(lessons.calculator_family_rules.length > 0);
  assert.ok(lessons.sample_specific_rules.length > 0);
  assert.ok(lessons.confirmed_sizing_rules.length > 0);
});
