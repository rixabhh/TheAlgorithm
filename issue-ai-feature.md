Title: Add tier-based AI summary formats

Right now, we generate a single comprehensive report. It would be valuable to generate a quick, 2-3 sentence summary as an immediate overview before diving into the detailed JSON schema output. This acts as a hook and decreases user perceived loading time.

Implementing this involves making an initial low-token generation call (or streaming) with a very brief prompt for a quick summary, followed by the deep analytical breakdown.
