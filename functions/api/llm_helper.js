const OPENAI_COMPATIBLE_TARGETS = {
    openai: { url: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o-mini' },
    groq: { url: 'https://api.groq.com/openai/v1/chat/completions', model: 'llama-3.1-70b-versatile' },
    grok: { url: 'https://api.x.ai/v1/chat/completions', model: 'grok-2-latest' },
    openrouter: { url: 'https://openrouter.ai/api/v1/chat/completions', model: 'openai/gpt-4o-mini' },
    openrouter_free: { url: 'https://openrouter.ai/api/v1/chat/completions', model: 'openrouter/free' },
    mistral: { url: 'https://api.mistral.ai/v1/chat/completions', model: 'mistral-large-latest' }
};

const FREE_PROVIDERS = new Set(['free', 'openrouter_free']);

export async function makeChatLLMCall(provider, api_key, systemPrompt, chat_history, message, env, signal) {
    if (FREE_PROVIDERS.has(provider)) {
        return makeFreeChatCall(api_key, systemPrompt, chat_history, message, env, signal);
    }

    if (provider === 'cloudflare' && env.AI) {
        return makeCloudflareChatCall(systemPrompt, chat_history, message, env);
    }

    api_key = resolveProviderApiKey(provider, api_key, env);
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
                model,
                message,
                preamble: systemPrompt,
                chat_history: cohereChatHistory,
                max_tokens: 500
            }),
            signal
        });
        if (!resp.ok) throw new Error(`API returned ${resp.status}`);
        const resData = await resp.json();
        return resData.text;
    } else if (provider === 'anthropic') {
        const anthropicMessages = chat_history.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
        }));
        anthropicMessages.push({ role: 'user', content: message });

        const resp = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': api_key,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20240620',
                system: systemPrompt,
                messages: anthropicMessages,
                max_tokens: 500
            }),
            signal
        });
        if (!resp.ok) throw new Error(`API returned ${resp.status}`);
        const resData = await resp.json();
        return resData.content[0].text;
    } else if (provider === 'gemini') {
        const model = 'gemini-2.5-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${api_key}`;
        const geminiContents = chat_history.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));
        geminiContents.push({ role: 'user', parts: [{ text: message }] });

        const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents: geminiContents
            }),
            signal
        });
        if (!resp.ok) throw new Error(`API returned ${resp.status}`);
        const resData = await resp.json();
        return resData.candidates[0].content.parts[0].text;
    }

    const messages = [{ role: 'system', content: systemPrompt }];
    chat_history.forEach(msg => messages.push({ role: msg.role, content: msg.content }));
    messages.push({ role: 'user', content: message });
    return callOpenAICompatible(provider, api_key, messages, env, signal, { max_tokens: 500 });
}

export async function makeLLMCall(provider, api_key, systemPrompt, userPrompt, env, signal) {
    if (FREE_PROVIDERS.has(provider)) {
        return makeFreeAnalysisCall(api_key, systemPrompt, userPrompt, env, signal);
    }

    if (provider === 'cloudflare' && env.AI) {
        return makeCloudflareAnalysisCall(systemPrompt, userPrompt, env);
    }

    api_key = resolveProviderApiKey(provider, api_key, env);
    if (!api_key) return null;

    if (provider === 'cohere') {
        const resp = await fetch('https://api.cohere.ai/v1/chat', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${api_key}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'command-r-plus',
                message: userPrompt,
                preamble: systemPrompt,
                response_format: { type: 'json_object' }
            }),
            signal
        });
        if (!resp.ok) throw new Error(`API returned ${resp.status}`);
        const resData = await resp.json();
        return resData.text;
    } else if (provider === 'anthropic') {
        const resp = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': api_key,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20240620',
                system: systemPrompt,
                messages: [{ role: 'user', content: userPrompt }],
                max_tokens: 4000
            }),
            signal
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
                generationConfig: { responseMimeType: 'application/json' }
            }),
            signal
        });
        if (!resp.ok) throw new Error(`API returned ${resp.status}`);
        const resData = await resp.json();
        return resData.candidates[0].content.parts[0].text;
    }

    const requestOptions = {};
    if (provider === 'openai' || provider === 'mistral' || provider === 'openrouter') {
        requestOptions.response_format = { type: 'json_object' };
    }
    return callOpenAICompatible(provider, api_key, [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
    ], env, signal, requestOptions);
}

async function makeFreeChatCall(apiKey, systemPrompt, chatHistory, message, env, signal) {
    const openRouterKey = resolveProviderApiKey('openrouter_free', apiKey, env);
    if (openRouterKey) {
        const messages = [{ role: 'system', content: systemPrompt }];
        chatHistory.forEach(msg => messages.push({ role: msg.role, content: msg.content }));
        messages.push({ role: 'user', content: message });
        try {
            return await callOpenAICompatible('openrouter_free', openRouterKey, messages, env, signal, { max_tokens: 500 });
        } catch (err) {
            console.warn('OpenRouter free chat failed, falling back to Cloudflare AI:', err);
        }
    }

    if (env.AI) return makeCloudflareChatCall(systemPrompt, chatHistory, message, env);
    return null;
}

async function makeFreeAnalysisCall(apiKey, systemPrompt, userPrompt, env, signal) {
    const openRouterKey = resolveProviderApiKey('openrouter_free', apiKey, env);
    if (openRouterKey) {
        try {
            return await callOpenAICompatible('openrouter_free', openRouterKey, [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ], env, signal);
        } catch (err) {
            console.warn('OpenRouter free analysis failed, falling back to Cloudflare AI:', err);
        }
    }

    if (env.AI) return makeCloudflareAnalysisCall(systemPrompt, userPrompt, env);
    return null;
}

async function makeCloudflareChatCall(systemPrompt, chatHistory, message, env) {
    const messages = [{ role: 'system', content: systemPrompt }];
    chatHistory.forEach(msg => messages.push({ role: msg.role, content: msg.content }));
    messages.push({ role: 'user', content: message });
    const aiResult = await env.AI.run('@cf/meta/llama-3-8b-instruct', { messages });
    return aiResult.response;
}

async function makeCloudflareAnalysisCall(systemPrompt, userPrompt, env) {
    const aiResult = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }]
    });
    return aiResult.response;
}

async function callOpenAICompatible(provider, apiKey, messages, env, signal, options = {}) {
    const target = OPENAI_COMPATIBLE_TARGETS[provider];
    if (!target) return null;

    const resp = await fetch(target.url, {
        method: 'POST',
        headers: makeOpenAICompatibleHeaders(provider, apiKey, env),
        body: JSON.stringify({
            model: target.model,
            messages,
            ...options
        }),
        signal
    });

    if (!resp.ok) throw new Error(`API returned ${resp.status}`);
    const resData = await resp.json();
    return resData.choices?.[0]?.message?.content || null;
}

function resolveProviderApiKey(provider, apiKey, env) {
    if (apiKey) return apiKey;
    if (provider === 'openrouter' || provider === 'openrouter_free' || provider === 'free') {
        return env?.OPENROUTER_API_KEY || env?.OPENROUTER_KEY || '';
    }
    return '';
}

function makeOpenAICompatibleHeaders(provider, apiKey, env) {
    const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
    };

    if (provider === 'openrouter' || provider === 'openrouter_free' || provider === 'free') {
        headers['HTTP-Referer'] = env?.PUBLIC_SITE_URL || env?.CF_PAGES_URL || 'https://thealgorithm.pages.dev';
        headers['X-OpenRouter-Title'] = 'The Algorithm';
    }

    return headers;
}
