# Contributing to TheAlgorithm

Welcome to **TheAlgorithm**! This is a zero-knowledge, BYOK (Bring Your Own Key) chat log analyzer.
Unlike typical Python/Docker applications, this project is built to run entirely on **Cloudflare Pages** using Vanilla JS for client-side processing and Cloudflare Workers (Functions) for API logic.

## Architecture

- **Frontend:** Vanilla JS, HTML, Tailwind CSS. Parsing logic is entirely client-side (`static/js/utils/parser.js`).
- **Backend:** Cloudflare Workers API Functions (`functions/api/`). No Python, no Docker, no external storage.
- **Privacy:** Strict Zero-Knowledge. All data remains in memory and is never persisted.

## Local Development Setup

To contribute, you will need **Node.js** (v20+ recommended) and `npm`.

1. **Install Dependencies:**

   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   For local development, copy the example environment file:

   ```bash
   cp .env.example .dev.vars
   ```

   Add your testing API keys to `.dev.vars` (e.g., `OPENAI_API_KEY`). This file is read by Wrangler during local development.

3. **Start the Development Server:**
   ```bash
   make dev
   ```
   This uses Wrangler to serve the application locally and provides hot-reloading for Functions.

## Developer Commands (Makefile)

We use a `Makefile` to simplify common tasks:

- `make dev`: Starts the local Wrangler dev server.
- `make test`: Runs syntax checks on the Cloudflare API Functions.
- `make format`: Runs Prettier to format the codebase (ignores `functions/`, `static/`, etc. as per `.prettierignore`).

## Pull Requests

1. Create a branch for your feature.
2. Run `make format` and `make test` before committing.
3. Open a PR. The GitHub Action will automatically run tests and (if secrets are available) deploy a preview link.
