Title: [Security] Add CSRF Protection to Form Submissions

Description of the risk or improvement opportunity:
Currently, the application lacks Cross-Site Request Forgery (CSRF) tokens. If the app expands to include server-side state or user accounts, attackers could force authenticated users to perform actions against their will.

Proposed solution:
Implement CSRF protection by including tokens in form submissions and validating them on the backend (e.g., using Flask-WTF or a custom token generation/validation middleware).

Priority level and why:
Medium Priority. The current application is mostly stateless and relies on client-side processing, but adding this defense-in-depth is crucial as the app evolves.


Title: [Privacy] Implement Advanced Client-Side PII Scrubbing

Description of the risk or improvement opportunity:
The application redacts some information, but it could be more robust. Advanced PII (like passport numbers, SSNs, credit card numbers, or obscure bank patterns) might still slip through the parser.

Proposed solution:
Incorporate more rigorous RegEx patterns for common international PII formats directly into `static/js/parser.js` before the payload is summarized.

Priority level and why:
High Priority. As a privacy-first app, ensuring zero leakage of PII into the stats payload or anywhere else is the core brand promise.