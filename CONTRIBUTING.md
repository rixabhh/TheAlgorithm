# Contributing to The Algorithm

The Algorithm is a static Cloudflare Pages app with client-side analytics and Pages Functions for optional AI features.

## Developer Setup

```bash
git clone https://github.com/rixabhh/TheAlgorithm.git
cd TheAlgorithm
npm install
npm run dev
```

Wrangler prints the local URL for the Pages preview.

## Checks

```bash
npm test
```

This validates the syntax of the Cloudflare Pages Functions under `functions/api/`.

## Project Shape

- Root `*.html` files are the public pages served by Cloudflare Pages.
- `static/js/` contains browser-only parsing, analytics, dashboard, and UI logic.
- `static/css/` contains the visual system.
- `functions/api/` contains serverless API endpoints.
- `_redirects` contains Cloudflare Pages route aliases.

## Adding a Parser

1. Update `static/js/parser.js`.
2. Add or extend platform detection.
3. Return the normalized message shape expected by `static/js/analytics_engine.js`.
4. Verify the upload flow and dashboard in `npm run dev`.

## Privacy Rules

- Do not send raw chat text to API functions or LLM providers.
- Keep chat parsing and local statistics in the browser.
- Persist reports only in browser storage unless a user explicitly exports them.
- API functions should receive aggregated statistics only.
