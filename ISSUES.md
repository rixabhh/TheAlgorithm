Title: Add automated dependency vulnerability scanning

Right now, we manually audit dependencies during installation, but we don't have a structured way to block PRs that introduce vulnerable packages.
We should add an action like `npm audit` directly to the `test` job in `.github/workflows/pipeline.yml` to fail fast on moderate to high severity vulnerabilities.
This matters for contributors because it proactively prevents security issues from merging and removes the need for manual tracking.

---

Title: Add test fixtures for sample chat exports

Right now, developers have to use their personal chat exports to test parser or analytics changes, which makes it hard to reproduce specific edge cases across environments without sharing private data.
We should add a `tests/fixtures/` directory containing anonymized, synthetic JSON/CSV files that cover edge cases (e.g., emojis, deeply nested threads, malformed timestamps).
This matters for contributors because it guarantees everyone can instantly test parser robustness without needing real personal data.
