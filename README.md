# lightsite-factory

## What is lightsite-factory?

`lightsite-factory` is a lightweight AI static tool-site generator. You enter a keyword, it generates a polished static SEO tool site, runs real-browser Playwright QA, creates a Codex repair prompt, deploys to Cloudflare Pages, and submits updated URLs through IndexNow.

Phase 1 proved one golden path: `401k calculator` for `401k-calculator.net`. New tool types should reuse the quality lessons without inheriting 401k-specific fields, formulas, or disclaimers.

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
pnpm plan "minecraft skin maker"
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
pnpm run deploy -- runs/401k-calculator
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
- The `401k calculator` golden path is sample-specific memory, not a global template.
- Non-401k tools use their own `tool_spec` and generic QA.
- Google Search Console stays manual.
- IndexNow submits automatically after successful published deploy unless `--no-indexnow` is used.

## Golden sample memory

Golden sample lessons live in `examples/golden-samples/*/ux-rules.json`.

During `generate`, lightsite-factory reads those rules and injects `golden_quality_lessons` into the OpenAI planning and site-generation prompts:

- All generated sites receive `global_rules`.
- Calculator sites receive `calculator_family_rules`.
- The 401k sample-specific rules only apply to matching `401k calculator` keywords.
- Confirmed sizing rules are limited to calculator-family or matching sample use.

Golden samples are memory, not templates. Future sites should use the quality lessons without directly copying the 401k layout.

## Plan preflight

Use `plan` before spending generation tokens on complex tools:

```bash
pnpm plan "minecraft skin maker"
```

This writes `runs/<site-id>/plan.json` and `runs/<site-id>/plan.md`. It is a local heuristic only; it does not call OpenAI and does not block `generate`.

Complex tools such as canvas editors, image editors, and video editors will warn that V1 scope should be confirmed before full generation.

## Auto domain binding and DNS

Cloudflare deploy can optionally bind the run domain and ensure DNS:

```bash
pnpm run deploy -- runs/401k-calculator --bind-domain
pnpm run deploy -- runs/401k-calculator --bind-domain --publish
pnpm run deploy -- runs/401k-calculator --bind-domain --publish --replace-dns
```

The domain must already be added to Cloudflare. lightsite-factory does not buy domains and does not add Google Search Console or Bing Webmaster automatically.

By default, existing conflicting DNS records are not overwritten. Use `--replace-dns` only when you intentionally want Cloudflare DNS records replaced.

## Draft vs published indexing state

Deploys are draft by default:

- `index.html` gets `noindex,nofollow`.
- `robots.txt` stays crawlable with `Allow: /`.
- This prevents unfinished staging or preview deployments from being indexed.

Only `--publish` unlocks indexing for the first official release:

- `index.html` gets `index,follow`.
- `canonical` and `sitemap.xml` are set to the official run domain.
- `robots.txt` uses `User-agent: *` and `Allow: /`.
- IndexNow can run after deploy when the official domain key file is reachable.

Once `run.json.indexing_state` is `published`, later deploys keep the site published by default. Use `--draft` only when you intentionally want to put a published site back into `noindex,nofollow`.

Manual UI edits do not automatically trigger QA. If the owner approves the UI and you want to deploy without rerunning QA:

```bash
pnpm run deploy -- runs/<site-id> --bind-domain --publish --force --reason "owner approved first publish"
pnpm run deploy -- runs/<site-id> --force --reason "manual update approved"
pnpm run deploy -- runs/<site-id> --draft --force --reason "temporarily hide from indexing"
```

Run `pnpm qa` only when explicitly requested.

## Google Search Console

V1 does not use the Google Search Console API and does not automatically request Google indexing.

After deploy, manually:

1. Add and verify the domain in Google Search Console.
2. Submit `https://401k-calculator.net/sitemap.xml`.
3. Use URL Inspection for the homepage.
4. Request indexing manually if needed.

## Commands

```bash
pnpm plan "minecraft skin maker"
pnpm generate "401k calculator" --domain 401k-calculator.net
pnpm generate "401k calculator" --domain 401k-calculator.net --deploy
pnpm qa runs/401k-calculator
pnpm repair-prompt runs/401k-calculator
pnpm preview runs/401k-calculator
pnpm run deploy -- runs/401k-calculator
pnpm run deploy -- runs/401k-calculator --no-indexnow
pnpm run deploy -- runs/401k-calculator --force
pnpm run deploy -- runs/401k-calculator --bind-domain --publish
pnpm indexnow runs/401k-calculator
pnpm typecheck
pnpm test
```
