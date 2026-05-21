## 2026-05-21 — Added Security Response Headers & Rate Limiting
**Vulnerability/Gap:** Missing HTTP security headers (CSP, X-Frame-Options, etc.), bypassable rate limiting for BYOK users, and insufficient upload validation.
**Root Cause:** Security headers weren't defined globally or via middleware. Rate limiting in Cloudflare Workers was artificially scoped to free tiers only. Upload logic accepted files up to 20MB without strict extension checking.
**Fix Applied:** Added `_headers` and `functions/_middleware.js` to enforce CSP, X-Frame-Options, X-Content-Type-Options, and Referrer-Policy on all routes. Expanded rate limiting in `analyze.js` and `chat.js` to cover all requests based on IP, applying higher thresholds for BYOK. Updated `app.js` to restrict file uploads to 10MB and strictly allow `.txt`, `.html`, and `.json`.
**Remaining Risk:** We need to implement server-side PII scanning to ensure the payload to the LLM is definitively scrubbed.
