## 2024-05-20 — Cloudflare Pages and Python/Docker Mismatch
**Discovery:** The generic prompt setup instructions mentioned Python 3.11+ and Docker, but the actual repository architecture is a Node/Cloudflare Pages stack. We must strictly prioritize and build for the verified local repository state, not the generic boilerplate instructions.
**Impact:** It is crucial for correct development direction. Adding unneeded Python CI flows or Dockerfiles to a purely serverless Node app creates bloat, confusion, and broken CI pipelines.
**Action:** Always inspect the actual file contents (like `package.json`, `README.md`, and `Makefile`) first instead of assuming the tech stack.

## 2024-05-20 — PR Preview Deployments on Fork PRs
**Discovery:** Using `cloudflare/wrangler-action` for pull request previews requires secrets (`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`) that are typically unavailable on fork PRs for security reasons.
**Impact:** Actions will fail on fork PRs without these secrets, resulting in broken CI runs and frustrating the contributor experience.
**Action:** Ensure the deployment step runs conditionally (`if: ${{ secrets.CLOUDFLARE_API_TOKEN != '' }}`) to gracefully skip execution on fork PRs and avoid failed builds. Also, explicitly map secrets to both the `env:` and `with:` blocks as required by the action.