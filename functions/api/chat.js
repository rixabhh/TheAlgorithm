import { makeChatLLMCall } from './llm_helper.js';

export async function onRequestPost(context) {
    const { request, env } = context;
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';

    try {
        const data = await request.json();
        const { stats, llmReport, chat_history = [], message, provider = 'cloudflare', api_key = '' } = data;

        // 1. RATE LIMITING (KV-based, Cloudflare only)
        if (provider === 'cloudflare' && env.KV_RATELIMIT) {
            const limitKey = `ratelimit_chat_${ip}`;
            const current = await env.KV_RATELIMIT.get(limitKey);
            const count = current ? parseInt(current) : 0;
            // Slightly higher limit for chatting compared to full generation
            if (count >= 10) return new Response(JSON.stringify({ error: "Free tier limit reached (10 chats/hr). Wait or configure your own API key to continue coaching." }), { status: 429 });
            await env.KV_RATELIMIT.put(limitKey, (count + 1).toString(), { expirationTtl: 3600 });
        }

        // 2. SYSTEM PROMPT
        const baseSystemPrompt = `You are 'The Algorithm', an expert relationship analyst and communication coach. You act like a brilliant friend who happens to be a therapist - warm, insightful, empathetic, but brutally honest.
The user has generated an AI Insight Vibe Report based on their chat exports.
Your job is to answer their specific follow-up questions about this relationship, using their exact STATS and REPORT context below.
Be direct, deeply insightful, and don't coddle them. Reference their data explicitly if it helps make a point regarding their behaviors or power dynamics.
Keep responses concise—no more than 3 paragraphs. DO NOT format your response as JSON, return raw conversational text.

----- STATS CONTEXT -----
${JSON.stringify(stats)}

----- GENERATED VIBE REPORT -----
${JSON.stringify(llmReport)}
-------------------------`;

        const PROVIDER_SYSTEM_PROMPTS = {
            "anthropic": `<role>\n${baseSystemPrompt}\n</role>`,
            "default": baseSystemPrompt
        };
        const systemPrompt = PROVIDER_SYSTEM_PROMPTS[provider] || PROVIDER_SYSTEM_PROMPTS["default"];

        let responseText = null;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30-second timeout max

        try {
            responseText = await makeChatLLMCall(provider, api_key, systemPrompt, chat_history, message, env, controller.signal);
            clearTimeout(timeoutId);
        } catch (callError) {
            clearTimeout(timeoutId);
            if (callError.name === 'AbortError') {
                throw new Error("Chat request timed out. Please try again.");
            }
            throw callError;
        }

        if (!responseText) {
            responseText = "I'm having trouble connecting to my models right now. Please try again later.";
        }

        return new Response(JSON.stringify({ text: responseText }), { headers: { 'Content-Type': 'application/json' } });

    } catch (e) {
        let errorMsg = e.message || "Chat failed. Check your API key and try again.";
        // Mask any API keys that might have leaked in the error message
        errorMsg = errorMsg.replace(/sk-[a-zA-Z0-9_-]+/g, 'sk-...');
        return new Response(JSON.stringify({ error: errorMsg }), { status: 500 });
    }
}
