import type { Page } from "playwright";
import { is401kCalculator, isCanvasEditorTool } from "../utils/tool-classification";

export type BehaviorAuditResult = {
  passed: boolean;
  checks: Record<string, boolean>;
  issues: string[];
};

export type BehaviorAuditContext = {
  keyword?: string;
  siteId?: string;
  siteType?: string;
};

const inputIds = [
  "current-age",
  "retirement-age",
  "current-balance",
  "annual-salary",
  "employee-contribution-percent",
  "employer-match-percent",
  "match-limit-percent",
  "annual-return-percent",
  "salary-increase-percent"
];

const outputIds = [
  "projected-balance",
  "user-contributions",
  "employer-match-total",
  "investment-growth",
  "monthly-retirement-income",
  "balance-over-time"
];

export async function runBehaviorAudit(
  page: Page,
  context: BehaviorAuditContext = {}
): Promise<BehaviorAuditResult> {
  if (shouldUse401kBehaviorAudit(context)) return run401kBehaviorAudit(page);
  return runGenericBehaviorAudit(page, context);
}

export function shouldUse401kBehaviorAudit(context: BehaviorAuditContext): boolean {
  return [context.keyword, context.siteId].filter(Boolean).some((value) => is401kCalculator(value ?? ""));
}

async function run401kBehaviorAudit(page: Page): Promise<BehaviorAuditResult> {
  const checks: Record<string, boolean> = {};
  const issues: string[] = [];

  for (const id of inputIds) {
    checks[`input_${id}`] = await page.locator(`#${id}`).count().then((count) => count === 1);
  }
  for (const id of outputIds) {
    checks[`output_${id}`] = await page.locator(`#${id}`).count().then((count) => count >= 1);
  }
  checks.reset_button = await page.locator("#reset-calculator").count().then((count) => count === 1);

  await assertNumericInputResultChanges(
    page,
    checks,
    "annual_salary_changes_result",
    "#annual-salary",
    { delta: 10_000, fallback: 90_000, min: 1, max: 10_000_000 }
  );
  await assertNumericInputResultChanges(
    page,
    checks,
    "employee_contribution_changes_result",
    "#employee-contribution-percent",
    { delta: 1, fallback: 13, min: 0, max: 50 }
  );
  await assertNumericInputResultChanges(
    page,
    checks,
    "employer_match_changes_result",
    "#employer-match-percent",
    { delta: 5, fallback: 75, min: 0, max: 100 }
  );
  await assertNumericInputResultChanges(
    page,
    checks,
    "annual_return_changes_result",
    "#annual-return-percent",
    { delta: 1, fallback: 7, min: 0, max: 20 }
  );
  await assertNumericInputResultChanges(
    page,
    checks,
    "retirement_age_changes_result",
    "#retirement-age",
    { delta: 3, fallback: 70, min: 18, max: 90 }
  );

  checks.reset_restores_defaults = await testReset(page);

  for (const [name, passed] of Object.entries(checks)) {
    if (!passed) issues.push(`Behavior check failed: ${name}`);
  }

  return { passed: issues.length === 0, checks, issues };
}

async function runGenericBehaviorAudit(
  page: Page,
  context: BehaviorAuditContext
): Promise<BehaviorAuditResult> {
  const checks: Record<string, boolean> = {};
  const issues: string[] = [];

  checks.main_exists = await page.locator("main").count().then((count) => count >= 1);
  checks.interactive_control_exists = await page
    .locator("button,input,select,textarea,canvas")
    .count()
    .then((count) => count >= 1);

  const canvasCount = await page.locator("canvas").count();
  if (canvasCount > 0) {
    checks.canvas_visible_with_size = await hasVisibleSizedCanvas(page);
  }

  checks.download_export_click_no_console_error = await clickOptionalActionWithoutConsoleError(
    page,
    /download|export/i
  );
  checks.reset_clear_new_click_no_console_error = await clickOptionalActionWithoutConsoleError(
    page,
    /reset|clear|new/i
  );

  if (isCanvasEditorTool(context)) {
    checks.canvas_editor_has_canvas = canvasCount > 0;
    checks.canvas_editor_has_edit_or_file_control = await hasCanvasEditorControl(page);
    checks.canvas_editor_has_local_only_copy = await hasLocalOnlyCopy(page);
  }

  for (const [name, passed] of Object.entries(checks)) {
    if (!passed) issues.push(`Behavior check failed: ${name}`);
  }

  return { passed: issues.length === 0, checks, issues };
}

async function hasVisibleSizedCanvas(page: Page): Promise<boolean> {
  const canvases = page.locator("canvas");
  const count = await canvases.count();
  for (let index = 0; index < count; index++) {
    const canvas = canvases.nth(index);
    if (!(await canvas.isVisible())) continue;
    const box = await canvas.boundingBox();
    if (box && box.width > 0 && box.height > 0) return true;
  }
  return false;
}

async function clickOptionalActionWithoutConsoleError(page: Page, labelPattern: RegExp): Promise<boolean> {
  const action = await findActionControl(page, labelPattern);
  if (!action) return true;

  const consoleErrors: string[] = [];
  const onConsole = (message: { type(): string; text(): string }) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  };
  const onPageError = (error: Error) => consoleErrors.push(error.message);

  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  try {
    await Promise.all([
      page.waitForEvent("download", { timeout: 750 }).catch(() => undefined),
      action.click({ timeout: 2000 })
    ]);
    await page.waitForTimeout(100);
    return consoleErrors.length === 0;
  } catch {
    return false;
  } finally {
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
  }
}

async function findActionControl(page: Page, labelPattern: RegExp) {
  const controls = page.locator("button,a,label");
  const count = await controls.count();
  for (let index = 0; index < count; index++) {
    const control = controls.nth(index);
    const text = await control.textContent().catch(() => "");
    if (labelPattern.test(text ?? "") && (await control.isVisible().catch(() => false))) {
      return control;
    }
  }
  return undefined;
}

async function hasCanvasEditorControl(page: Page): Promise<boolean> {
  const text = await page
    .locator("button,label,input,select")
    .evaluateAll((elements) =>
      elements
        .map((element) =>
          [
            element.id,
            element.getAttribute("aria-label"),
            element.getAttribute("for"),
            element.textContent
          ]
            .filter(Boolean)
            .join(" ")
        )
        .join(" ")
    );
  return /draw|edit|import|export|download/i.test(text);
}

async function hasLocalOnlyCopy(page: Page): Promise<boolean> {
  const text = await page.locator("body").innerText();
  return /local|browser|no upload|not uploaded|no sign[- ]?up|private/i.test(text);
}

async function assertResultChanges(
  page: Page,
  checks: Record<string, boolean>,
  checkName: string,
  selector: string,
  value: string
): Promise<void> {
  const exists = await page.locator(selector).count();
  const resultExists = await page.locator("#projected-balance").count();
  if (!exists || !resultExists) {
    checks[checkName] = false;
    return;
  }

  try {
    const before = await resultText(page);
    await page.fill(selector, value);
    await page.locator(selector).dispatchEvent("input");
    await page.waitForTimeout(100);
    const after = await resultText(page);
    checks[checkName] = before !== after;
  } catch {
    checks[checkName] = false;
  }
}

async function assertNumericInputResultChanges(
  page: Page,
  checks: Record<string, boolean>,
  checkName: string,
  selector: string,
  options: {
    delta: number;
    fallback: number;
    min: number;
    max: number;
  }
): Promise<void> {
  const exists = await page.locator(selector).count();
  if (!exists) {
    checks[checkName] = false;
    return;
  }

  const nextValue = chooseDifferentNumericInputValue(await page.inputValue(selector), options);
  await assertResultChanges(page, checks, checkName, selector, nextValue);
}

export function chooseDifferentNumericInputValue(
  currentInput: string,
  options: {
    delta: number;
    fallback: number;
    min: number;
    max: number;
  }
): string {
  const current = Number(currentInput);
  if (!Number.isFinite(current)) return String(options.fallback);

  let next = current + options.delta;
  if (next > options.max) next = current - options.delta;
  if (next < options.min || next === current) next = options.fallback;
  if (next === current) next = current === options.min ? options.max : options.min;

  return String(Math.min(options.max, Math.max(options.min, next)));
}

async function testReset(page: Page): Promise<boolean> {
  if ((await page.locator("#annual-salary").count()) !== 1) return false;
  if ((await page.locator("#reset-calculator").count()) !== 1) return false;

  await page.fill("#annual-salary", "123456");
  await page.locator("#annual-salary").dispatchEvent("input");
  await page.click("#reset-calculator");
  await page.waitForTimeout(100);
  const resetValue = await page.inputValue("#annual-salary");
  return resetValue !== "123456" && resetValue.length > 0;
}

async function resultText(page: Page): Promise<string> {
  return page.locator("#projected-balance").innerText({ timeout: 3000 });
}
