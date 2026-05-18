import fs from "node:fs";
import path from "node:path";
import { ensureDir } from "../utils/json";

export type GeneratedFile = {
  path: string;
  content: string;
};

const allowedSitePaths = new Set([
  "site/index.html",
  "site/css/style.css",
  "site/js/app.js",
  "site/robots.txt",
  "site/sitemap.xml"
]);

export function writeGeneratedSiteFiles(runDir: string, files: GeneratedFile[]): void {
  validateGeneratedSiteFiles(files);

  for (const file of files) {
    const normalized = normalizeGeneratedPath(file.path);
    const target = path.join(runDir, normalized);
    ensureDir(path.dirname(target));
    fs.writeFileSync(target, file.content, "utf8");
  }
}

export function validateGeneratedSiteFiles(files: GeneratedFile[]): void {
  const seen = new Set<string>();

  for (const file of files) {
    const normalized = normalizeGeneratedPath(file.path);
    if (!allowedSitePaths.has(normalized)) {
      throw new Error(`Generated file path is not allowed: ${file.path}`);
    }
    if (seen.has(normalized)) {
      throw new Error(`Generated file path is duplicated: ${file.path}`);
    }
    if (containsLikelySecret(file.content)) {
      throw new Error(`Generated file appears to contain a secret: ${file.path}`);
    }
    seen.add(normalized);
  }

  for (const required of allowedSitePaths) {
    if (!seen.has(required)) {
      throw new Error(`Generated site is missing required file: ${required}`);
    }
  }

  const html = files.find((file) => normalizeGeneratedPath(file.path) === "site/index.html")
    ?.content;
  if (!html) throw new Error("Generated site is missing index.html content");

  if (!html.includes("css/style.css")) {
    throw new Error("index.html must reference css/style.css");
  }
  if (!html.includes("js/app.js")) {
    throw new Error("index.html must reference js/app.js");
  }
  if (/<script\b[^>]+src=["'](?:https?:)?\/\//i.test(html)) {
    throw new Error("Generated site must not use external JavaScript CDNs");
  }
  if (/tailwindcss\.com|cdn\.tailwindcss/i.test(html)) {
    throw new Error("Generated site must not use Tailwind CDN");
  }
  if (containsForbiddenAppFeature(files)) {
    throw new Error("Generated site must not add login, database, or backend features");
  }
}

function normalizeGeneratedPath(filePath: string): string {
  if (path.isAbsolute(filePath)) {
    throw new Error(`Generated file path must be relative: ${filePath}`);
  }
  const normalized = filePath.replaceAll("\\", "/").replace(/^\.\/+/, "");
  if (normalized.includes("..")) {
    throw new Error(`Generated file path must not traverse directories: ${filePath}`);
  }
  return normalized;
}

function containsLikelySecret(content: string): boolean {
  return /sk-[A-Za-z0-9_-]{20,}|CLOUDFLARE_API_TOKEN\s*=|OPENAI_API_KEY\s*=/.test(
    content
  );
}

function containsForbiddenAppFeature(files: GeneratedFile[]): boolean {
  const html = files.find((file) => normalizeGeneratedPath(file.path) === "site/index.html")
    ?.content ?? "";
  const allContent = files.map((file) => file.content).join("\n");

  const explicitFeaturePatterns = [
    /<input\b[^>]*type=["']password["'][^>]*>/i,
    /<form\b[^>]*(?:action|id|class|aria-label)=["'][^"']*(?:login|log-in|signin|sign-in|auth|account)[^"']*["'][^>]*>/i,
    /<a\b[^>]*href=["'][^"']*\/(?:login|log-in|signin|sign-in|signup|sign-up|account)(?:[/?#][^"']*)?["'][^>]*>/i,
    /\b(?:sign in|signin|log in|login)\s+with\s+(?:google|github|facebook|apple|microsoft|email)\b/i,
    /\b(?:create|register)\s+(?:an?\s+)?account\b/i,
    /\b(?:user accounts?|authentication|auth provider|session management)\b/i
  ];

  const backendPatterns = [
    /\b(?:connects? to|stores? in|writes? to)\s+(?:a\s+)?(?:database|backend)\b/i,
    /\b(?:supabase|firebase|postgres|mysql|mongodb|database)\s+(?:url|client|connection)\b/i,
    /\bfetch\s*\(\s*["']\/api\//i,
    /\bfetch\s*\(\s*["']https?:\/\/api\./i,
    /\bXMLHttpRequest\b/i
  ];

  return (
    explicitFeaturePatterns.some((pattern) => pattern.test(html)) ||
    backendPatterns.some((pattern) => pattern.test(allContent)) ||
    containsForbiddenBackendSentence(allContent)
  );
}

function containsForbiddenBackendSentence(content: string): boolean {
  const plainText = content.replace(/<[^>]+>/g, " ");
  const sentences = plainText.split(/(?<=[.!?])\s+|\n+/);
  const backendFeaturePattern =
    /\b(?:backend|server-side|database)\s+(?:api|endpoint|service|server|connection|storage)\b/i;

  return sentences.some((sentence) => {
    const trimmed = sentence.trim();
    if (!trimmed || /^no\s+/i.test(trimmed)) return false;
    return backendFeaturePattern.test(trimmed);
  });
}
