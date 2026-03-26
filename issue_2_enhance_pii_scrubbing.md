Title: [Enhancement] Strengthen Client-Side PII Scrubbing Rules

The current `Sensitive Mode` logic in `app.js` relies on relatively simple regexes to find emails and basic phone number formats. This approach may miss other highly sensitive PII such as:
- Passport numbers
- SSN / National Identity Numbers
- Credit Card and Bank Account patterns
- Cryptocurrency Wallet Addresses

We should expand our client-side regex dictionary to include these additional formats to provide a more comprehensive "Sensitive Mode".

Priority level: High - If a user relies on Sensitive Mode, leaking a credit card or passport number because of weak regex matching would be a severe violation of trust and privacy.
