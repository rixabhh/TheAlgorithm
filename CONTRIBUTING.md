# Contributing to The Algorithm

Welcome! This document will guide you through our development process, architecture, and how to start contributing.

## Architecture & Stack

This project is a **Static Cloudflare Pages** application with **Serverless API Functions**.

- **Frontend:** Vanilla JS, HTML, and CSS (Custom Neobrutalist design, no Tailwind compilation step).
- **Backend/API:** Cloudflare Workers running under `functions/api/`.
- **Note:** This project does _not_ use Python, Flask, or Docker. All core parsing logic happens client-side in the browser via `static/js/utils/parser.js`.

## Setup Your Local Environment

1. **Install Dependencies:**

   ```
   npm install
   ```

2. **Start Local Development Server:**
   This project uses Cloudflare Wrangler to serve the application locally.
   ```
   make dev
   ```
   Or using npm: `npm run dev &`
   Open the local URL printed by Wrangler in your browser.

## Checking Your Code

Before committing, make sure your code passes our static syntax checks and formatting standards.

1. **Format Code:**
   We use `prettier` to format code. Note that many directories (`functions/`, `static/`, etc.) are ignored via `.prettierignore` to protect zero-knowledge core logic and exact neobrutalist inline styles.

   ```
   make format
   ```

2. **Run Syntax Tests:**
   This will run `node --check` against the backend APIs and key client-side scripts.
   ```
   make test
   ```

## Adding New Chat Parsers

To support a new chat export format:

1. Examine the client-side parser logic in `static/js/utils/parser.js`.
2. Ensure you handle local time formatting correctly. Note: Client-side parsers must explicitly convert Unix timestamps safely into JavaScript dates (handling strings versus integers).
3. If you add a new platform, you also need to add the correct platform icon and update the `<option>` elements in the `index.html` file to support the UI platform selector.

## Adding New LLM Integrations

We support multiple AI providers using a BYOK (Bring Your Own Key) approach. The main AI helper logic lives in `functions/api/llm_helper.js`.
If you are adding a new model or provider:

1. Ensure the key starts with the correct prefix (if applicable, e.g., `sk-` for OpenAI, `sk-ant-` for Anthropic).
2. Use strict API key redaction in error messages. _Never_ use regex injection on the actual key; use safe string replacements.
3. Make sure to adhere to strict JSON outputs if required by the endpoint logic.

Thank you for contributing!
