
## 2026-04-23 — Hardening Privacy and Security Posture
**Vulnerability/Gap:** Missing HTTP security headers, no in-memory rate limiting on API/upload routes, missing server-side file validation (size/extension limits), leaked internal stack traces via default Flask error handler, and potential data leakage via `console.log` in frontend JS.
**Root Cause:** Security configurations were not yet added on the backend endpoints or JavaScript clients as part of initial development.
**Fix Applied:** Added `@app.after_request` to inject CSP, X-Frame-Options, X-Content-Type-Options, and Referrer-Policy. Implemented `@app.before_request` for rate-limiting and file upload verification (max 10MB, specific text/json/html extensions). Added a global `@app.errorhandler`. Removed `console.log` and `console.error` instances from `app.js` and `dashboard.js`.
**Remaining Risk:** Client-side PII scrubbing could be more extensive, and a server-side secondary validation would serve as good defense-in-depth (tracked in issues 7 and 8).

## 2026-05-07 — Hardening Privacy and Security Posture (Cloudflare Edition)
**Vulnerability/Gap:** Missing HTTP security headers, rate limiting logic bypassed BYOK limits, file upload allowed large files without enforcing extension types, message arrays lingered in memory post-analysis, and console logs leaked API state or data.
**Root Cause:** Security defaults were missing from static and serverless deployments, rate limiting didn't properly enforce limits on external API keys, validation limits were too permissive, and development logs were left in production code.
**Fix Applied:** Added `_headers` and `functions/_middleware.js` to inject CSP, X-Frame-Options, X-Content-Type-Options, and Referrer-Policy everywhere. Updated `functions/api/analyze.js` and `chat.js` to rate-limit BYOK calls. Strict 10MB/extension validation was added to file uploads. Pushed explicit array clearing `length = 0` to `app.js` `finally` block, and removed all `console.error`/`console.warn` instances.
**Remaining Risk:** Client-side limitations can still be bypassed. Needs server-side validation.
