import test from "node:test";
import assert from "node:assert/strict";
import { buildPagesDomainPayload, hostnamesForDomain } from "./cloudflare-pages-domain";

test("builds Pages custom domain payload", () => {
  assert.deepEqual(buildPagesDomainPayload("https://401k-calculator.net/"), {
    name: "401k-calculator.net"
  });
});

test("plans apex and www hostnames for an apex domain", () => {
  assert.deepEqual(hostnamesForDomain("401k-calculator.net"), [
    "401k-calculator.net",
    "www.401k-calculator.net"
  ]);
});

test("plans www then apex for a www domain", () => {
  assert.deepEqual(hostnamesForDomain("www.401k-calculator.net"), [
    "www.401k-calculator.net",
    "401k-calculator.net"
  ]);
});
