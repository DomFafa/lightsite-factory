# lightsite-factory

## What is lightsite-factory?

`lightsite-factory` is a lightweight AI static tool-site generator. You enter a keyword, it generates a polished static SEO tool site, runs real-browser Playwright QA, creates a Codex repair prompt, deploys to Cloudflare Pages, and submits updated URLs through IndexNow.

V1 proves one golden path: `401k calculator` for `401k-calculator.net`.

## Quick start

```bash
pnpm install
cp .env.example .env
```

If Playwright Chromium is not installed yet, run:

```bash
pnpm exec playwright install chromium
```

Fill these values in `.env`:

```bash
OPENAI_API_KEY=
OPENAI_MODEL=
OPENAI_QA_MODEL=
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
```

Model requirements:

- `OPENAI_MODEL` must support structured JSON output.
- `OPENAI_QA_MODEL` must support image input and structured JSON output.
- `OPENAI_QA_MODEL` can be the same model as `OPENAI_MODEL` if that model supports both requirements.
- If `OPENAI_QA_MODEL` is missing, UX Vision Review is skipped and QA should not be treated as a final production pass.

Generate:

```bash
pnpm generate "401k calculator" --domain 401k-calculator.net
```

QA:

```bash
pnpm qa runs/401k-calculator
```

Local preview:

```bash
pnpm preview runs/401k-calculator
```

Generate a Codex repair prompt:

```bash
pnpm repair-prompt runs/401k-calculator
```

Deploy:

```bash
pnpm deploy runs/401k-calculator
```

Submit IndexNow separately:

```bash
pnpm indexnow runs/401k-calculator
```

## Important rules

- Do not commit `.env`.
- Do not put API keys in config, prompts, generated run folders, or source code.
- Generated websites are plain HTML, CSS, and vanilla JavaScript.
- The factory itself is TypeScript.
- V1 only proves the `401k calculator` golden path.
- Google Search Console stays manual.
- IndexNow submits automatically after successful deploy unless `--no-indexnow` is used.

## Google Search Console

V1 does not use the Google Search Console API and does not automatically request Google indexing.

After deploy, manually:

1. Add and verify the domain in Google Search Console.
2. Submit `https://401k-calculator.net/sitemap.xml`.
3. Use URL Inspection for the homepage.
4. Request indexing manually if needed.

## Commands

```bash
pnpm generate "401k calculator" --domain 401k-calculator.net
pnpm generate "401k calculator" --domain 401k-calculator.net --deploy
pnpm qa runs/401k-calculator
pnpm repair-prompt runs/401k-calculator
pnpm preview runs/401k-calculator
pnpm deploy runs/401k-calculator
pnpm deploy runs/401k-calculator --no-indexnow
pnpm deploy runs/401k-calculator --force
pnpm indexnow runs/401k-calculator
pnpm typecheck
pnpm test
```
