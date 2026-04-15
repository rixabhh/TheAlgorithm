Title: Migrate from pip to uv for faster dependency installation

Currently, we are using `pip` to install dependencies in both our local development environment (`Makefile` commands) and our GitHub Actions workflows (`.github/workflows/ci.yml`).

While `pip` works fine, `uv` is a drop-in replacement that is dramatically faster.

**Proposed Solution:**
Replace `pip` with `uv` in our setup instructions, `Makefile`, and CI workflows. `uv` can install dependencies in a fraction of the time, which will speed up CI pipeline runs and reduce friction for new developers running `make dev` or `make test` for the first time.

**Why it matters for contributors:**
Faster CI pipelines mean faster feedback on PRs. Faster local installations mean a better developer experience when cloning the project or checking out branches with updated dependencies.