## 2024-04-02 - Initial Security Hardening

**Vulnerability/Gap:**
1. Missing HTTP security headers (X-Frame-Options, Content-Security-Policy, etc.).
2. No rate limiting on the main Python server endpoints.
3. Unhandled error messages might expose internal traces.
4. Leftover `console.log` in client-side code (`dashboard.js`) potentially exposing info.
5. Incomplete memory cleanup in JavaScript (`app.js`), keeping parsed chat data in memory longer than necessary.

**Root Cause:**
These gaps were likely omitted during initial rapid development to get the MVP functional. For example, relying on Cloudflare for edge protection while neglecting local/fallback server hardening. Memory cleanup in JS is often overlooked because of garbage collection, but for strict zero-knowledge, explicit deletion is better.

**Fix Applied:**
1. Added `@app.after_request` to inject standard security headers (`X-Frame-Options`, `Content-Security-Policy`, `Referrer-Policy`, `X-Content-Type-Options`).
2. Implemented an in-memory `is_rate_limited` function hooked to `@app.before_request` (100 req/min).
3. Added a global exception handler in `app.py` that logs internally and returns a generic 500 error.
4. Removed the offending `console.log` from `static/js/dashboard.js`.
5. Added a `finally` block to the upload logic in `static/js/app.js` to explicitly zero out the arrays (`rawMessages` and `filteredMessages`) handling chat logs.

**Remaining Risk:**
1. The file upload parsing still accepts any size/length of string before processing, potentially causing memory exhaustion on the client side.
2. Form submissions are lacking CSRF tokens, though this is partially mitigated since there are no authenticated user sessions, only transient API keys.
