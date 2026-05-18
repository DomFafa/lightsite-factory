import test from "node:test";
import assert from "node:assert/strict";
import { chooseDifferentNumericInputValue } from "./behavior-audit";

test("chooses a different annual salary value", () => {
  assert.equal(
    chooseDifferentNumericInputValue("98000", {
      delta: 10_000,
      fallback: 90_000,
      min: 1,
      max: 10_000_000
    }),
    "108000"
  );
});

test("chooses a different contribution value when default is 12", () => {
  assert.equal(
    chooseDifferentNumericInputValue("12", { delta: 1, fallback: 13, min: 0, max: 50 }),
    "13"
  );
});

test("keeps percentage values within max range", () => {
  assert.equal(
    chooseDifferentNumericInputValue("100", { delta: 5, fallback: 80, min: 0, max: 100 }),
    "95"
  );
});
