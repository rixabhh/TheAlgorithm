Title: Discord parser doesn't handle image/media-only messages well
Body: Noticed this while working on the parsers. The Discord parser expects `msg.content` to be a string. If a message is purely a file/image attachment and has empty content, it is skipped entirely (`if (ts && text)`). We should include an attachment fallback like Telegram's `[media]` label.
Labels: bug

Title: Integrate OpenRouter for robust BYOK multimodality
Body: Noticed this while working on the parsers. OpenRouter would be highly valuable as a BYOK provider because it allows users to provide one key but dynamically test different models (e.g. switching between Claude 3.5 Sonnet and Llama 3) without updating multiple UI keys. We can implement this similarly to OpenAI since it uses an OpenAI-compatible API format.
Labels: enhancement
