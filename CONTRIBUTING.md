# Contributing to The Algorithm

Thank you for your interest in contributing! This document provides instructions for setting up the project locally and outlines the process for making changes.

## Architecture Context

The Algorithm is a static Cloudflare Pages app with serverless API functions. It uses vanilla JavaScript, Tailwind CSS (via CDN), and Cloudflare Workers for backend logic. It does **not** use Python, Docker, Flask, or any traditional backend server framework. The zero-knowledge privacy model means chat parsing and analysis happen entirely client-side.

## Local Setup

1. **Clone the repository:**

   ```bash
   git clone <repository_url>
   cd the-algorithm
   ```

2. **Install dependencies:**
   Ensure you have Node.js installed (v20+ recommended).

   ```bash
   npm install
   ```

3. **Environment Variables:**
   Copy the example environment file and configure any necessary API keys.

   ```bash
   cp .env.example .dev.vars
   ```

4. **Run the local development server:**
   ```bash
   make dev
   # or
   npm run dev
   ```
   This uses `wrangler` to serve the static frontend and the API functions locally.

## Development Tools

The project relies on standard Node.js tooling:

- **Formatting:** We use Prettier to maintain code style. Run `make format` to format the codebase. Note that `functions/`, `static/`, and `*.html` files are ignored to protect the core logic and neobrutalist inline styles.
- **Linting/Syntax Check:** Run `make lint` to check formatting, and `make test` to validate syntax via `node --check`.

## Extending the Parser (Parser Walkthrough)

To add support for a new chat platform format:

1.  **Understand the Parser Structure:** All parsing logic resides in `static/js/utils/parser.js`.
2.  **Add Detection Logic:** Update the `detect(content, fileName)` method in `static/js/utils/parser.js` to enable automatic format detection based on file extensions or specific keywords in the chat data.
3.  **Implement the Parser:** Create a new parsing function in `static/js/utils/parser.js` for your specific format. Ensure it correctly extracts the `timestamp`, `sender`, and `text` for each message. _Note: Always use the `text` key for the message body, not `content`._
4.  **Update the Dispatch Logic:** If necessary, update the main parsing function to route the detected format to your new parser.
5.  **Update the UI:** Add the new platform as an `<option>` in the `<select id="jsonPlatform">` dropdown and as a `<div class="custom-select-option">` in `index.html`. Add an icon mapping in `static/js/app.js` (`PLATFORM_ICONS`).

## Submitting Changes

1.  Create a new branch for your feature or bug fix.
2.  Ensure you run `make format` and `make test` before committing.
3.  Write clear, concise commit messages.
4.  Open a Pull Request describing the changes, why they are needed, and any potential impact.

Please ensure your changes align with the project's zero-knowledge privacy principles and neobrutalist design aesthetic.
