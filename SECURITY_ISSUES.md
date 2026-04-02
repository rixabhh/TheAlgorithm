Title: Add input length/size limits to app.js file reader

Description: The client-side file upload reading logic in `app.js` (`await file.text()`) reads the entire file into memory at once. If a user uploads an abnormally large file (e.g., several gigabytes), this could easily lead to memory exhaustion and crash the user's browser, leading to a localized Denial of Service (DoS).
Proposed solution: Introduce a `MAX_FILE_SIZE` limit check before calling `file.text()`. E.g., `if (file.size > 50 * 1024 * 1024) throw new Error("File too large");`
Priority level and why: High Priority - Although it's client-side, crashing the browser degrades UX severely and can be abused.

---

Title: Missing CSRF protection on form submissions

Description: The web forms in the application, such as the settings and main upload forms, do not include Cross-Site Request Forgery (CSRF) tokens.
Proposed solution: While the application currently relies heavily on client-side JS without authenticated sessions (which lowers the risk), if any endpoints in the backend were to mutate state or handle requests on behalf of an authenticated user (or via cookies), CSRF tokens would be essential. To be completely secure in-depth, CSRF tokens should be generated server-side and validated on any POST request.
Priority level and why: Medium Priority - Given the current architecture, state mutations happen via client-side API requests using transient tokens (in `sessionStorage`), so the risk of classic CSRF is low. However, adding CSRF tokens is a best practice defense-in-depth measure.
