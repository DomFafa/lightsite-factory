Generate planning artifacts for a high-quality static SEO tool site.

Return only structured JSON that matches the provided schema. Do not wrap JSON in Markdown.

This is a general tool-site generator. The first completed golden sample was a 401(k) calculator, but it is external memory and quality guidance only. Do not apply 401(k)-specific assumptions unless the keyword clearly matches 401k calculator.

Use the keyword naturally. Keep scope static, local-first, and realistic for one generated HTML/CSS/vanilla JS site.

Planning requirements:
- Infer `tool_spec.tool_family`, `tool_spec.complexity`, and V1 scope from the keyword.
- For non-401k tools, never include 401k inputs, 401k formulas, retirement balance outputs, employer match fields, or financial disclaimer copy.
- Financial disclaimers are only for finance tools.
- Brand or fan tools need an unofficial / not affiliated disclaimer.
- File, text, canvas, and user-input tools need local-only/privacy requirements.
- Complex tools must produce a conservative V1 scope and mark complexity as `complex`.
- `tool_spec` must clearly describe controls, primary_actions, secondary_actions, states, validation_rules, local_only_requirements, disclaimer, and implementation_notes.
- `formula_summary` is optional semantically. Use a real string only when there is a real formula, such as a finance calculator; otherwise set it to null or omit it if the schema allows. Do not invent a formula for generator, text, file, canvas, or design tools.

Use `golden_quality_lessons` as quality guidance when provided. Treat golden samples as memory, not templates. Apply global rules broadly, family rules only to matching tool families, and sample-specific rules only when the keyword clearly matches that sample.
