## 2025-05-14 - [XSS in Dashboard Rendering]
**Vulnerability:** XSS (Cross-Site Scripting) via `.innerHTML` when rendering chat messages and LLM-generated content (repair tips, milestones, emojis).
**Learning:** Even AI-generated content should be treated as untrusted user input, as it's derived from the raw chat data. Directly injecting this into the DOM via `.innerHTML` allows for script execution if the chat contains malicious payloads.
**Prevention:** Use `.textContent` for plain text or always wrap dynamic content in a robust `escapeHTML` helper before using `.innerHTML`. Implemented a shared utility `static/js/dashboard_utils.js` for consistent escaping across the dashboard.

## 2026-03-09 - [SSRF and Insecure Sessions]
**Vulnerability:** Server-Side Request Forgery (SSRF) via unvalidated `hf_url` parameter and insecure session configuration (hardcoded secret, missing HttpOnly flag).
**Learning:** External URLs provided by users for offloading computation (like cloud GPUs) are high-risk SSRF vectors. Relying on a static secret key in a public/open-source repo compromises session integrity.
**Prevention:** Implement strict URL allowlisting (enforce HTTPS, specific domains like `*.lit.ai`). Use environment variables for secrets with secure random fallbacks. Always set `SESSION_COOKIE_HTTPONLY=True` to mitigate XSS-based session hijacking.

## 2025-05-15 - [Race Conditions and Unvalidated Uploads]
**Vulnerability:** File type allowlist was missing, and a shared global upload directory used manual cleanup, creating race conditions and DoS risks in multi-threaded environments.
**Learning:** Shared resources in concurrent web handlers are inherently prone to interference. A user's cleanup logic could delete another user's files during the window between upload and parsing.
**Prevention:** Always use `tempfile.TemporaryDirectory` within a `with` block for per-request filesystem isolation. This guarantees atomic cleanup and eliminates cross-request race conditions.

## 2026-03-11 - [DoS via Memory Exhaustion and Information Disclosure]
**Vulnerability:** Unbounded in-memory session storage (`GLOBAL_DATA_STORE`) and raw exception leakage in public API endpoints.
**Learning:** Using global dictionaries for session data without an eviction policy creates a trivial DoS vector where repeated requests can exhaust server RAM. Returning `str(e)` in API responses can leak internal stack traces or environment specifics.
**Prevention:** Implement a strict FIFO eviction policy (e.g., max 100 entries) for in-memory stores. Always mask internal errors with generic messages in production-facing `HTTPException` details. Additionally, enforce input length limits (e.g., 2,000 chars for context) and pin model revisions to ensure supply chain integrity.
