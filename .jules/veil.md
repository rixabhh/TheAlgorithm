## 2024-05-24 — Security & Privacy Hardening
**Vulnerability/Gap:** Missing security headers, potential API key leak in error responses, incomplete rate limiting for BYOK, and basic PII scrubbing that missed sensitive financial/identity patterns.
**Root Cause:** The application relied on default Cloudflare headers, masked only `sk-` keys but not `xai-` keys or the raw key from the request if explicitly parsed, only rate-limited free tiers, and implemented a naive PII scrubber.
**Fix Applied:** Added `_headers` and `functions/_middleware.js` to enforce CSP, X-Frame-Options, X-Content-Type-Options, and Referrer-Policy. Redacted all variations of API keys in global catch blocks. Implemented shared and BYOK rate limiting logic via `env.KV_RATELIMIT`. Added regexes for Credit Cards, IBANs, SSNs, and Passports to the client-side scrubber.
**Remaining Risk:** The PII regexes are generic heuristics and might not catch highly obfuscated financial data or edge-case country formats.
