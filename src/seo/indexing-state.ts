import fs from "node:fs";
import path from "node:path";
import { normalizeDomain } from "../run/run-meta";

export type IndexingState = "draft" | "published";

export function applyIndexingState(args: {
  siteDir: string;
  state: IndexingState;
  domain?: string;
}): void {
  const htmlPath = path.join(args.siteDir, "index.html");
  const robotsPath = path.join(args.siteDir, "robots.txt");
  const sitemapPath = path.join(args.siteDir, "sitemap.xml");

  if (!fs.existsSync(htmlPath)) throw new Error(`Missing index.html: ${htmlPath}`);
  if (!fs.existsSync(robotsPath)) throw new Error(`Missing robots.txt: ${robotsPath}`);
  if (!fs.existsSync(sitemapPath)) throw new Error(`Missing sitemap.xml: ${sitemapPath}`);

  const domain = args.domain ? normalizeDomain(args.domain) : undefined;
  if (args.state === "published" && !domain) {
    throw new Error("--publish requires run.json.domain");
  }

  const html = fs.readFileSync(htmlPath, "utf8");
  fs.writeFileSync(
    htmlPath,
    args.state === "published"
      ? setPublishedHtml(html, domain!)
      : setRobotsMeta(html, "noindex,nofollow"),
    "utf8"
  );

  fs.writeFileSync(robotsPath, "User-agent: *\nAllow: /\n", "utf8");

  if (args.state === "published") {
    fs.writeFileSync(
      sitemapPath,
      updateSitemapDomain(fs.readFileSync(sitemapPath, "utf8"), domain!),
      "utf8"
    );
  }
}

export function setRobotsMeta(html: string, content: string): string {
  if (/<meta\s+[^>]*name=["']robots["'][^>]*>/i.test(html)) {
    return html.replace(
      /<meta\s+[^>]*name=["']robots["'][^>]*>/i,
      `<meta name="robots" content="${content}">`
    );
  }

  return html.replace(/<head>/i, `<head>\n  <meta name="robots" content="${content}">`);
}

export function setCanonicalUrl(html: string, domain: string): string {
  const canonical = `https://${normalizeDomain(domain)}/`;
  if (/<link\s+[^>]*rel=["']canonical["'][^>]*>/i.test(html)) {
    return html.replace(
      /<link\s+[^>]*rel=["']canonical["'][^>]*>/i,
      `<link rel="canonical" href="${canonical}">`
    );
  }

  return html.replace(/<head>/i, `<head>\n  <link rel="canonical" href="${canonical}">`);
}

export function updateSitemapDomain(xml: string, domain: string): string {
  const normalized = normalizeDomain(domain);
  return xml.replace(/<loc>\s*https?:\/\/[^/<\s]+\/?\s*<\/loc>/gi, `<loc>https://${normalized}/</loc>`);
}

function setPublishedHtml(html: string, domain: string): string {
  return setRobotsMeta(setCanonicalUrl(html, domain), "index,follow");
}
