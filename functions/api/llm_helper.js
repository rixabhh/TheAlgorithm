export async function makeChatLLMCall(provider, api_key, systemPrompt, chat_history, message, env, signal) {
    if (provider === 'cloudflare' && env.AI) {
        const messages = [{ role: 'system', content: systemPrompt }];
        chat_history.forEach(msg => messages.push({ role: msg.role, content: msg.content }));
        messages.push({ role: 'user', content: message });

        const aiResult = await env.AI.run('@cf/meta/llama-3-8b-instruct', { messages });
        return aiResult.response;
    }

    if (!api_key) return null;

    if (provider === 'cohere') {
        const url = 'https://api.cohere.ai/v1/chat';
        const model = 'command-r-plus';
        const cohereChatHistory = chat_history.map(msg => ({
            role: msg.role === 'user' ? 'USER' : 'CHATBOT',
            message: msg.content
        }));

        const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${api_key}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: model,
                message: message,
                preamble: systemPrompt,
                chat_history: cohereChatHistory,
                max_tokens: 500
            }),
            signal: signal
        });
        if (!resp.ok) throw new Error(`API returned ${resp.status}`);
        const resData = await resp.json();
        return resData.text;
    } else if (provider === 'anthropic') {
        const url = 'https://api.anthropic.com/v1/messages';
        const model = 'claude-3-5-sonnet-20240620';

        const anthropicMessages = [];
        chat_history.forEach(msg => {
            anthropicMessages.push({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.content
            });
        });
        anthropicMessages.push({ role: 'user', content: message });

        const resp = await fetch(url, {
            method: 'POST',
            headers: {
                'x-api-key': api_key,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                system: systemPrompt,
                messages: anthropicMessages,
                max_tokens: 500
            }),
            signal: signal
        });
        if (!resp.ok) throw new Error(`API returned ${resp.status}`);
        const resData = await resp.json();
        return resData.content[0].text;
    } else if (provider === 'gemini') {
        const model = 'gemini-2.5-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${api_key}`;

        const geminiContents = [];
        chat_history.forEach(msg => {
            geminiContents.push({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            });
        });
        geminiContents.push({ role: 'user', parts: [{ text: message }] });

        const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents: geminiContents
            }),
            signal: signal
        });
        if (!resp.ok) throw new Error(`API returned ${resp.status}`);
        const resData = await resp.json();
        return resData.candidates[0].content.parts[0].text;
    } else {
        // OpenAI-compatible providers
        let url, model;
        if (provider === 'openai') { url = 'https://api.openai.com/v1/chat/completions'; model = 'gpt-4o-mini'; }
        else if (provider === 'groq') { url = 'https://api.groq.com/openai/v1/chat/completions'; model = 'llama-3.1-70b-versatile'; }
        else if (provider === 'grok') { url = 'https://api.x.ai/v1/chat/completions'; model = 'grok-2-latest'; }
        else if (provider === 'openrouter') { url = 'https://openrouter.ai/api/v1/chat/completions'; model = 'openai/gpt-4o'; }
        else if (provider === 'mistral') { url = 'https://api.mistral.ai/v1/chat/completions'; model = 'mistral-large-latest'; }

        if (!url) return null;

        const messages = [{ role: 'system', content: systemPrompt }];
        chat_history.forEach(msg => messages.push({ role: msg.role, content: msg.content }));
        messages.push({ role: 'user', content: message });

        const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${api_key}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, messages, max_tokens: 500 }),
            signal: signal
        });

        if (!resp.ok) throw new Error(`API returned ${resp.status}`);
        const resData = await resp.json();
        return resData.choices[0].message.content;
    }
}
export async function makeLLMCall(provider, api_key, systemPrompt, userPrompt, env, signal) {
    if (provider === 'cloudflare' && env.AI) {
        const aiResult = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }]
        });
        return aiResult.response;
    }

    if (!api_key) return null;

    if (provider === 'cohere') {
        const url = 'https://api.cohere.ai/v1/chat';
        const model = 'command-r-plus';
        const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${api_key}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: model,
                message: userPrompt,
                preamble: systemPrompt,
                response_format: { type: "json_object" }
            }),
            signal: signal
        });
        if (!resp.ok) throw new Error(`API returned ${resp.status}`);
        const resData = await resp.json();
        return resData.text;
    } else if (provider === 'anthropic') {
        const url = 'https://api.anthropic.com/v1/messages';
        const model = 'claude-3-5-sonnet-20240620';
        const resp = await fetch(url, {
            method: 'POST',
            headers: {
                'x-api-key': api_key,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                system: systemPrompt,
                messages: [{ role: 'user', content: userPrompt }],
                max_tokens: 4000
            }),
            signal: signal
        });
        if (!resp.ok) throw new Error(`API returned ${resp.status}`);
        const resData = await resp.json();
        return resData.content[0].text;
    } else if (provider === 'gemini') {
        const model = 'gemini-2.5-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${api_key}`;
        const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            }),
            signal: signal
        });
        if (!resp.ok) throw new Error(`API returned ${resp.status}`);
        const resData = await resp.json();
        return resData.candidates[0].content.parts[0].text;
    } else {
        // OpenAI-compatible providers
        let url, model;
        if (provider === 'openai') { url = 'https://api.openai.com/v1/chat/completions'; model = 'gpt-4o-mini'; }
        else if (provider === 'groq') { url = 'https://api.groq.com/openai/v1/chat/completions'; model = 'llama-3.1-70b-versatile'; }
        else if (provider === 'grok') { url = 'https://api.x.ai/v1/chat/completions'; model = 'grok-2-latest'; }
        else if (provider === 'openrouter') { url = 'https://openrouter.ai/api/v1/chat/completions'; model = 'openai/gpt-4o'; }
        else if (provider === 'mistral') { url = 'https://api.mistral.ai/v1/chat/completions'; model = 'mistral-large-latest'; }

        if (!url) return null;

        const reqBody = {
            model,
            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }]
        };

        if (provider === 'openai' || provider === 'mistral') {
            reqBody.response_format = { type: "json_object" };
        }

        const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${api_key}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(reqBody),
            signal: signal
        });

        if (!resp.ok) throw new Error(`API returned ${resp.status}`);
        const resData = await resp.json();
        return resData.choices[0].message.content;
    }
}
