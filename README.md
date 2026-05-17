# The Algorithm

A privacy-first, social-native chat relationship analyzer built as a static Cloudflare Pages app with serverless API functions.

## Overview

The Algorithm analyzes exported chats, pasted conversations, screenshots, and transcripts in the browser. It turns local conversation statistics into dashboard insights, evidence-backed receipts, predictive outlooks, AI vibe reads, and shareable story-style cards.

Raw conversation content is parsed client-side by default. Optional AI features send aggregated statistics and anonymized evidence. Users can explicitly enable Deep AI with raw evidence for a report, which sends short scrubbed excerpts to their selected AI provider.

The UI uses a premium neobrutal design system: cream app shell, dark report sidebar, rounded pastel cards, black ink borders, restrained shadows, polished chart spacing, and motion-safe button interactions.

## Current Stack

- Static Cloudflare Pages app.
- Root-level public pages: `index.html`, `dashboard.html`, `history.html`, `instructions.html`, `privacy.html`, `pricing.html`, `404.html`.
- Cloudflare Pages Functions under `functions/api/`.
- Vanilla JavaScript for parsing, analytics, dashboard rendering, local history, compare mode, and share cards.
- No Flask, Python runtime, Docker app server, or server-rendered templates.

## How It Works

The Algorithm provides a privacy-first, 3-step process to decode your chat data:
1. **Upload your source**: Provide a chat export, screenshot, pasted messages, or transcript.
2. **Local Analysis**: Your browser parses the data natively. Nothing is sent to our servers. Your data is analyzed using mathematical models directly in the browser.
3. **Deep AI (Optional)**: Choose an AI provider (BYOK) to get deeper context and pattern analysis by sending only computed statistics and anonymized evidence.

## Features

- Browser-local parsing for chat exports, pasted chats, screenshots with OCR, and transcripts.
- Source-quality scoring and warnings for low-confidence OCR, small samples, and synthetic timestamps.
- Local evidence extraction for repeated patterns, receipts, and predictive signals.
- Mobile-optimized dashboard with sticky horizontal section navigation.
- Overview stats for total messages, duration, reply speed, and balance.
- Charts for message share, activity, and mood timeline.
- Deep dashboard sections for social dynamics, streaks, engagement, links, humor, silence breakers, and word cloud.
- Progressive loading and skeleton states for dashboard stats and AI generation.
- AI insight generation with a punchy, Gen Z, social-friendly tone, verdict summary, receipts, and predictive outlook.
- Dashboard AI settings modal, so provider/API-key changes can be made from the report page.
- BYOK support for OpenRouter, OpenAI, Anthropic, Gemini, xAI Grok, Groq, Mistral, and Cohere.
- Free insights route with shared rate limiting, OpenRouter backend key support, and Workers AI fallback when configured.
- Story-friendly shareable vibe card with score, verdict, message split, response-speed signal, top receipt, predictive signal, and final AI insight.
- Local history and compare flows stored in browser storage.
- Strict score display policy: heuristic, confidence, prediction, and AI-style scores cap below false certainty; deterministic 0% or 100% shares are shown only with sample context.
- Premium neobrutal UI across landing, upload, dashboard, history, privacy, instructions, pricing, and share card surfaces.

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
node --check static/js/pages/dashboard.js
node --check static/js/pages/dashboard_utils.js
node --check static/js/utils/analytics_engine.js
node --check static/js/modules/conversation_intelligence.js
node --check static/js/utils/parser.js
```

## AI Providers

Provider selection is stored in `localStorage`; API keys are stored only in tab-scoped `sessionStorage`.

OpenRouter is supported through its OpenAI-compatible chat completions API. The app sends OpenRouter attribution headers:

- `HTTP-Referer`
- `X-OpenRouter-Title`

For backend-managed free insights, configure `OPENROUTER_API_KEY` in the Cloudflare Pages environment. `OPENROUTER_KEY` is also accepted as a fallback variable name. Local development can use a `.dev.vars` file:

```bash
OPENROUTER_API_KEY=sk-or-v1-your-key
```

Production Cloudflare bindings such as `KV_RATELIMIT` or Workers AI should be attached in the Cloudflare project settings when needed. Free insights use the same KV rate limit as the old Cloudflare-only path.

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
4. Optional AI calls send statistical payloads and anonymized evidence by default.
5. Raw excerpts are sent only when the user enables Deep AI with raw evidence for that report.

## Score Policy

- Heuristic scores, predictive risks, source quality, compatibility, health, and confidence signals are displayed as capped estimates rather than certainty.
- Exact `100%` is reserved for deterministic shares or counts with visible sample context.
- Low sample size, missing timestamps, OCR uncertainty, or uncertain speaker mapping lowers confidence and surfaces a warning.

## Verification Status

The current structure has been checked for:

- Cloudflare Function syntax.
- Frontend JavaScript syntax.
- Missing local asset references.
- Dashboard selector/ID mismatches.
- Duplicate dashboard IDs.
- Flask/Python infrastructure residue.
- Wrangler Pages compile and `/api/stats` local probe.
- Heuristic score displays avoiding false `100%` certainty.

## License

MIT
