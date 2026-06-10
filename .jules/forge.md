## 2024-05-18 — Project Architecture Reality Check
**Discovery:** Despite system prompts suggesting a Python/Flask/Docker stack, the project is purely a Static Cloudflare Pages app using Vanilla JS and Serverless API functions.
**Impact:** Avoids introducing unnecessary Python toolchains or Docker configurations, ensuring CI and dev environments are correctly built around Node.js and Wrangler.
**Action:** Always verify actual project files (`package.json`, `README.md`) before blindly applying infrastructure templates. Adapted the pipeline to securely support Cloudflare preview deployments from PR forks.
