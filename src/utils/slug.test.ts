import test from "node:test";
import assert from "node:assert/strict";
import { slugifyKeyword } from "./slug";

test("slugifies 401k calculator", () => {
  assert.equal(slugifyKeyword("401k calculator"), "401k-calculator");
});

test("removes special characters", () => {
  assert.equal(slugifyKeyword("  401(k) calculator!! "), "401k-calculator");
});
