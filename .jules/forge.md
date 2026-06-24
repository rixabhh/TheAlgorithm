## 2024-05-24 — Infrastructure Architecture Discrepancy

**Discovery:** The prompt assumptions and initial instructions indicated a Python/Docker/Flask stack, but the actual repository is built on a vanilla JS/Cloudflare Pages serverless architecture without Python or Docker.
**Impact:** Using Python/Docker commands or configurations (like `requirements.txt` or Dockerfiles) would introduce unnecessary bloat or fail entirely. Native Node.js/Cloudflare tooling is required for CI/CD and developer setup.
**Action:** Always prioritize the verified local repository state over boilerplate instructions. Use Node.js tools (`npm`, `wrangler`, `make`) for infrastructure changes.