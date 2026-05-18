import { z } from "zod";

export function normalizeDomain(domain: string): string {
  const trimmed = domain.trim();
  if (!trimmed) return trimmed;

  const withScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    return new URL(withScheme).host.toLowerCase();
  } catch {
    return trimmed
      .replace(/^https?:\/\//i, "")
      .split("/")[0]
      .replace(/\/+$/g, "")
      .toLowerCase();
  }
}

export const RunMetaSchema = z.object({
  site_id: z.string().min(1),
  keyword: z.string().min(1),
  domain: z.string().min(1).transform(normalizeDomain).optional(),
  language: z.string().min(2),
  created_at: z.string().datetime(),
  status: z.string().min(1),
  indexing_state: z.enum(["draft", "published"]).optional(),
  version: z.string().min(1)
});

export type RunMeta = z.infer<typeof RunMetaSchema>;
