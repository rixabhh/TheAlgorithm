Title: Add Mistral AI Support for Privacy-Focused Processing

## Why this provider matters
The Algorithm's entire branding and architecture centers around being "paranoid-level privacy-first". Mistral is a European AI alternative known for strong open-weight models and better privacy alignment than OpenAI or Google. Supporting it naturally fits the product's ethos and gives users another option for BYOK.

## Rough implementation approach
- Add `mistral` to the `providers` list in the UI dropdown (`index.html` or settings modal).
- Implement basic client-side API key validation (Mistral keys typically start with a specific format or are alphanumeric).
- Add a new block in `functions/api/analyze.js`'s `callLLM` function to make a POST request to `https://api.mistral.ai/v1/chat/completions`.
- Ensure JSON parsing is handled gracefully since Mistral might have slightly different output tendencies.

## User benefit
Enhances trust among privacy-conscious users and developers. Provides access to fast, cost-effective models like `mistral-small` or `mistral-large` for analysis without data entering US-based corporate LLM pipelines.
