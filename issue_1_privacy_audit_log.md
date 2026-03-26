Title: [Feature Request] Client-Side Privacy Audit Log

The current "Sensitive Mode" implementation redacts PII using regexes on the client side before any file is uploaded. While effective, it happens silently. Users who are already privacy-conscious might not fully trust that their data was successfully scrubbed.

We should provide a client-side summary (Audit Log) showing what was removed (e.g., "Redacted 14 Phone Numbers, 3 Email Addresses"). This log should never be sent anywhere, providing transparent verification of our privacy guarantees directly to the user.

Priority level: Medium - Strengthens the core privacy brand promise by providing verifiable proof of client-side scrubbing.
