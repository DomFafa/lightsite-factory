import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { getIndexNowKeyFilePath, getRunPaths } from "./run-paths";

test("run dir path is resolved from site id", () => {
  const cwd = path.join(path.sep, "tmp", "lightsite-factory");
  const paths = getRunPaths("401k-calculator", cwd);
  assert.equal(paths.runDir, path.join(cwd, "runs", "401k-calculator"));
});

test("site path is inside run dir", () => {
  const cwd = path.join(path.sep, "tmp", "lightsite-factory");
  const paths = getRunPaths("runs/401k-calculator", cwd);
  assert.equal(paths.siteDir, path.join(cwd, "runs", "401k-calculator", "site"));
});

test("indexnow key file path is in site root", () => {
  const runDir = path.join(path.sep, "tmp", "lightsite-factory", "runs", "401k-calculator");
  assert.equal(
    getIndexNowKeyFilePath(runDir, "abc12345"),
    path.join(runDir, "site", "abc12345.txt")
  );
});
