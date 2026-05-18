import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRun } from "./create-run";
import { readJson } from "../utils/json";

test("createRun normalizes domain before writing run metadata", () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "lightsite-factory-"));
  try {
    const { run, runDir } = createRun({
      keyword: "401k calculator",
      domain: "https://401k-calculator.net/",
      cwd
    });

    assert.equal(run.domain, "401k-calculator.net");
    assert.equal(readJson<{ domain: string }>(path.join(runDir, "run.json")).domain, "401k-calculator.net");
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test("createRun accepts equivalent normalized existing domains", () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "lightsite-factory-"));
  try {
    createRun({
      keyword: "401k calculator",
      domain: "http://401k-calculator.net",
      cwd
    });
    const { run } = createRun({
      keyword: "401k calculator",
      domain: "401k-calculator.net/",
      cwd
    });

    assert.equal(run.domain, "401k-calculator.net");
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});
