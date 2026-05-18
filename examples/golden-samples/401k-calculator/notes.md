# 401k Calculator Golden Sample Notes

## What worked

- Tool-first calculator page with a polished finance-tool feel.
- Local-only privacy cue is useful, but should appear only once.
- Strong H1 + subtitle group improves first-screen clarity.
- Numbered pill/card section labels feel more integrated than hard uppercase badges.
- Smaller heading, pill, and utility-button sizing made the calculator feel more tool-like and less like a marketing hero.
- Senior-friendly readability should remain a priority.

## Do not repeat

- Do not place H1 in the middle while leaving a large empty left column.
- Do not disconnect the subtitle from the H1.
- Do not duplicate local-only/privacy labels.
- Do not use generic all-caps section badges.
- Do not let section labels, privacy pills, or reset buttons become oversized compared with the form controls.
- Do not let the hero become a pure marketing block that pushes the calculator too far down.

## Generalizable rules

- First viewport must feel tool-first, not marketing-first.
- Avoid duplicated trust/privacy cues.
- Hero layout must use a coherent grid.
- H1 and subtitle should belong to one visual group.
- Section labels should feel like integrated UI tokens/cards.
- UI tokens such as section pills and privacy pills should be compact; they should support hierarchy without competing with the calculator.
- Manual visual edits should not automatically trigger QA unless the user explicitly asks.

## Calculator-family rules

- Calculator pages need a strong primary result area.
- Inputs and outputs should be visually connected.
- Supporting sections should share one consistent section label system.
- Reset and helper controls should be visually smaller than primary results and form headings.
- Calculator helper content should not push the real tool too far down.

## 401k-specific rules

- Main H1 should be "401(k) Calculator".
- Keep one local-only cue: "Runs locally in your browser. No sign-up. No personal data stored."
- Remove duplicate "Local-only retirement estimate" hero badge.
- Use a lightweight right-side support card if H1/subtitle are left-aligned and right side feels empty.
- Section labels should use numbered pill/card style:
  01 Your assumptions
  02 Projection table
  03 Plain-English method
  04 Quick guide
  05 Questions

## Confirmed sizing adjustments

- Main H1 should be calmer than the first generated version: approximately `clamp(2rem, 3.7vw, 3.35rem)` instead of oversized hero-scale text.
- Section numbered pills should be compact UI tokens: about `0.74rem` text, `0.24rem 0.48rem` padding, small dot, light shadow.
- The local-only privacy pill should be one size smaller than body emphasis: about `0.88rem` text with compact padding.
- The reset button should be smaller than the input height: about `0.9rem` text, `38px` minimum height, compact horizontal padding.
- Result numbers can remain large; reduce headings and UI tokens first before shrinking financial outputs.
