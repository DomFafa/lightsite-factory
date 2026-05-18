export type ToolFamily =
  | "finance-calculator"
  | "calculator"
  | "text-tool"
  | "generator-tool"
  | "canvas-editor"
  | "file-tool"
  | "brand-fan-tool"
  | "design-tool"
  | "practice-tool"
  | "generic-tool";

export type ToolFamilyInference = {
  primary: ToolFamily;
  secondary: ToolFamily[];
  is401k: boolean;
  isFinancial: boolean;
  isComplex: boolean;
};

export function inferToolFamily(args: {
  keyword: string;
  siteType?: string;
  html?: string;
}): ToolFamilyInference {
  const keyword = normalize(args.keyword);
  const allText = normalize([args.keyword, args.siteType, args.html].filter(Boolean).join(" "));
  const secondary = new Set<ToolFamily>();

  const is401k = is401kCalculatorText(allText);
  const isBrandFan = /\bminecraft\b|\bmojang\b|\bmicrosoft\b/.test(allText);
  if (isBrandFan) secondary.add("brand-fan-tool");

  let primary: ToolFamily = "generic-tool";
  let isComplex = false;

  if (is401k || isFinanceCalculatorText(allText)) {
    primary = "finance-calculator";
  } else if (/\b(skin maker|skin editor|pixel editor|canvas|image editor|photo editor|video editor|paint|drawing)\b/.test(allText)) {
    primary = "canvas-editor";
    isComplex = true;
  } else if (/\b(heic|pdf|image|file)\b.*\b(converter|convert|compressor|compress|resize|resizer)\b/.test(allText)) {
    primary = "file-tool";
  } else if (/\b(word counter|character counter|text counter)\b/.test(allText)) {
    primary = "text-tool";
  } else if (/\b(random date generator|name generator|password generator)\b/.test(allText) || /\bgenerator\b/.test(keyword)) {
    primary = "generator-tool";
  } else if (/\b(color contrast checker|palette|gradient)\b/.test(allText)) {
    primary = "design-tool";
  } else if (/\btyping test\b/.test(allText)) {
    primary = "practice-tool";
  } else if (/\bcalculator\b/.test(keyword)) {
    primary = "calculator";
  }

  if (isBrandFan) secondary.add("brand-fan-tool");

  const isFinancial = primary === "finance-calculator";
  return {
    primary,
    secondary: [...secondary],
    is401k,
    isFinancial,
    isComplex
  };
}

export function is401kCalculator(keywordOrSiteId: string): boolean {
  return is401kCalculatorText(normalize(keywordOrSiteId));
}

export function isFinancialTool(args: { keyword?: string; siteType?: string; html?: string }): boolean {
  return inferToolFamily({ keyword: args.keyword ?? "", siteType: args.siteType, html: args.html })
    .isFinancial;
}

export function isMinecraftFanTool(args: { keyword?: string; html?: string }): boolean {
  const family = inferToolFamily({ keyword: args.keyword ?? "", html: args.html });
  return family.primary === "brand-fan-tool" || family.secondary.includes("brand-fan-tool");
}

export function isCanvasEditorTool(args: { keyword?: string; siteType?: string; html?: string }): boolean {
  return inferToolFamily({ keyword: args.keyword ?? "", siteType: args.siteType, html: args.html })
    .primary === "canvas-editor";
}

function is401kCalculatorText(text: string): boolean {
  return /\b401k\b/.test(text) && /\bcalculator\b/.test(text);
}

function isFinanceCalculatorText(text: string): boolean {
  return (
    /\bcalculator\b/.test(text) &&
    /\b(loan|mortgage|retirement|tax|paycheck|salary)\b/.test(text)
  );
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/\(k\)/g, "k")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
