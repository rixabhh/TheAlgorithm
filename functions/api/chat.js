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
        const systemPrompt = `You are 'The Algorithm', a brutally honest relationship coaching analyst.
The user has generated an AI Insight Vibe Report based on their chat exports.
Your job is to answer their specific follow-up questions about this relationship, using their exact STATS and REPORT context below.
Be direct, deeply insightful, and don't coddle them. Reference their data explicitly if it helps make a point regarding their behaviors or power dynamics.
Keep responses concise—no more than 3 paragraphs. DO NOT format your response as JSON, return raw conversational text.

----- STATS CONTEXT -----
${JSON.stringify(stats)}

----- GENERATED VIBE REPORT -----
${JSON.stringify(llmReport)}
-------------------------`;

        // Format conversation history
        const messages = [{ role: 'system', content: systemPrompt }];
        chat_history.forEach(msg => messages.push({ role: msg.role, content: msg.content }));
        messages.push({ role: 'user', content: message });

        let responseText = null;

        if (provider === 'cloudflare' && env.AI) {
            // Use Llama 3 via Workers AI
            const aiResult = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
                messages: messages
            });
            responseText = aiResult.response;
        } else if (api_key && (provider === 'openai' || provider === 'groq' || provider === 'grok' || provider === 'openrouter' || provider === 'mistral' || provider === 'cohere')) {
            let url, model;
            if (provider === 'openai') { url = 'https://api.openai.com/v1/chat/completions'; model = 'gpt-4o-mini'; }
            else if (provider === 'groq') { url = 'https://api.groq.com/openai/v1/chat/completions'; model = 'llama-3.1-70b-versatile'; }
            else if (provider === 'grok') { url = 'https://api.x.ai/v1/chat/completions'; model = 'grok-2-latest'; }
            else if (provider === 'openrouter') { url = 'https://openrouter.ai/api/v1/chat/completions'; model = 'mistralai/mistral-7b-instruct'; }
            else if (provider === 'mistral') { url = 'https://api.mistral.ai/v1/chat/completions'; model = 'mistral-small-latest'; }
            else if (provider === 'cohere') { url = 'https://api.cohere.com/v1/chat'; model = 'command-r-plus'; }
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            try {
                let headers = { 'Authorization': `Bearer ${api_key}`, 'Content-Type': 'application/json' };
                let body = { model, messages, max_tokens: 500 };

                if (provider === 'cohere') {
                    // Cohere format logic for chat history
                    const lastUserMessage = messages[messages.length - 1].content;
                    const historyMessages = messages.slice(0, messages.length - 1).filter(m => m.role !== 'system');
                    const chat_history = historyMessages.map(m => ({
                        role: m.role === 'assistant' ? 'CHATBOT' : 'USER',
                        message: m.content
                    }));
                    body = {
                        model,
                        message: lastUserMessage,
                        preamble: systemPrompt,
                        chat_history: chat_history,
                        max_tokens: 500
                    };
                }

                const resp = await fetch(url, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(body),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                const resData = await resp.json();

                if (provider === 'cohere' && resData.text) {
                    responseText = resData.text;
                } else if (resData.choices && resData.choices.length > 0) {
                    responseText = resData.choices[0].message.content;
                } else if (resData.error) {
                    throw new Error(resData.error.message || "Provider API error");
                } else {
                    throw new Error("Invalid format from API provider.");
                }
            } catch (error) {
                clearTimeout(timeoutId);
                console.error(`LLM Chat Error (${provider}):`, error);
                throw new Error("Failed to connect to LLM provider. Please check your API key and try again.");
            }
        }

        if (!responseText) {
            responseText = "I'm having trouble connecting to my models right now. Please try again later.";
        }

        return new Response(JSON.stringify({ text: responseText }), { headers: { 'Content-Type': 'application/json' } });

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
