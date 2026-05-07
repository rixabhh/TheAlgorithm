1. *Create `_headers` for static files*
   - Define a `_headers` file with `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and `Content-Security-Policy`.
2. *Verify `_headers` creation*
   - Verify that `_headers` was created correctly by reading the file.
3. *Create `functions/_middleware.js` for API security headers*
   - Intercept API responses and add the same security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Content-Security-Policy`) to ensure defense-in-depth on the serverless endpoints.
4. *Verify `functions/_middleware.js` creation*
   - Verify that `functions/_middleware.js` was created correctly by reading the file.
5. *Add server-side rate limiting on all requests*
   - Update `functions/api/analyze.js` and `functions/api/chat.js` to use `env.KV_RATELIMIT` for all requests, not just `provider === 'cloudflare'`. BYOK requests will have a higher threshold (e.g., 20/hr and 50/hr) to prevent DoS/abuse on the Worker.
6. *Verify rate-limiting logic updates*
   - Use `read_file` to confirm that the changes in `functions/api/analyze.js` and `functions/api/chat.js` were applied successfully.
7. *Add file upload limits and extensions validation*
   - Update `static/js/app.js` to explicitly enforce a max `10MB` file size (lowered from `20 * 1024 * 1024` which is currently in the file).
   - Ensure the file extension is strictly one of `.txt`, `.html`, or `.json`.
8. *Explicitly free memory*
   - Ensure `rawMessages` and `filteredMessages` arrays are cleared in the `finally` block of the upload handler in `static/js/app.js` (`rawMessages.length = 0`, `filteredMessages.length = 0`).
9. *Remove leaked console logs*
   - Remove `console.error` and `console.warn` in `static/js/dashboard.js`.
   - Remove `console.error` in `functions/api/analyze.js` to prevent potential API key or structure leaks in logs.
10. *Run Tests*
    - Run tests (`make test` or `npm test`) to verify the syntax of the cloudflare functions and that nothing is broken.
11. *Update journal*
    - Update `.jules/veil.md` with discoveries and fixes.
12. *Create Issues*
    - Open 2 GitHub issues for future privacy/security enhancements using `gh issue create`.
    - Issue 1: "Title: Add Server-Side File Content Validation", "Description: A malicious user could bypass client-side limits. We should parse chunks on the backend to verify it's a valid chat log."
    - Issue 2: "Title: Strengthen Client-Side PII Scrubbing", "Description: Enhance parser.js to detect and replace passport numbers, bank account patterns, etc."
13. *Complete pre commit steps*
    - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
14. *Submit the change*
    - Commit and submit changes following the human developer persona.
