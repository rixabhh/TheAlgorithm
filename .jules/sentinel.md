## 2025-05-14 - [XSS in Dashboard Rendering]
**Vulnerability:** XSS (Cross-Site Scripting) via `.innerHTML` when rendering chat messages and LLM-generated content (repair tips, milestones, emojis).
**Learning:** Even AI-generated content should be treated as untrusted user input, as it's derived from the raw chat data. Directly injecting this into the DOM via `.innerHTML` allows for script execution if the chat contains malicious payloads.
**Prevention:** Use `.textContent` for plain text or always wrap dynamic content in a robust `escapeHTML` helper before using `.innerHTML`. Implemented a shared utility `static/js/dashboard_utils.js` for consistent escaping across the dashboard.

## 2026-03-09 - [SSRF and Insecure Sessions]
**Vulnerability:** Server-Side Request Forgery (SSRF) via unvalidated `hf_url` parameter and insecure session configuration (hardcoded secret, missing HttpOnly flag).
**Learning:** External URLs provided by users for offloading computation (like cloud GPUs) are high-risk SSRF vectors. Relying on a static secret key in a public/open-source repo compromises session integrity.
**Prevention:** Implement strict URL allowlisting (enforce HTTPS, specific domains like `*.lit.ai`). Use environment variables for secrets with secure random fallbacks. Always set `SESSION_COOKIE_HTTPONLY=True` to mitigate XSS-based session hijacking.
