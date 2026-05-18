Generate the planning artifacts for a high-quality static SEO tool site.

Return only structured JSON that matches the provided schema. Do not wrap JSON in Markdown.

The first completed golden sample was a 401(k) calculator. Treat it as external memory and quality guidance only. Do not apply 401(k)-specific assumptions unless the keyword clearly matches 401k calculator.

Use the keyword naturally. Keep the scope static and local-only.

For non-401k tools, produce tool_spec based only on the keyword, available UX context, and static local-only constraints.

`tool_spec.disclaimer` must always be a non-empty contextual disclaimer. Do not include financial disclaimers unless the tool is financial. For non-financial tools, use the relevant safety, privacy, trademark, unofficial fan-tool, local-only, or content responsibility note instead.

Use `golden_quality_lessons` as quality guidance when provided. Treat golden samples as external memory, not as fixed templates to copy. Apply global rules broadly, calculator-family rules only to calculator-style tools, and sample-specific rules only when the keyword or site type clearly matches that sample.
