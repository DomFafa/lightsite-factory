import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { appendImageUsage, appendTextUsage } from "./usage";

test("text usage writes usage jsonl", () => {
  const runDir = fs.mkdtempSync(path.join(os.tmpdir(), "lightsite-usage-"));
  appendTextUsage({
    runDir,
    stage: "planning",
    model: "test-model",
    usage: {
      prompt_tokens: 10,
      completion_tokens: 20,
      total_tokens: 30
    }
  });

  const record = readFirstRecord(runDir);
  assert.equal(record.stage, "planning");
  assert.equal(record.prompt_tokens, 10);
  assert.equal(record.completion_tokens, 20);
  assert.equal(record.total_tokens, 30);
});

test("missing text usage writes null fields", () => {
  const runDir = fs.mkdtempSync(path.join(os.tmpdir(), "lightsite-usage-"));
  appendTextUsage({
    runDir,
    stage: "site-generation",
    model: "test-model",
    usage: null
  });

  const record = readFirstRecord(runDir);
  assert.equal(record.prompt_tokens, null);
  assert.equal(record.completion_tokens, null);
  assert.equal(record.total_tokens, null);
});

test("image usage writes design-target record", () => {
  const runDir = fs.mkdtempSync(path.join(os.tmpdir(), "lightsite-usage-"));
  appendImageUsage({
    runDir,
    model: "image-model",
    imageSize: "1536x1024",
    imageCount: 1
  });

  const record = readFirstRecord(runDir);
  assert.equal(record.stage, "design-target");
  assert.equal(record.image_size, "1536x1024");
  assert.equal(record.image_count, 1);
});

function readFirstRecord(runDir: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(path.join(runDir, "usage.jsonl"), "utf8").trim());
}
