Title: Add support for DeepSeek models through OpenRouter

[Why this provider/feature matters]
DeepSeek models offer excellent analytical capabilities at very low costs, which fits our zero-knowledge, local-heavy architecture perfectly. Since we already have OpenRouter integration, supporting it properly as a distinct option or highlighting it in the UI would make the "BYOK" experience more compelling.

[Rough implementation approach]
1. Add DeepSeek options to the `llmProvider` select in `dashboard.html`.
2. Map the new provider to the OpenRouter compatibility layer in `functions/api/llm_helper.js`.
3. Add a DeepSeek specific prompt tuning to `PROVIDER_SYSTEM_PROMPTS` if it requires unique formatting.

[User benefit]
Users get access to high-quality, inexpensive analysis without needing an OpenAI or Anthropic account, democratizing access to the Deep AI insights.

---

Title: Implement Relationship Trajectory Mapping

[Why this provider/feature matters]
Currently, our predictive outlook is a point-in-time snapshot. Adding a timeline or "trajectory" dimension (e.g., how the balance or sentiment has shifted over quarters) would make the analysis significantly more valuable and shareable.

[Rough implementation approach]
1. In the parser, compute quarterly/monthly aggregates of the `symmetryScore` and `sourceScore`.
2. Pass these temporal trends in the `stats` payload to the LLM.
3. Update the `ANALYSIS_SCHEMA` and `baseSystemPrompt` to include a `trajectory` field with a timeline summary.
4. Render the new trajectory field in the UI.

[User benefit]
Users get a dynamic, story-like view of how their relationship evolved, leading to better insights and higher sharing likelihood.
