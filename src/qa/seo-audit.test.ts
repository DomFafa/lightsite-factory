import test from "node:test";
import assert from "node:assert/strict";
import { auditSeo } from "./seo-audit";

const validHtml = `<!doctype html>
<html lang="en">
  <head>
    <title>401(k) Calculator - Estimate Your Retirement Savings</title>
    <meta name="description" content="Use this 401(k) calculator to estimate your retirement balance.">
    <link rel="canonical" href="https://401k-calculator.net/">
    <script type="application/ld+json">
      {"@context":"https://schema.org","@type":"SoftwareApplication","name":"401(k) Calculator"}
    </script>
    <script type="application/ld+json">
      {"@context":"https://schema.org","@type":"FAQPage","mainEntity":[]}
    </script>
  </head>
  <body>
    <main>
      <section>
        <h1>401(k) Calculator</h1>
        <p>FAQ</p>
        <p>Educational estimate only. This calculator does not provide financial, investment, tax, or legal advice. Results are hypothetical and not guaranteed.</p>
      </section>
    </main>
  </body>
</html>`;

test("checks title, meta, canonical, H1, and JSON-LD", () => {
  const result = auditSeo({
    html: validHtml,
    domain: "401k-calculator.net",
    robots: "User-agent: *\nAllow: /\n",
    sitemap: `<urlset><url><loc>https://401k-calculator.net/</loc></url></urlset>`
  });

  assert.equal(result.passed, true);
  assert.equal(result.checks.title, true);
  assert.equal(result.checks.meta_description, true);
  assert.equal(result.checks.canonical, true);
  assert.equal(result.checks.unique_h1, true);
  assert.equal(result.checks.software_application_json_ld, true);
  assert.equal(result.checks.faq_page_json_ld, true);
  assert.equal(result.checks.required_disclaimers, true);
});

test("finds missing SEO items", () => {
  const result = auditSeo({
    html: "<main><h1>Only H1</h1><h1>Duplicate</h1></main>",
    robots: "",
    sitemap: ""
  });

  assert.equal(result.passed, false);
  assert.equal(result.checks.title, false);
  assert.equal(result.checks.meta_description, false);
  assert.equal(result.checks.canonical, false);
  assert.equal(result.checks.unique_h1, false);
  assert.ok(result.issues.length > 0);
});

test("reports exactly which required disclaimer text is missing", () => {
  const result = auditSeo({
    html: validHtml.replace("Educational estimate only.", ""),
    robots: "User-agent: *",
    sitemap: "<urlset><url><loc>https://401k-calculator.net/</loc></url></urlset>"
  });

  assert.equal(result.passed, false);
  assert.equal(result.checks.required_disclaimers, false);
  assert.ok(
    result.issues.includes("Missing required disclaimer: Educational estimate only.")
  );
});

test("allows noindex for draft pages", () => {
  const result = auditSeo({
    html: validHtml.replace("<head>", '<head><meta name="robots" content="noindex,nofollow">'),
    indexingState: "draft",
    robots: "User-agent: *",
    sitemap: "<urlset><url><loc>https://401k-calculator.net/</loc></url></urlset>"
  });

  assert.equal(result.checks.draft_indexing_allowed, true);
});

test("fails noindex for published pages", () => {
  const result = auditSeo({
    html: validHtml.replace("<head>", '<head><meta name="robots" content="noindex,nofollow">'),
    indexingState: "published",
    robots: "User-agent: *",
    sitemap: "<urlset><url><loc>https://401k-calculator.net/</loc></url></urlset>"
  });

  assert.equal(result.passed, false);
  assert.equal(result.checks.no_noindex_when_published, false);
});
