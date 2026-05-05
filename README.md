# The Algorithm

A privacy-first, social-native chat relationship analyzer built as a static Cloudflare Pages app with serverless API functions.

## Overview

The Algorithm analyzes exported WhatsApp, Telegram, Instagram, Signal, and Discord chats in the browser. It turns local chat statistics into dashboard insights, AI vibe reads, and shareable story-style cards.

Raw chat files are parsed client-side. Optional AI features send aggregated statistics only, not raw message text.

## Current Stack

- Static Cloudflare Pages app.
- Root-level public pages: `index.html`, `dashboard.html`, `history.html`, `instructions.html`, `privacy.html`, `pricing.html`, `404.html`.
- Cloudflare Pages Functions under `functions/api/`.
- Vanilla JavaScript for parsing, analytics, dashboard rendering, local history, compare mode, and share cards.
- No Flask, Python runtime, Docker app server, or server-rendered templates.

## Features

- Browser-local chat parsing and analytics.
- Mobile-optimized dashboard with sticky horizontal section navigation.
- Overview stats for total messages, duration, reply speed, and balance.
- Charts for message share, activity, and mood timeline.
- Deep dashboard sections for social dynamics, streaks, engagement, links, humor, silence breakers, and word cloud.
- Progressive loading and skeleton states for dashboard stats and AI generation.
- AI insight generation with a punchy, Gen Z, social-friendly tone.
- Dashboard AI settings modal, so provider/API-key changes can be made from the report page.
- BYOK support for OpenRouter, OpenAI, Anthropic, Gemini, xAI Grok, Groq, Mistral, and Cohere.
- Cloudflare AI free-tier support when a Workers AI binding is configured.
- Story-friendly shareable vibe card with score, verdict, message split, response-speed signal, red flag, green flag, and final AI insight.
- Local history and compare flows stored in browser storage.

## Local Setup

```bash
npm install
npm run dev
```

Open the local URL printed by Wrangler.

## Checks

```bash
npm test
```

This validates Cloudflare Function syntax with Node.

Additional checks used during verification:

```bash
node --check static/js/app.js
node --check static/js/dashboard.js
node --check static/js/dashboard_utils.js
node --check static/js/analytics_engine.js
node --check static/js/parser.js
```

## AI Providers

Provider selection is stored in `localStorage`; API keys are stored only in tab-scoped `sessionStorage`.

OpenRouter is supported through its OpenAI-compatible chat completions API. The app sends OpenRouter attribution headers:

- `HTTP-Referer`
- `X-OpenRouter-Title`

Production Cloudflare bindings such as `KV_RATELIMIT` or Workers AI should be attached in the Cloudflare project settings when needed.

## Deployment

### Local Preview

```bash
npm install
npm run dev
```

### Cloudflare Pages

```bash
npm run deploy
```

You can also connect the repository in the Cloudflare dashboard and deploy from the selected branch.

### Other Static Hosts

The frontend pages and `static/` assets can be hosted by any static host. AI endpoints under `functions/api/` require a serverless runtime or equivalent API routes.

## Privacy Model

1. Chat files are read in the browser.
2. Sender mapping and analytics run locally.
3. Reports are stored in `localStorage` / `sessionStorage` on the user's device.
4. Optional AI calls send statistical payloads only.
5. Raw message text is not sent to API functions or LLM providers.

## Verification Status

The current structure has been checked for:

- Cloudflare Function syntax.
- Frontend JavaScript syntax.
- Missing local asset references.
- Dashboard selector/ID mismatches.
- Duplicate dashboard IDs.
- Flask/Python infrastructure residue.
- Wrangler Pages compile and `/api/stats` local probe.

## License

MIT
