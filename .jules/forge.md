## 2024-06-17 — Missing Node.js Context
**Discovery:** The initial developer experience guidance incorrectly assumes a Python/Flask/Docker stack. The actual repository is a static Cloudflare Pages app using Vanilla JS, Tailwind via CDN, and serverless Cloudflare Workers for the backend API.
**Impact:** Infrastructure tools like `pytest`, `docker`, `flake8`, and `requirements.txt` are mostly irrelevant. We need to focus on the JS ecosystem (`npm`, `Node.js`, `Wrangler`), which significantly shifts how we approach CI/CD, linting, and developer documentation.
**Action:** Always check the `package.json`, `Makefile`, and `wrangler.toml` files first. Rely on Node.js based tooling (`npm test`, `node --check`, etc.) instead of Python tooling.
