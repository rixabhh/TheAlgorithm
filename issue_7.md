Title: [Privacy] Strengthen client-side PII scrubbing logic

Description/Risk:
Currently, the client-side string replacements handle basic information, but we should improve the robustness of PII scrubbing (e.g. detect passport numbers, bank account patterns, social security numbers) to guarantee no sensitive data slips through.

Proposed solution:
Expand the `standardizeEntities` and underlying regex/scrubbing logic in `static/js/parser.js` to automatically filter out these high-risk patterns.

Priority level:
High - Any leakage of such data constitutes a critical privacy breach, contradicting the core zero-knowledge promise.
