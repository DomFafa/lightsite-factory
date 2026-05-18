import fs from "node:fs";
import path from "node:path";

export type SeoAuditResult = {
  passed: boolean;
  checks: Record<string, boolean>;
  issues: string[];
  json_ld_types: string[];
};

export function auditSeo(args: {
  html: string;
  domain?: string;
  robots?: string;
  sitemap?: string;
  indexingState?: "draft" | "published";
}): SeoAuditResult {
  const checks: Record<string, boolean> = {};
  const issues: string[] = [];

  checks.title = /<title>[^<]+<\/title>/i.test(args.html);
  checks.meta_description =
    /<meta\s+[^>]*name=["']description["'][^>]*content=["'][^"']+["'][^>]*>/i.test(
      args.html
    ) ||
    /<meta\s+[^>]*content=["'][^"']+["'][^>]*name=["']description["'][^>]*>/i.test(
      args.html
    );
  checks.canonical =
    /<link\s+[^>]*rel=["']canonical["'][^>]*href=["'][^"']+["'][^>]*>/i.test(
      args.html
    ) ||
    /<link\s+[^>]*href=["'][^"']+["'][^>]*rel=["']canonical["'][^>]*>/i.test(
      args.html
    );
  const h1Count = (args.html.match(/<h1\b/gi) ?? []).length;
  checks.unique_h1 = h1Count === 1;
  checks.semantic_main = /<main\b/i.test(args.html);
  checks.semantic_section = /<section\b/i.test(args.html);
  checks.faq = /faq/i.test(args.html);
  const missingDisclaimers = findMissingDisclaimers(args.html);
  checks.required_disclaimers = missingDisclaimers.length === 0;
  const hasNoindex = /<meta\s+[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(
    args.html
  );
  if (args.indexingState === "published") {
    checks.no_noindex_when_published = !hasNoindex;
  } else if (args.indexingState === "draft") {
    checks.draft_indexing_allowed = true;
  }

  const jsonLdTypes = extractJsonLdTypes(args.html, issues);
  checks.software_application_json_ld = jsonLdTypes.includes("SoftwareApplication");
  checks.faq_page_json_ld = jsonLdTypes.includes("FAQPage");

  checks.robots = args.robots !== undefined ? /User-agent:\s*\*/i.test(args.robots) : false;
  checks.sitemap =
    args.sitemap !== undefined ? /<urlset\b/i.test(args.sitemap) && /<loc>/i.test(args.sitemap) : false;

  if (args.domain && args.sitemap) {
    checks.sitemap_domain = extractLocs(args.sitemap).every((url) =>
      url.startsWith(`https://${args.domain}`)
    );
  }

  for (const [name, passed] of Object.entries(checks)) {
    if (!passed) issues.push(`Missing or invalid SEO check: ${name}`);
  }
  for (const disclaimer of missingDisclaimers) {
    issues.push(`Missing required disclaimer: ${disclaimer}`);
  }

  return {
    passed: issues.length === 0,
    checks,
    issues,
    json_ld_types: jsonLdTypes
  };
}

function findMissingDisclaimers(html: string): string[] {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const required = [
    "Educational estimate only.",
    "financial, investment, tax, or legal advice",
    "Results are hypothetical and not guaranteed"
  ];

  return required.filter((phrase) => !text.toLowerCase().includes(phrase.toLowerCase()));
}

export function auditSeoFiles(
  siteDir: string,
  domain?: string,
  indexingState?: "draft" | "published"
): SeoAuditResult {
  const html = readIfExists(path.join(siteDir, "index.html"));
  const robots = readIfExists(path.join(siteDir, "robots.txt"));
  const sitemap = readIfExists(path.join(siteDir, "sitemap.xml"));
  return auditSeo({ html, robots, sitemap, domain, indexingState });
}

function extractJsonLdTypes(html: string, issues: string[]): string[] {
  const types: string[] = [];
  const scriptPattern =
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = scriptPattern.exec(html))) {
    try {
      const parsed = JSON.parse(match[1].trim()) as unknown;
      collectTypes(parsed, types);
    } catch (error) {
      issues.push(`Invalid JSON-LD: ${String(error)}`);
    }
  }

  return [...new Set(types)];
}

function collectTypes(value: unknown, types: string[]): void {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const item of value) collectTypes(item, types);
    return;
  }

  const record = value as Record<string, unknown>;
  const type = record["@type"];
  if (typeof type === "string") types.push(type);
  if (Array.isArray(type)) {
    for (const item of type) {
      if (typeof item === "string") types.push(item);
    }
  }

  for (const nested of Object.values(record)) collectTypes(nested, types);
}

function extractLocs(xml: string): string[] {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((match) => match[1]);
}

function readIfExists(filePath: string): string {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
}
