import test from "node:test";
import assert from "node:assert/strict";
import { after, before } from "node:test";
import { Browser, chromium, Page } from "playwright";
import {
  chooseDifferentNumericInputValue,
  runBehaviorAudit,
  shouldUse401kBehaviorAudit
} from "./behavior-audit";

let browser: Browser;

before(async () => {
  browser = await chromium.launch();
});

after(async () => {
  await browser.close();
});

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

test("generic behavior audit does not require 401k IDs", async () => {
  const page = await newPageWithContent(`
    <main>
      <h1>Minecraft Skin Maker</h1>
      <p>Runs locally in your browser. Files are not uploaded.</p>
      <canvas id="skin-canvas" width="64" height="64" style="width: 128px; height: 128px"></canvas>
      <button type="button">Draw</button>
      <button type="button">New blank skin</button>
      <button type="button">Download PNG skin</button>
    </main>
  `);

  try {
    const result = await runBehaviorAudit(page, {
      keyword: "minecraft skin maker",
      siteType: "canvas editor"
    });

    assert.equal(result.passed, true);
    assert.equal("input_current-age" in result.checks, false);
    assert.equal(result.checks.canvas_editor_has_canvas, true);
    assert.equal(result.checks.canvas_editor_has_local_only_copy, true);
  } finally {
    await page.close();
  }
});

test("401k behavior audit still checks 401k fields", async () => {
  const page = await newPageWithContent(`
    <main>
      <h1>401(k) Calculator</h1>
      <button type="button">Not enough fields</button>
    </main>
  `);

  try {
    const result = await runBehaviorAudit(page, { keyword: "401k calculator" });

    assert.equal(shouldUse401kBehaviorAudit({ keyword: "401k calculator" }), true);
    assert.equal(result.passed, false);
    assert.equal(result.checks["input_current-age"], false);
    assert.ok(result.issues.includes("Behavior check failed: input_current-age"));
  } finally {
    await page.close();
  }
});

async function newPageWithContent(body: string): Promise<Page> {
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  await page.setContent(`<!doctype html><html><body>${body}</body></html>`);
  return page;
}
