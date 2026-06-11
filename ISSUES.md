Title: Add rate limiting to file size input limits

Description of the risk or improvement opportunity:
Currently, there's no server-side or hard client-side limitation on the size of files that can be parsed and loaded into memory, which could lead to memory exhaustion and DoS of the client's browser for massive files.

Proposed solution:
Implement a hard cap on file size input processing (e.g. 50MB) and truncate beyond that, with an alert to the user.

Priority level and why:
High priority. A maliciously or accidentally crafted huge file could freeze the zero-knowledge app.

---

Title: Add client-side privacy audit log

Description of the risk or improvement opportunity:
Users have to trust that their data is being scrubbed. Adding an audit log would make this promise verifiable.

Proposed solution:
Provide a "View PII Scrubbing Audit Log" button that lists exactly which patterns were found and scrubbed before generating the final evidence pack, solely processed on the client side.

Priority level and why:
Medium priority. Enhances transparency and fortifies the zero-knowledge guarantee.