## 2025-06-11 — Security Hardening
**Vulnerability/Gap:** Missing global security headers, API key leakage risk on failures, broad PII scrubbing
**Root Cause:** Rapid frontend-first development without `_headers` or intercepting `_middleware.js`; generic regexes used.
**Fix Applied:** Added `_headers` and `functions/_middleware.js` to enforce strict CSP, X-Frame-Options, X-Content-Type-Options. Improved API key redaction safely. Added credit card, passport, and SSN patterns to `buildRawExcerptPack`.
**Remaining Risk:** Client-side memory exhaustion from massive files needs size limits.
