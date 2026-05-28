
Title: Add client-side input size limits to prevent memory exhaustion
Description of the risk or improvement opportunity: Users can potentially upload enormous files causing the browser tab to crash or exhaust memory during parsing, leading to a local DoS.
Proposed solution: Introduce strict file size validation bounds in `app.js` before executing `reader.readAsArrayBuffer` or `reader.readAsText`. Implement stream-based partial parsing or hard file size cutoffs (e.g., max 10MB or 50MB).
Priority level and why: HIGH - Tab crashes result in poor user experience and potential vector for abuse if processing heavy files.

Title: Implement privacy audit log for PII scrub validation
Description of the risk or improvement opportunity: Currently, users have no visibility into what was scrubbed when 'Deep AI raw evidence' is opted-in. They must blindly trust the regex engine.
Proposed solution: Create a client-side only (never transmitted) audit log panel in the Settings modal that shows a few examples of redacted texts just before they are sent, demonstrating the scrubbing functionality in action.
Priority level and why: MEDIUM - Enhances user trust and verifies the privacy promise transparently to users without adding backend tracking.
