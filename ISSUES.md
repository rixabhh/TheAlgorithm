Title: Add PR preview environments via Wrangler to pipeline

Deploying Cloudflare Pages preview environments on every Pull Request would significantly improve the review process. Currently, the pipeline is configured to deploy to Cloudflare on pushes, but we should expand `wrangler pages deploy` to provide isolated PR preview URLs.
This matters for contributors because reviewers can instantly test parser changes, UI fixes, and AI integrations without needing to pull down the branch and start the wrangler server locally, drastically lowering the barrier to code review.

---

Title: Add Playwright visual verification tests for dashboard

We currently rely on static node syntax checks and manual local testing to verify frontend changes. We should implement a basic Playwright test suite to automatically open the dashboard, upload a mock dataset, and visually verify that key metrics render correctly.
This matters for contributors because parser updates and neobrutalist UI tweaks can easily break the fragile vanilla JS DOM manipulation inadvertently. Automated visual tests give contributors confidence that they haven't caused regressions.
