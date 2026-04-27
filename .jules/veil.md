
## 2026-04-23 — Hardening Privacy and Security Posture
**Vulnerability/Gap:** Missing HTTP security headers, no in-memory rate limiting on API/upload routes, missing server-side file validation (size/extension limits), leaked internal stack traces via default Flask error handler, and potential data leakage via `console.log` in frontend JS.
**Root Cause:** Security configurations were not yet added on the backend endpoints or JavaScript clients as part of initial development.
**Fix Applied:** Added `@app.after_request` to inject CSP, X-Frame-Options, X-Content-Type-Options, and Referrer-Policy. Implemented `@app.before_request` for rate-limiting and file upload verification (max 10MB, specific text/json/html extensions). Added a global `@app.errorhandler`. Removed `console.log` and `console.error` instances from `app.js` and `dashboard.js`.
**Remaining Risk:** Client-side PII scrubbing could be more extensive, and a server-side secondary validation would serve as good defense-in-depth (tracked in issues 7 and 8).
