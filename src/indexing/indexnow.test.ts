import test from "node:test";
import assert from "node:assert/strict";
import {
  buildIndexNowPayload,
  extractUrlsFromSitemap,
  generateIndexNowKey
} from "./indexnow";

test("generate key format is valid for IndexNow", () => {
  const key = generateIndexNowKey();
  assert.match(key, /^[a-f0-9]{64}$/);
});

test("builds submit payload", () => {
  const payload = buildIndexNowPayload({
    domain: "401k-calculator.net",
    key: "abc12345",
    urls: ["https://401k-calculator.net/"]
  });

  assert.deepEqual(payload, {
    host: "401k-calculator.net",
    key: "abc12345",
    keyLocation: "https://401k-calculator.net/abc12345.txt",
    urlList: ["https://401k-calculator.net/"]
  });
});

test("builds fallback URL when URL list is empty", () => {
  const payload = buildIndexNowPayload({
    domain: "https://401k-calculator.net/",
    key: "abc12345",
    urls: []
  });
  assert.deepEqual(payload.urlList, ["https://401k-calculator.net/"]);
});

test("extracts sitemap URLs", () => {
  const urls = extractUrlsFromSitemap(`<?xml version="1.0"?>
    <urlset>
      <url><loc>https://401k-calculator.net/</loc></url>
      <url><loc>https://401k-calculator.net/about</loc></url>
    </urlset>`);

  assert.deepEqual(urls, [
    "https://401k-calculator.net/",
    "https://401k-calculator.net/about"
  ]);
});
