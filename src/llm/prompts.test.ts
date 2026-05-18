import test from "node:test";
import assert from "node:assert/strict";
import { readPrompt } from "./prompts";

test("generate-site prompt keeps financial disclaimer out of global requirements", () => {
  const prompt = readPrompt("generate-site.md");
  const [globalSection, rest] = prompt.split("401(k)-only requirements:");

  assert.ok(rest, "prompt should have a 401(k)-only requirements section");
  assert.doesNotMatch(globalSection, /financial,\s*investment,\s*tax,\s*or\s*legal\s*advice/i);
  assert.match(rest, /financial,\s*investment,\s*tax,\s*or\s*legal\s*advice/i);
});

test("generate-brief prompt treats 401k as external memory only", () => {
  const prompt = readPrompt("generate-brief.md");

  assert.match(prompt, /external memory and quality guidance only/i);
  assert.match(prompt, /Do not include financial disclaimers unless the tool is financial/i);
});
