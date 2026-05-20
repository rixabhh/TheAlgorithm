## Title: Add Playwright E2E testing to CI

**Description:** We are currently only doing syntax checks on the Cloudflare Functions (`node --check`). Since the core parsing happens client-side, we need UI-level validation. We should integrate Playwright to spin up the local wrangler preview and test the dashboard generation end-to-end with mock chat data.
**Why it matters:** It prevents regressions in the parser and ensures that new feature additions don't break the client-side experience for our contributors and users.

## Title: Streamline initial local setup script

**Description:** We should add a `setup.sh` or a generic `make init` command that handles checking for `npm`, installing dependencies, copying the `.env.example` to `.dev.vars`, and giving a quick checklist before spinning up the local server.
**Why it matters:** Even though our stack is simple, an automated setup script reduces cognitive load for new contributors and gets them to a working local server in a single command, improving the overall contributor experience.
