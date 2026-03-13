## 2025-05-14 - [Pandas GroupBy & Memory Optimization]
**Learning:** The analytics pipeline suffered from $O(N_{weeks} \times \text{Python overhead})$ bottlenecks in `aggregate_weekly` due to `.apply()` on GroupBy objects, and significant memory spikes in `calculate_emoji_frequency` caused by massive intermediate string/list allocations ($O(N_{chars})$).
**Action:** Replace GroupBy `.apply()` with vectorized `.agg()` using temporary masked columns. Use generator expressions for character-level iteration in emoji detection to maintain a flat memory profile regardless of input size. Ensure pipeline-wide sorting awareness to remove redundant $O(N \log N)$ operations.

## 2026-03-10 - [Vectorized String Search & C-Layer Sanitization]
**Learning:** Joining massive Pandas Series of text into single strings for substring searching in `calculate_linguistic_mirroring` causes (N)$ memory bloat and slow Python-level scanning. Additionally, character-level generator loops for text sanitization are inefficient compared to built-in C-optimized methods.
**Action:** Use `.str.contains(habit, regex=False).any()` for habit detection to leverage vectorized searching without intermediate string allocations. Replace character-level loops with `str.translate()` and precomputed mapping tables for (N)$ text sanitization at C-speed.
## 2025-05-15 - [Text Sanitization & Regex Pre-compilation]
**Learning:** Parsing large chat exports (50MB+) was bottlenecked by character-level Python generator loops in `sanitize_text` and redundant `re.compile` calls within the `ThreadPoolExecutor`. Python-level loops for string processing carry high overhead compared to C-native alternatives.
**Action:** Use `str.translate` with a precomputed mapping table for $O(N)$ sanitization at C-speed. Move all core regex patterns to the module level to ensure they are compiled once, preventing thread-contention and redundant CPU cycles during concurrent file processing.

## 2025-05-16 - [Pipeline-wide String Conversion Optimization]
**Learning:** In multi-step analytics pipelines (like `run_analytics_pipeline`), multiple functions often perform identical string casts (`astype(str)`) and normalizations (`str.lower()`) on the same columns. For large datasets (100k+ messages), these redundant O(N) operations cumulatively account for significant CPU overhead and garbage collection pressure.
**Action:** Pre-calculate normalized series (e.g., `text_str` and `text_lower`) once at the start of the pipeline. Update downstream function signatures to accept these pre-calculated series as optional parameters, defaulting to local calculation for backward compatibility. This ensures each transformation happens exactly once per request.
