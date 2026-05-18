# Minecraft Skin Maker v0 Failed Sample Notes

## What Happened

- 401k-specific rules leaked before the Phase 2 prompt and QA fix.
- After the leakage fix, the canvas editor still produced only a plausible-looking approximation.

## Why It Failed

- Canvas editor scope was too complex for one-shot generation.
- Visual UI looked plausible, but editing UX was weak.
- The interaction surface included pixel editing, import/export, preview, body mapping, undo/redo, and mobile constraints.

## Lesson

Complex canvas editors require `pnpm plan`, a design-target stage, and explicit V1 scope before full generation.

Do not use `minecraft skin maker` as a one-click Phase 2 baseline. Start Phase 2 stability testing with simple and medium tools first.

