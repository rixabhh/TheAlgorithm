
Title: Add client-side privacy audit log for PII scrubbing
[Description of the risk or improvement opportunity] Users have to trust the "PII scrubbed" claim without seeing what exactly was removed before the anonymized payload is sent.
[Proposed solution] Add a strictly client-side local audit log component in the AI modal or dashboard that shows the exact patterns that were redacted.
[Priority level and why] Medium. Strengthens the zero-knowledge product promise by providing verifiable transparency.

Title: Implement Content Security Policy nonce/hash validation
[Description of the risk or improvement opportunity] The current CSP uses `'unsafe-inline'` for scripts and styles to support Tailwind CDN and inline JS, which weakens XSS protection.
[Proposed solution] Transition to strict CSP by generating and applying nonces or hashes for all inline scripts/styles and moving away from untrusted CDNs where possible.
[Priority level and why] Medium. While there is no database to extract, XSS could still be used to siphon the BYOK API keys from sessionStorage.
