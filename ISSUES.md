Title: Add pre-commit hooks for consistent code formatting

We currently have Prettier configured and exposed via `make format`, but developers have to remember to run it manually before committing. Implementing standard pre-commit hooks will automatically format staged files and ensure formatting inconsistencies never reach the CI checks.
This drastically reduces formatting friction during PR reviews and prevents broken builds over simple syntax or styling issues.

---

Title: Add documentation for adding new backend API routes

The `CONTRIBUTING.md` currently covers the overarching project architecture, but lacks a dedicated guide to creating, testing, and debugging new Cloudflare Workers routes (e.g., inside `functions/api/`).
Adding a brief tutorial or walkthrough of `functions/api/` will make it easier for new backend contributors to implement new integrations without guessing how Wrangler routing maps to file names.
