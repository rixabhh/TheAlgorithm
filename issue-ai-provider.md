Title: Add Cloudflare Workers AI custom fine-tuned model support

The current Cloudflare Workers AI implementation relies on `@cf/meta/llama-3-8b-instruct`. While Llama 3 is good, it lacks the specialized "relationship therapist" nuance that models like Claude 3.5 Sonnet possess.

### Why this provider/feature matters
Since the app is deployed on Cloudflare Pages, Workers AI is the default and only free option for users. Improving its output directly improves the baseline user experience.

### Rough implementation approach
1. Fine-tune a smaller Llama model on synthetic, high-quality relationship analyses.
2. Deploy the fine-tuned model using Cloudflare Workers AI LoRA support.
3. Update `functions/api/analyze.js` to reference the new model path.

### User benefit
Users without BYOK API keys will receive significantly higher quality insights, increasing shareability and retention for the platform.
