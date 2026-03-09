## 2025-05-15 - Text Sanitization and Regex Bottlenecks

**Learning:** Character-by-character iteration in Python for text sanitization (using `unicodedata.category`) is significantly slower than `str.translate` with a precomputed mapping table. Additionally, `re.compile` calls inside frequently invoked methods (especially when called via `ThreadPoolExecutor`) introduce redundant overhead.

**Action:** Use `str.translate` for bulk character filtering and move `re.compile` calls to the module level to ensure patterns are only compiled once.
