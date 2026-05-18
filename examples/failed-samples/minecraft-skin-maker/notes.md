# Minecraft Skin Maker Failed Sample Notes

## What Happened

- Keyword: `minecraft skin maker`
- Tool type: complex canvas editor / pixel editor.
- The generalized prompts successfully avoided 401k leakage on the second attempt.
- The generated site included canvas editing, paint controls, import/export, and preview basics.
- Manual review judged the result as too weak visually and not compelling enough to continue.

## Why It Failed

- A Minecraft skin maker is closer to a small creative app than a simple SEO utility.
- The interaction surface is large: pixel editing, body-part mapping, layers, import, export, undo/redo, preview, mobile constraints, and file validation.
- Single-pass generation can produce a working-looking interface without enough craft in the core editor experience.
- The page felt more like a generated approximation than a polished tool users would trust or share.

## Do Not Repeat

- Do not treat complex canvas editors as equivalent to calculators, counters, or converters.
- Do not spend full generation tokens on high-interaction creative editors without confirming a tight V1 scope first.
- Do not rely on generic canvas-editor expectations alone for game-specific asset editors.
- Do not deploy a complex tool just because it has basic controls and no console errors.

## Useful Lessons

- The 401k-specific leakage fix worked: non-401k generation no longer included retirement fields or financial disclaimers.
- `pnpm plan "minecraft skin maker"` should be used before attempting this kind of keyword.
- Complex creative tools need either a narrower wedge or stronger handcrafted product direction before generation.
- A better V1 might be a simpler adjacent tool, such as:
  - Minecraft skin viewer
  - Minecraft skin format checker
  - Minecraft skin PNG crop/resize validator
  - Minecraft color palette generator
  - Minecraft username skin preview guide with no editor

## Recommendation

Keep this as a failed sample. Do not add it to golden sample memory until a future version produces a clearly polished, useful, and maintainable result.

