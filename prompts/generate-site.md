Generate a complete static tool site from the provided planning artifacts.

Return only structured JSON with the required files. Do not wrap JSON in Markdown.

Required paths:
- site/index.html
- site/css/style.css
- site/js/app.js
- site/robots.txt
- site/sitemap.xml

Do not generate the IndexNow key file. The system writes that file after generation.

Hard requirements:
- The first viewport is the usable tool, not a marketing-only hero.
- Use only HTML, CSS, and vanilla JavaScript.
- No external JavaScript CDNs.
- No Tailwind CDN.
- No React, Vue, Astro, Vite, Chart.js, backend, database, login, or API keys.
- Include title, meta description, canonical, one H1, semantic main/section markup, FAQ, SoftwareApplication JSON-LD, and FAQPage JSON-LD.
- Reference css/style.css and js/app.js from index.html.
- Use stable IDs for QA:
  - Inputs: current-age, retirement-age, current-balance, annual-salary, employee-contribution-percent, employer-match-percent, match-limit-percent, annual-return-percent, salary-increase-percent
  - Outputs: projected-balance, user-contributions, employer-match-total, investment-growth, monthly-retirement-income, balance-over-time
  - Reset button: reset-calculator
- Implement validation for empty, negative, non-numeric, too-high percentages, and retirement age <= current age.
- Show these exact disclaimer sentences somewhere visible:
  Educational estimate only.
  This calculator does not provide financial, investment, tax, or legal advice.
  Results are hypothetical and not guaranteed.

401(k) formula:
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
