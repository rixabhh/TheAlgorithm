## 2024-05-24 — Missing Core Setup
**Discovery:** The repository lacked standard Python infrastructure files like `requirements.txt`, `app.py`, and testing configuration despite being Python-based for local development and Hugging Face deployments.
**Impact:** New contributors would find it difficult to set up a local development environment and run tests out of the box.
**Action:** Created standard Python configuration (`requirements.txt`, `pyproject.toml`, `app.py` for serving), Docker multi-stage builds, and CI workflows to establish a robust baseline.

## 2024-05-24 — Hugging Face & Docker Constraints
**Discovery:** Hugging Face Spaces require running on port 7860 and often run in resource-constrained environments.
**Impact:** Docker image needs to be optimized for size and explicitly bind to port 7860 with a non-root user.
**Action:** Implemented a multi-stage Docker build using `python:3.11-slim`, added a health check, and configured an `appuser` to avoid running as root.

## 2024-05-24 — Security & Action Constraints
**Discovery:** The `pull_request_target` trigger combined with `actions/checkout` can lead to high-severity security vulnerabilities by executing untrusted code in a privileged workflow context, such as in the labeler workflow. Also, Cloudflare Wrangler action needs explicit env var mapping to prevent 'Project not found' errors in environments lacking secrets (like fork PRs).
**Impact:** Prevents malicious code execution via PRs and ensures reliable preview deployment pipelines.
**Action:** Use `pull_request` instead of `pull_request_target` for the labeler workflow and ensure CF tokens are mapped in the `env:` block as well as using the `if: ${{ secrets.CLOUDFLARE_API_TOKEN != '' }}` check to degrade gracefully.
