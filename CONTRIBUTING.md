# Contributing to The Algorithm

Thank you for your interest in contributing to The Algorithm! We welcome PRs for bug fixes, new features, UI improvements, and new platform parsers.

## Project Structure

This is a **client-side Vanilla JS application** hosted on Cloudflare Pages, not a Python/Docker backend. All core logic—including file parsing, PII scrubbing, and data analytics—happens in the browser.

- `index.html`, `dashboard.html`, etc.: Main UI pages
- `static/js/`: Client-side logic
  - `static/js/utils/parser.js`: **Platform parsing logic**
  - `static/js/utils/analytics_engine.js`: Chat analytics and insight generation
  - `static/js/modules/conversation_intelligence.js`: PII scrubbing and Deep AI evidence generation
- `functions/api/`: Cloudflare Pages Functions (Serverless endpoints for AI routing)

## Local Development Setup

To get started, clone the repository and install the dependencies:

```bash
git clone https://github.com/your-username/the-algorithm.git
cd the-algorithm
npm install
```

Start the local development server:

```bash
make dev
```

_(This wraps `npm run dev` and starts Wrangler on `http://localhost:8788`)_

## Makefile Commands

We use `make` for common tasks:

- `make dev`: Starts the local Wrangler dev server.
- `make preview`: Starts the Wrangler preview server.
- `make test`: Validates syntax via `node --check`.
- `make format`: Runs Prettier over the codebase (excluding specific directories).
- `make deploy`: Deploys to Cloudflare Pages via Wrangler.

## Developing Parsers

The most common area for contribution is adding or fixing parsers in `static/js/utils/parser.js`.

Because we value zero-knowledge privacy, we **never upload chat files**. You must ensure your parser runs entirely in the browser using the standard `FileReader` and Vanilla JS text/regex APIs.

**Guidelines for Parser PRs:**

1. **Identify the structure:** Understand the export format of the chat application (e.g., WhatsApp `.txt`, Instagram `.json`, Slack `.json`).
2. **Implement `parseChatData(text, platform)`:** If adding a new platform, create a specific parsing function and update the main router.
3. **Handle timestamps:** Ensure your parser correctly extracts timestamps into UNIX epochs or valid Javascript `Date` objects. (Watch out for Slack's string timestamps!)
4. **Sender mappings:** Make sure sender names are normalized and mapped correctly.
5. **No dependencies:** Do not add external parsing libraries. Use native DOM/JS APIs.
6. **Test locally:** Use a sample export from the platform to verify the dashboard renders the correct statistics. You can also run the basic Node check: `make test`.

## AI API Integrations

If modifying `functions/api/`, remember:

- API keys are **BYOK** (Bring Your Own Key) and passed from the client payload. Never hardcode them.
- All errors must be scrubbed of API key details before returning to the client.
- Add `OPENROUTER_API_KEY` to `.dev.vars` (or `.env` equivalents) for local development if testing free-tier fallback flows.

## Code Style

Run `make format` before committing. We use Prettier to maintain a consistent code style. However, we intentionally ignore `static/` and `functions/` to preserve neobrutalist inline styling and protect zero-knowledge core logic, so focus formatting on infrastructure and setup files.
