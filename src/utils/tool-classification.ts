export function is401kCalculator(keywordOrSiteId: string): boolean {
  const normalized = keywordOrSiteId
    .toLowerCase()
    .replace(/\(k\)/g, "k")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  return /\b401k\b/.test(normalized) && /\bcalculator\b/.test(normalized);
}

export function isFinancialTool(args: { keyword?: string; siteType?: string; html?: string }): boolean {
  const text = [args.keyword, args.siteType, args.html]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (is401kCalculator(text)) return true;
  return (
    /\b(calculator|estimator|planner)\b/.test(text) &&
    /\b(finance|financial|tax|mortgage|loan|retirement|investment|salary|paycheck|savings|401k)\b/.test(text)
  );
}

export function isMinecraftFanTool(args: { keyword?: string; html?: string }): boolean {
  const text = [args.keyword, args.html].filter(Boolean).join(" ").toLowerCase();
  return /\bminecraft\b|\bmojang\b|\bmicrosoft\b/.test(text);
}

export function isCanvasEditorTool(args: { keyword?: string; siteType?: string; html?: string }): boolean {
  const text = [args.keyword, args.siteType, args.html].filter(Boolean).join(" ").toLowerCase();
  return /\b(canvas|skin maker|skin editor|image editor|drawing|pixel editor|paint|video editor)\b/.test(text);
}
