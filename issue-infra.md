Title: Add pre-commit hooks for consistent code formatting

While we have `ruff` configured and linting checks in GitHub Actions, relying solely on CI for formatting creates a slow feedback loop for contributors.

Currently, a contributor might make a PR, wait 2 minutes for the CI to run, find out they have a trailing comma issue, fix it, and wait again.

**Proposed Solution:**
Add a `.pre-commit-config.yaml` file to the repository that automatically runs `ruff format` and `ruff check --fix` before any commit is finalized. This pushes the formatting checks to the developer's machine instantly.

**Why it matters for contributors:**
It guarantees that any code successfully committed locally is already compliant with the project's style guide, eliminating "fix lint" commits and reducing friction during the PR review process.