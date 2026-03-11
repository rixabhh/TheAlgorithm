## 2025-05-14 - [Pandas GroupBy & Memory Optimization]
**Learning:** The analytics pipeline suffered from $O(N_{weeks} \times \text{Python overhead})$ bottlenecks in `aggregate_weekly` due to `.apply()` on GroupBy objects, and significant memory spikes in `calculate_emoji_frequency` caused by massive intermediate string/list allocations ($O(N_{chars})$).
**Action:** Replace GroupBy `.apply()` with vectorized `.agg()` using temporary masked columns. Use generator expressions for character-level iteration in emoji detection to maintain a flat memory profile regardless of input size. Ensure pipeline-wide sorting awareness to remove redundant $O(N \log N)$ operations.

## 2025-05-15 - [Text Sanitization & Regex Pre-compilation]
**Learning:** Parsing large chat exports (50MB+) was bottlenecked by character-level Python generator loops in `sanitize_text` and redundant `re.compile` calls within the `ThreadPoolExecutor`. Python-level loops for string processing carry high overhead compared to C-native alternatives.
**Action:** Use `str.translate` with a precomputed mapping table for $O(N)$ sanitization at C-speed. Move all core regex patterns to the module level to ensure they are compiled once, preventing thread-contention and redundant CPU cycles during concurrent file processing.
