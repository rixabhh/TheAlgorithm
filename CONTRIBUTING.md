# Contributing to The Algorithm

Welcome! The Algorithm is a zero-knowledge privacy analyzer built using vanilla JavaScript and Cloudflare Pages.

## Developer Setup

The project does **not** use a Python, Flask, or Docker backend. It is entirely node-based for tooling and Cloudflare Pages for deployment.

1. **Clone the repository:**

   ```bash
   git clone <repo-url>
   cd thealgorithm
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Run local development server:**

   ```bash
   make dev
   ```

4. **Run syntax checks (Test):**

   ```bash
   make test
   ```

5. **Format code:**
   ```bash
   make format
   ```

## Creating a new Parser

1. Add your parser logic in `static/js/utils/parser.js`.
2. Add the platform to the `PLATFORM_ICONS` map in `static/js/app.js` with an appropriate emoji.
3. Call the correct parser function within the JSON parsing dispatch logic in `static/js/utils/parser.js`.
4. Validate the parser works locally with your own mock chat exports.
5. If changing logic or AI requests, remember the privacy hard line: **Never send raw chat content unless deep analysis is strictly enabled.**

Thank you for contributing!
