Title: [Security] Add server-side verification that no obvious PII made it through

Description/Risk:
Currently, PII scrubbing happens solely client-side. If a client bypasses the frontend or uses an outdated script, PII might hit the server and potentially be sent to the LLM.

Proposed solution:
Add a middleware or pre-hook in Cloudflare Workers (`analyze.js` and `chat.js`) to perform a final regex-based sanity check. If sensitive patterns (like credit card numbers) are detected in the payload, the request should be rejected before reaching the LLM.

Priority level:
Medium - Defence-in-depth measure to ensure client-side bypasses do not compromise the zero-knowledge guarantee.
