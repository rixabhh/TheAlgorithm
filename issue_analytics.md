Title: Deeper Conflict Resolution Analysis

Body: Right now we track negative sentiment and apology words, but we don't have a structured way to measure "conflict resolution time" (how long it takes from an argument to a return to positive baseline). It would be amazing to build a "Forgiveness Latency" metric.
Why it matters: It gives users deep insight into how quickly they recover from fights, which is a major indicator of relationship health.
Rough approach: I'd track a "conflict state" triggered by `CONFLICT_RE`, and calculate the time delta until the sentiment returns to positive or affectionate terms are used.
