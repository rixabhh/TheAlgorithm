export async function onRequestPost(context) {
    const { request, env } = context;
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';

    let api_key_ref = '';
    try {
        const data = await request.json();
        const { stats, llmReport, chat_history = [], message, provider = 'cloudflare', api_key = '' } = data;
        api_key_ref = api_key;

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
        let systemPrompt = `You are 'The Algorithm', a brilliant friend who happens to be a therapist. You are warm, deeply insightful, empathetic, but brutally honest when needed.
The user has generated an AI Insight Vibe Report based on their chat exports.
Your job is to answer their specific follow-up questions about this relationship, using their exact STATS and REPORT context below.
Be direct, highly personalized, and don't coddle them. Reference their data explicitly if it helps make a point regarding their behaviors or power dynamics.
Keep responses concise—no more than 3 paragraphs. DO NOT format your response as JSON, return raw conversational text.

----- STATS CONTEXT -----
${JSON.stringify(stats)}

----- GENERATED VIBE REPORT -----
${JSON.stringify(llmReport)}
-------------------------`;

        if (provider === 'anthropic') {
            systemPrompt = `<role>${systemPrompt}</role>`;
        }

        async function fetchWithTimeout(resource, options = {}) {
            const { timeout = 30000 } = options;
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), timeout);
            const response = await fetch(resource, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(id);
            return response;
        }

        let responseText = null;

        if (provider === 'cloudflare' && env.AI) {
            const messages = [{ role: 'system', content: systemPrompt }];
            chat_history.forEach(msg => messages.push({ role: msg.role, content: msg.content }));
            messages.push({ role: 'user', content: message });

            const aiResult = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
                messages: messages
            });
            responseText = aiResult.response;
        } else if (api_key) {
            let url, model, headers, body;
            headers = { 'Authorization': `Bearer ${api_key}`, 'Content-Type': 'application/json' };
            
            if (provider === 'openai' || provider === 'grok' || provider === 'openrouter' || provider === 'mistral') {
                const messages = [{ role: 'system', content: systemPrompt }];
                chat_history.forEach(msg => messages.push({ role: msg.role, content: msg.content }));
                messages.push({ role: 'user', content: message });

                body = { messages, max_tokens: 500 };

                if (provider === 'openai') { url = 'https://api.openai.com/v1/chat/completions'; model = 'gpt-4o-mini'; }
                else if (provider === 'grok') { url = 'https://api.x.ai/v1/chat/completions'; model = 'grok-2-latest'; }
                else if (provider === 'openrouter') { url = 'https://openrouter.ai/api/v1/chat/completions'; model = 'openai/gpt-4o-mini'; }
                else if (provider === 'mistral') { url = 'https://api.mistral.ai/v1/chat/completions'; model = 'mistral-large-latest'; }

                body.model = model;
            } else if (provider === 'anthropic') {
                url = 'https://api.anthropic.com/v1/messages'; model = 'claude-3-5-sonnet-20240620';
                headers = { 'x-api-key': api_key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' };

                const messages = [];
                chat_history.forEach(msg => {
                    const role = msg.role === 'assistant' ? 'assistant' : 'user';
                    messages.push({ role, content: msg.content });
                });
                messages.push({ role: 'user', content: message });

                body = { model, max_tokens: 500, system: systemPrompt, messages };
            } else if (provider === 'gemini') {
                url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${api_key}`;
                headers = { 'Content-Type': 'application/json' };

                const contents = [];
                chat_history.forEach(msg => {
                    const role = msg.role === 'assistant' ? 'model' : 'user';
                    contents.push({ role, parts: [{ text: msg.content }] });
                });
                contents.push({ role: 'user', parts: [{ text: message }] });

                body = { systemInstruction: { parts: [{ text: systemPrompt }] }, contents };
            } else if (provider === 'cohere') {
                url = 'https://api.cohere.com/v1/chat'; model = 'command-r-plus';
                headers = { 'Authorization': `Bearer ${api_key}`, 'Content-Type': 'application/json' };

                const chatHistoryCohere = [];
                chat_history.forEach(msg => {
                    const role = msg.role === 'assistant' ? 'CHATBOT' : 'USER';
                    chatHistoryCohere.push({ role, message: msg.content });
                });

                body = { message, preamble: systemPrompt, chat_history: chatHistoryCohere, model, temperature: 0.3, max_tokens: 500 };
            }

            if (url) {
                const resp = await fetchWithTimeout(url, { method: 'POST', headers, body: JSON.stringify(body) });
                if (!resp.ok) {
                    const errorText = await resp.text();
                    if (resp.status === 401) throw new Error("Unauthorized: Please check your API key.");
                    throw new Error(`API Error ${resp.status}: ${errorText}`);
                }
                const resData = await resp.json();

                if (provider === 'anthropic') {
                    if (resData.content && resData.content.length > 0) responseText = resData.content[0].text;
                } else if (provider === 'gemini') {
                    if (resData.candidates && resData.candidates.length > 0) responseText = resData.candidates[0].content.parts[0].text;
                } else if (provider === 'cohere') {
                    if (resData.text) responseText = resData.text;
                } else {
                    if (resData.choices && resData.choices.length > 0) responseText = resData.choices[0].message.content;
                }

                if (!responseText) {
                    throw new Error("Invalid format from API provider.");
                }
            }
        }

        if (!responseText) {
            responseText = "I'm having trouble connecting to my models right now. Please try again later.";
        }

        return new Response(JSON.stringify({ text: responseText }), { headers: { 'Content-Type': 'application/json' } });

    } catch (e) {
        const errorMsg = e.message || 'Unknown error';
        const safeErrorMsg = errorMsg.replace(/sk-[a-zA-Z0-9_-]+/g, 'sk-...').replace(api_key_ref, '***');
        return new Response(JSON.stringify({ error: safeErrorMsg }), { status: 500 });
    }
}
