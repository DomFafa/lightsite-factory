import test from "node:test";
import assert from "node:assert/strict";
import { buildPagesDnsRecord, planDnsRecordChange } from "./cloudflare-dns";

test("builds Cloudflare Pages DNS payload", () => {
  assert.deepEqual(
    buildPagesDnsRecord("https://401k-calculator.net/", "lightsite-401k-calculator.pages.dev"),
    {
      type: "CNAME",
      name: "401k-calculator.net",
      content: "lightsite-401k-calculator.pages.dev",
      proxied: true,
      ttl: 1
    }
  );
});

test("keeps matching DNS records", () => {
  const desired = buildPagesDnsRecord("401k-calculator.net", "site.pages.dev");
  assert.equal(
    planDnsRecordChange({ existing: { ...desired, id: "abc" }, desired }).action,
    "keep"
  );
});

test("reports DNS conflict without replace flag", () => {
  const desired = buildPagesDnsRecord("401k-calculator.net", "site.pages.dev");
  const plan = planDnsRecordChange({
    existing: { id: "abc", type: "A", name: "401k-calculator.net", content: "192.0.2.1" },
    desired
  });

  assert.equal(plan.action, "conflict");
});

test("plans replacement when replace flag is set", () => {
  const desired = buildPagesDnsRecord("401k-calculator.net", "site.pages.dev");
  const plan = planDnsRecordChange({
    existing: { id: "abc", type: "A", name: "401k-calculator.net", content: "192.0.2.1" },
    desired,
    replaceDns: true
  });

  assert.equal(plan.action, "replace");
});
