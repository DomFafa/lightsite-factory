import type { Page } from "playwright";

export type BehaviorAuditResult = {
  passed: boolean;
  checks: Record<string, boolean>;
  issues: string[];
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

export async function runBehaviorAudit(page: Page): Promise<BehaviorAuditResult> {
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
