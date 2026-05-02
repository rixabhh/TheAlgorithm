Title: Add support for Fine-Tuned Cloudflare Workers AI Model

**Why this provider matters:**
Currently, our default free-tier uses a generic Llama-3 instruction model via Cloudflare Workers AI. While decent, it lacks the specific relationship-therapist nuance that GPT-4 or Claude 3.5 Sonnet natively have. By fine-tuning a small model (e.g., Llama-3-8B) on anonymized, high-quality relationship analysis examples (using LoRA on CF), we can dramatically boost the free-tier output quality to rival paid models.

**Rough implementation approach:**
1. Collect a dataset of 1,000+ excellent (synthetic) JSON outputs mimicking our schema.
2. Fine-tune a model on Cloudflare Workers AI using LoRA.
3. Update `functions/api/llm_helper.js` and `functions/api/analyze.js` to point the `cloudflare` provider fallback to our custom `@cf/meta/llama-3-8b-instruct-the-algorithm` LoRA adapter ID.

**User benefit:**
Users without an API key get an incredible, empathetic, high-quality analysis that makes them want to share it, vastly improving organic growth metrics.
