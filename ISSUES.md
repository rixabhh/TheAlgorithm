Title: Strengthen Client-Side PII Scrubbing (Sensitive Mode)
Description/Risk: There's an opportunity to add more rigorous PII detection (such as passport numbers, bank account patterns, or social security numbers) to our existing client-side logic to further enhance privacy guarantees. This improves defense-in-depth before chat statistics are even generated.
Proposed solution: Enhance the client-side parser regex to scrub more structured PII formats prior to building the statistics payload.
Priority level: Medium/High

Title: Add server-side verification for obvious PII leakage
Description/Risk: Although data is scrubbed client-side and only statistics are sent, there's a risk that malformed data or a client-side bypass could leak sensitive information into the payload sent to the LLM API.
Proposed solution: Add a lightweight regex scan on the server-side `analyze.js` payload before calling the LLM to verify that no obvious PII formats (emails, phone numbers, credit cards) have made it through. Reject the request if PII is detected.
Priority level: Medium
