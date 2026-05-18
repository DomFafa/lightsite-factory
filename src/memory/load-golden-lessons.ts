import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

const GoldenRulesSchema = z.object({
  global_rules: z.array(z.string()).default([]),
  calculator_family_rules: z.array(z.string()).default([]),
  sample_specific_rules: z.array(z.string()).default([]),
  confirmed_sizing_rules: z.array(z.string()).default([])
});

export type GoldenQualityLessons = {
  global_rules: string[];
  calculator_family_rules: string[];
  sample_specific_rules: string[];
  confirmed_sizing_rules: string[];
  sources: string[];
};

export function loadGoldenLessons(args: {
  keyword: string;
  siteType?: string;
  cwd?: string;
}): GoldenQualityLessons {
  const cwd = args.cwd ?? process.cwd();
  const samplesDir = path.join(cwd, "examples", "golden-samples");
  const keyword = args.keyword.toLowerCase();
  const siteType = args.siteType?.toLowerCase() ?? "";
  const isCalculator = keyword.includes("calculator") || siteType.includes("calculator");
  const is401k = /\b401\s*\(?k\)?\b/.test(keyword) && keyword.includes("calculator");

  const result: GoldenQualityLessons = {
    global_rules: [],
    calculator_family_rules: [],
    sample_specific_rules: [],
    confirmed_sizing_rules: [],
    sources: []
  };

  if (!fs.existsSync(samplesDir)) return result;

  for (const sampleName of fs.readdirSync(samplesDir)) {
    const rulesPath = path.join(samplesDir, sampleName, "ux-rules.json");
    if (!fs.existsSync(rulesPath)) continue;

    const rules = GoldenRulesSchema.parse(
      JSON.parse(fs.readFileSync(rulesPath, "utf8")) as unknown
    );
    result.sources.push(path.relative(cwd, rulesPath));
    result.global_rules.push(...rules.global_rules);

    if (isCalculator) {
      result.calculator_family_rules.push(...rules.calculator_family_rules);
      result.confirmed_sizing_rules.push(...rules.confirmed_sizing_rules);
    }

    if (is401k && sampleName === "401k-calculator") {
      result.sample_specific_rules.push(...rules.sample_specific_rules);
    }
  }

  return {
    global_rules: unique(result.global_rules),
    calculator_family_rules: unique(result.calculator_family_rules),
    sample_specific_rules: unique(result.sample_specific_rules),
    confirmed_sizing_rules: unique(result.confirmed_sizing_rules),
    sources: unique(result.sources)
  };
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
