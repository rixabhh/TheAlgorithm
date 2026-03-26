## 2026-03-24 - [CORS Misconfiguration with Wildcard Origins]
**Vulnerability:** In `cloud_api/app.py`, `allow_credentials` was set to `True` while `allow_origins=["*"]`.
**Learning:** This combination allows any site to perform credentialed (cookies/auth headers) requests to the API, leading to CSRF and information disclosure.
**Prevention:** Always set `allow_credentials=False` when using wildcard origins in CORS middleware.
