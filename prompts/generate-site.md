Generate a complete static tool site from the provided planning artifacts and design target.

Return only structured JSON with the required files. Do not wrap JSON in Markdown.

Required paths:
- site/index.html
- site/css/style.css
- site/js/app.js
- site/robots.txt
- site/sitemap.xml

Do not generate the IndexNow key file. The system writes that file after generation.

General hard requirements:
- The first viewport is the usable tool, not a marketing-only hero.
- Use only HTML, CSS, and vanilla JavaScript.
- No backend, login, database, API keys, or external JavaScript CDNs.
- No React, Vue, Astro, Vite, Tailwind CDN, Chart.js, or third-party UI libraries.
- Include title, meta description, canonical, one H1, semantic main/section markup, FAQ, SoftwareApplication JSON-LD, and FAQPage JSON-LD.
- Reference css/style.css and js/app.js from index.html.
- Stable IDs must match `tool_spec`, not 401k unless `is401k` is true.
- Use local-only/privacy copy when handling user input, files, text, or canvas.

Design target implementation requirement:
- If `design_target_manifest` or a target image description is provided, implement the site to match that design direction.
- The code model must not invent a different UI direction.
- Preserve the intended visual hierarchy, H1 scale, card density, spacing, section token style, color mood, and first-screen composition from `design_target`.
- If the target image is included as image input, treat it as the visual source of truth while preserving the functional `tool_spec`.
- If only text target metadata is provided, follow the target prompt and manifest direction as closely as possible.

Global visual quality requirements:
- Use compact UI tokens for hero chips, section pills, status pills, and privacy cues.
- H1 should be strong but not oversized compared with the actual tool.
- Do not use giant section badges.
- Decorative art is allowed but must not overpower the main tool.
- Primary tool controls and results must dominate the first viewport.
- Use one clear local-only/privacy cue only.
- Avoid generic AI-template look.
- Avoid oversized rounded cards unless the design target requires them.

Tool-family requirements:
- generator-tool: clear controls, result list, copy/export actions, validation, seed/filter controls when relevant.
- text-tool: textarea, live metrics, clear/copy actions, local-only copy.
- design-tool: visual input, immediate preview, accessible contrast or usability notes when relevant.
- practice-tool: start/reset/state/results flow.
- canvas-editor: visible canvas/workspace, toolbar, local-only handling, import/export if relevant, conservative V1 scope.
- file-tool: file picker, validation, local-only processing, export/download.
- finance-calculator: explicit formulas, validation, result cards, and financial disclaimer.

Non-401k tools must not include:
- 401k projection formulas.
- Current age, retirement age, annual salary, employer match, annual return, or salary increase fields unless the keyword actually needs them.
- Projected retirement balance or monthly retirement income outputs.
- Financial, investment, tax, or legal disclaimer copy unless the tool is actually financial.

401k-only section:
Apply this section only when `is401k` is true or the input includes 401k-specific requirements.
- Stable IDs:
  - Inputs: current-age, retirement-age, current-balance, annual-salary, employee-contribution-percent, employer-match-percent, match-limit-percent, annual-return-percent, salary-increase-percent
  - Outputs: projected-balance, user-contributions, employer-match-total, investment-growth, monthly-retirement-income, balance-over-time
  - Reset button: reset-calculator
- Implement validation for empty, negative, non-numeric, too-high percentages, and retirement age <= current age.
- Show these exact disclaimer sentences somewhere visible:
  Educational estimate only.
  This calculator does not provide financial, investment, tax, or legal advice.
  Results are hypothetical and not guaranteed.
- Use the 401k formula only for 401k calculator sites.

Golden sample quality lessons:
- Use `golden_quality_lessons` from the input as quality guidance when provided.
- Do not turn any golden sample into a fixed template.
- Apply sample_specific_rules only when the keyword clearly matches that sample.
- Do not let 401k-specific copy or structure leak into unrelated tools.
