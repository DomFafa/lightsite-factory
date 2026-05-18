import test from "node:test";
import assert from "node:assert/strict";
import { resolveDeployIndexingState } from "./deploy";

test("keeps published indexing state when deploy has no publish flag", () => {
  assert.equal(
    resolveDeployIndexingState({ current: "published" }),
    "published"
  );
});

test("switches to draft only when draft flag is explicit", () => {
  assert.equal(
    resolveDeployIndexingState({ current: "published", draft: true }),
    "draft"
  );
});

test("defaults to draft when no indexing state exists and publish is not set", () => {
  assert.equal(resolveDeployIndexingState({}), "draft");
});

test("publish flag sets published from any previous state", () => {
  assert.equal(
    resolveDeployIndexingState({ current: "draft", publish: true }),
    "published"
  );
});

test("rejects conflicting publish and draft flags", () => {
  assert.throws(
    () => resolveDeployIndexingState({ publish: true, draft: true }),
    /either --publish or --draft/
  );
});
