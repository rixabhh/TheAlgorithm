# Contributing to The Algorithm

Welcome to The Algorithm! This guide will help you understand our architecture and get set up for local development.

## Project Architecture

The Algorithm is a privacy-first, zero-knowledge relationship analyzer. Its stack is uniquely simple and entirely serverless:

- **Frontend:** Vanilla JS and Tailwind CSS (via CDN) hosted as a static Cloudflare Pages app. There is no React or frontend build step.
- **Backend:** Cloudflare Pages Functions (`functions/api/`). These are serverless functions written in JavaScript.
- **No Docker/Python:** There is no Python backend, no Flask server, and no Docker container needed to run this application.
- **Data Flow:** All parsing logic (`static/js/utils/parser.js`) is done entirely in the user's browser for maximum privacy.

## Setup Instructions

Getting up and running takes less than a minute.

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/the-algorithm.git
   cd the-algorithm
   ```

2. **Install dependencies:**
   We only use `npm` for `wrangler` (the Cloudflare CLI) and development tools.

   ```bash
   npm install
   ```

3. **Set up local secrets (optional):**
   If you are working on the AI backend features (`functions/api/`), copy the `.env.example` to `.dev.vars` (the file format Wrangler expects for local secrets):
   ```bash
   cp .env.example .dev.vars
   ```
   Add your API keys to `.dev.vars`.

## Local Development

Start the local development server:

```bash
make dev
```

_(Or run `npm run dev` / `wrangler pages dev .`)_

This command uses Wrangler to serve the static frontend and bind the `functions/api/` folder as local serverless endpoints. You will get a localhost URL in your terminal.

## Code Quality and Formatting

We use Prettier to keep our code formatting consistent. Please run it before submitting a PR:

```bash
make format
```

_(Or run `npm run format`)_

This is also enforced by our pre-commit hooks.

## Testing

We use native Node to perform fast syntax validation on the Cloudflare Functions and parsing logic.

```bash
make test
```

_(Or run `npm test`)_

## Pull Requests

1. Create a new branch: `git checkout -b feature/your-feature-name`
2. Commit your changes: Make sure your commits follow conventional formats (e.g., `feat:`, `fix:`, `infra:`).
3. Push to your branch and open a PR. If configured, a Cloudflare Pages preview environment will automatically deploy your PR.
