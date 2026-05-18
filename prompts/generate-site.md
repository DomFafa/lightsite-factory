Generate a complete static tool site from the provided planning artifacts.

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
- Build the actual tool experience from `tool_spec`; do not substitute a 401k calculator unless the keyword is 401k calculator.
- Use stable IDs and interactions that match `tool_spec`, the keyword, and the tool's natural controls.
- Use only HTML, CSS, and vanilla JavaScript.
- No external JavaScript CDNs.
- No Tailwind CDN.
- No React, Vue, Astro, Vite, Chart.js, backend, database, login, or API keys.
- Include title, meta description, canonical, one H1, semantic main/section markup, FAQ, SoftwareApplication JSON-LD, and FAQPage JSON-LD.
- Reference css/style.css and js/app.js from index.html.
- Use local-only copy when the tool handles files, canvas drawing, text input, or other private user data.
- Do not generate financial, investment, tax, or legal disclaimers unless the keyword/tool_spec is financial.

Non-401k tools must not include:
- 401k projection formulas.
- Current age, retirement age, annual salary, employer match, annual return, or salary increase fields unless the keyword actually needs them.
- Projected retirement balance or monthly retirement income outputs.
- Financial, investment, tax, or legal disclaimer copy unless the tool is actually financial.

401(k)-only requirements:
Apply this section only when the input includes 401k-specific requirements or the keyword clearly matches 401k calculator.
- Stable IDs:
  - Inputs: current-age, retirement-age, current-balance, annual-salary, employee-contribution-percent, employer-match-percent, match-limit-percent, annual-return-percent, salary-increase-percent
  - Outputs: projected-balance, user-contributions, employer-match-total, investment-growth, monthly-retirement-income, balance-over-time
  - Reset button: reset-calculator
- Implement validation for empty, negative, non-numeric, too-high percentages, and retirement age <= current age.
- Show these exact disclaimer sentences somewhere visible:
  Educational estimate only.
  This calculator does not provide financial, investment, tax, or legal advice.
  Results are hypothetical and not guaranteed.

401(k)-only formula:
For each projected year:
salary = salary * (1 + salaryIncrease)
employeeContribution = salary * employeeContributionPercent
eligibleMatchPercent = min(employeeContributionPercent, matchLimitPercent)
employerMatch = salary * eligibleMatchPercent * employerMatchPercent
balance = balance * (1 + annualReturn) + employeeContribution + employerMatch

Final values:
projectedBalance = final balance
userContributions = sum of employee contributions
employerMatch = sum of employer match
investmentGrowth = projectedBalance - startingBalance - userContributions - employerMatch
monthlyRetirementIncome = projectedBalance * 0.04 / 12

Canvas editor basic expectations:
Use this only for canvas/image/pixel/editor tools; do not treat it as a fixed template.
- Visible canvas or workspace.
- Toolbar with draw, erase, fill, and pick when relevant.
- Color picker when the tool edits colors or pixels.
- Undo and redo when editing state can change.
- Import and export/download when the tool handles files.
- Preview panel when a transformed output or character/asset preview is useful.
- Local-only file handling copy.
- Mobile fallback warning if precise editing is difficult on small screens.

Golden sample quality lessons:
- Use `golden_quality_lessons` from the input as quality guidance when provided.
- Do not turn any golden sample into a fixed template; apply these as general quality rules.
- Apply sample_specific_rules only when the keyword or site type clearly matches that sample; do not let 401k-specific rules leak into unrelated tools.
- The first viewport must feel tool-first, not marketing-first.
- Avoid duplicate local-only or privacy cues; one clear cue is enough.
- Use a coherent hero grid that avoids large empty columns.
- Keep the H1 and subtitle in one visual text group.
- Section labels should feel like integrated UI tokens/cards, not generic uppercase badges.
- Calculator pages need a strong primary result area that is visually connected to the inputs.
