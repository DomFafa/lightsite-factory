import test from "node:test";
import assert from "node:assert/strict";
import { setCanonicalUrl, setRobotsMeta, updateSitemapDomain } from "./indexing-state";

test("draft state injects noindex robots meta", () => {
  const html = setRobotsMeta("<!doctype html><html><head><title>x</title></head></html>", "noindex,nofollow");
  assert.match(html, /<meta name="robots" content="noindex,nofollow">/);
});

test("published state replaces noindex with index follow", () => {
  const html = setRobotsMeta(
    '<html><head><meta name="robots" content="noindex,nofollow"></head></html>',
    "index,follow"
  );
  assert.match(html, /content="index,follow"/);
  assert.doesNotMatch(html, /noindex/);
});

test("published canonical uses normalized domain", () => {
  const html = setCanonicalUrl(
    '<html><head><link rel="canonical" href="https://old.example/"></head></html>',
    "https://401k-calculator.net/"
  );
  assert.match(html, /href="https:\/\/401k-calculator\.net\/"/);
});

test("published sitemap uses official domain", () => {
  const xml = updateSitemapDomain(
    "<urlset><url><loc>https://old.example/</loc></url></urlset>",
    "401k-calculator.net"
  );
  assert.equal(xml, "<urlset><url><loc>https://401k-calculator.net/</loc></url></urlset>");
});
