export const designArchetypes = [
  "split-calculator-dashboard",
  "centered-tool-lab",
  "editorial-tool-report",
  "soft-saas-command-center",
  "compact-mobile-first-card",
  "financial-planning-dashboard",
  "utility-console-clean",
  "colorful-generator-studio"
] as const;

export type DesignArchetype = (typeof designArchetypes)[number];
