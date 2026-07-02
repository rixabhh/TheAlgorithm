## 2026-07-02 — Missing Security Headers
**Vulnerability/Gap:** Global HTTP security headers (CSP, X-Frame-Options, X-Content-Type-Options) were missing from the application.
**Root Cause:** Cloudflare Pages does not provide these by default unless explicitly configured via `_headers` or middleware.
**Fix Applied:** Created `_headers` for static routes and `functions/_middleware.js` for API routes to inject these headers globally.
**Remaining Risk:** The CSP might need updates if additional external CDN or API providers are integrated in the future.

## 2026-07-02 — Client-Side Memory Leak
**Vulnerability/Gap:** Raw message content (`rawMessages`) was left lingering in memory after processing.
**Root Cause:** The `finally` block in `static/js/app.js` did not explicitly clear the array.
**Fix Applied:** Added `rawMessages.length = 0;` inside the `finally` block in `app.js` to ensure garbage collection.
**Remaining Risk:** None identified for this specific array, though users running analysis on very large files may still experience brief memory spikes before GC triggers.

## 2026-07-02 — PII Scrubbing Deficiencies
**Vulnerability/Gap:** The PII scrubbing logic in `conversation_intelligence.js` missed patterns for SSNs, US Passports, and Credit Cards, leaving them exposed when raw excerpts are enabled.
**Root Cause:** Original regexes were limited to emails, phones, and links.
**Fix Applied:** Added highly specific regex constraints for US Passports, SSNs, and Credit Cards to prevent overly broad matching while securing PII.
**Remaining Risk:** Other sensitive patterns (e.g., driver's licenses or non-US IDs) might still slip through.

## 2026-07-02 — Rate Limiting Bypass on BYOK
**Vulnerability/Gap:** The KV-based rate limiting on `/analyze` and `/chat` was only applied to users on the free tier `freeTierProviders`.
**Root Cause:** Missing condition for global rate limiting in Cloudflare Worker endpoints.
**Fix Applied:** Adjusted logic to apply rate limiting globally, with a higher cap for BYOK users to prevent malicious resource exhaustion while preserving user experience.
**Remaining Risk:** IP spoofing could still theoretically bypass the limit.