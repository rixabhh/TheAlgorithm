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
        let baseSystemPrompt = `You are 'The Algorithm', an expert relationship coaching analyst and therapist.
The user has generated an AI Insight Vibe Report based on their chat exports.
Your job is to answer their specific follow-up questions about this relationship, using their exact STATS and REPORT context below.
Be direct, deeply insightful, and empathetic. Act as a brilliant friend who happens to be a therapist. Reference their data explicitly if it helps make a point regarding their behaviors, emotional shifts, or power dynamics.
Keep responses concise—no more than 3 paragraphs. DO NOT format your response as JSON, return raw conversational text.

----- STATS CONTEXT -----
${JSON.stringify(stats)}

----- GENERATED VIBE REPORT -----
${JSON.stringify(llmReport)}
-------------------------`;

        let systemPrompt = baseSystemPrompt;
        if (provider === 'anthropic') {
            systemPrompt = `<role>\n${baseSystemPrompt}\n</role>`;
        }

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
        } else if (api_key) {
            let url, model, headers, body;
            
            headers = { 'Authorization': `Bearer ${api_key}`, 'Content-Type': 'application/json' };
            
            if (provider === 'anthropic') {
                url = 'https://api.anthropic.com/v1/messages';
                headers['x-api-key'] = api_key;
                headers['anthropic-version'] = '2023-06-01';
                delete headers['Authorization'];

                // For anthropic, extract system and history
                let anthropicMessages = [];
                chat_history.forEach(msg => anthropicMessages.push({ role: msg.role, content: msg.content }));
                anthropicMessages.push({ role: 'user', content: message });

                body = {
                    model: 'claude-3-haiku-20240307',
                    system: systemPrompt,
                    messages: anthropicMessages,
                    max_tokens: 1000
                };
            } else if (provider === 'gemini') {
                url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${api_key}`;
                delete headers['Authorization'];

                // Gemini expects slightly different formatting for history, simple mapping
                let geminiContents = [];
                chat_history.forEach(msg => {
                    geminiContents.push({
                        role: msg.role === 'assistant' ? 'model' : 'user',
                        parts: [{ text: msg.content }]
                    });
                });
                geminiContents.push({ role: 'user', parts: [{ text: message }] });

                body = {
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    contents: geminiContents
                };
            } else {
                if (provider === 'openai') { url = 'https://api.openai.com/v1/chat/completions'; model = 'gpt-4o-mini'; }
                else if (provider === 'groq') { url = 'https://api.groq.com/openai/v1/chat/completions'; model = 'llama-3.1-70b-versatile'; }
                else if (provider === 'grok') { url = 'https://api.x.ai/v1/chat/completions'; model = 'grok-2-latest'; }
                else if (provider === 'openrouter') { url = 'https://openrouter.ai/api/v1/chat/completions'; model = 'openai/gpt-4o-mini'; }
                else if (provider === 'mistral') { url = 'https://api.mistral.ai/v1/chat/completions'; model = 'mistral-small-latest'; }
                else if (provider === 'cohere') { url = 'https://api.cohere.ai/v1/chat'; model = 'command-r-plus'; }

                if (provider === 'cohere') {
                    // Cohere history
                    let cohereHistory = [];
                    chat_history.forEach(msg => {
                        cohereHistory.push({ role: msg.role === 'assistant' ? 'CHATBOT' : 'USER', message: msg.content });
                    });
                    body = {
                        model: model,
                        message: message,
                        preamble: systemPrompt,
                        chat_history: cohereHistory
                    };
                } else {
                    body = { model, messages, max_tokens: 500 };
                }
            }

            // AbortController for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            try {
                const resp = await fetch(url, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(body),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (!resp.ok) {
                    throw new Error(`API returned status: ${resp.status}`);
                }

                const resData = await resp.json();

                if (provider === 'anthropic') {
                    if (resData.content && resData.content.length > 0) responseText = resData.content[0].text;
                } else if (provider === 'gemini') {
                    if (resData.candidates && resData.candidates.length > 0) responseText = resData.candidates[0].content.parts[0].text;
                } else if (provider === 'cohere') {
                    if (resData.text) responseText = resData.text;
                } else {
                    if (resData.choices && resData.choices.length > 0) {
                        responseText = resData.choices[0].message.content;
                    }
                }

                if (!responseText) {
                    throw new Error("Invalid format from API provider.");
                }
            } catch (e) {
                if (e.name === 'AbortError') {
                    throw new Error("Chat timed out. Please try again.");
                }
                throw e;
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
