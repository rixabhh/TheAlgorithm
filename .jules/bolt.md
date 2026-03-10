## 2025-05-14 - [Pandas GroupBy & Memory Optimization]
**Learning:** The analytics pipeline suffered from $O(N_{weeks} \times \text{Python overhead})$ bottlenecks in `aggregate_weekly` due to `.apply()` on GroupBy objects, and significant memory spikes in `calculate_emoji_frequency` caused by massive intermediate string/list allocations ($O(N_{chars})$).
**Action:** Replace GroupBy `.apply()` with vectorized `.agg()` using temporary masked columns. Use generator expressions for character-level iteration in emoji detection to maintain a flat memory profile regardless of input size. Ensure pipeline-wide sorting awareness to remove redundant $O(N \log N)$ operations.

## 2026-03-10 - [Vectorized String Search & C-Layer Sanitization]
**Learning:** Joining massive Pandas Series of text into single strings for substring searching in `calculate_linguistic_mirroring` causes (N)$ memory bloat and slow Python-level scanning. Additionally, character-level generator loops for text sanitization are inefficient compared to built-in C-optimized methods.
**Action:** Use `.str.contains(habit, regex=False).any()` for habit detection to leverage vectorized searching without intermediate string allocations. Replace character-level loops with `str.translate()` and precomputed mapping tables for (N)$ text sanitization at C-speed.
