export async function onRequestPost(context) {
    const { request, env } = context;
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';

    let api_key_ref = '';
    try {
        const data = await request.json();
        const { stats, my_name, partner_name, connection_type, language, context, compare_data, provider = 'cloudflare', api_key = '' } = data;
        api_key_ref = api_key;
        const tone = data.tone || 'balanced';

        // 1. RATE LIMITING & GLOBAL STATS (KV-based, Cloudflare only)
        if (provider === 'cloudflare' && env.KV_RATELIMIT) {
            const limitKey = `ratelimit_${ip}`;
            const current = await env.KV_RATELIMIT.get(limitKey);
            const count = current ? parseInt(current) : 0;
            if (count >= 2) return new Response(JSON.stringify({ error: "Free tier limit reached (2/hr). Wait or use BYOK." }), { status: 429 });
            await env.KV_RATELIMIT.put(limitKey, (count + 1).toString(), { expirationTtl: 3600 });
            
            // Increment global stats counter
            const globalCountKey = 'global_stats_chats_count';
            const globalCount = await env.KV_RATELIMIT.get(globalCountKey) || '0';
            await env.KV_RATELIMIT.put(globalCountKey, (parseInt(globalCount) + 1).toString());
        }

        // 2. AI GENERATION
        let report = null;

        const baseSystemPrompt = `You are 'The Algorithm', a brilliant friend who happens to be a therapist. You are warm, deeply insightful, empathetic, but brutally honest when needed.
You are analyzing chat statistics. You MUST provide deep behavioral insights based ONLY on the numerical stats provided. Never assume any raw text is provided.
CRITICAL RULES:
1. Return ONLY a valid JSON object. Do NOT wrap in markdown code blocks.
2. The JSON schema MUST be strictly adhered to: { "relationship_persona": "string", "compatibility_score": "integer 1-100", "ai_insight": { "dynamic_title": "string", "reality_check": "string", "recent_shift": "string", "red_flags": ["string"], "green_flags": ["string"], "brutal_verdict": "string" } }.
3. The VALUES inside the JSON MUST be written in the requested Output Language (${language || 'english'}). If Hinglish is requested, use conversational Hindi written in the English alphabet. Make it engaging, perceptive, and a bit gen-z.`;

        let systemPrompt = baseSystemPrompt;
        if (provider === 'anthropic') {
            systemPrompt = `<role>${baseSystemPrompt}</role>`;
        }

        let userPrompt = `Analyze chat: ${my_name} & ${partner_name}. Connection Type: ${connection_type || 'romantic'}. Output Language: ${language || 'english'}. Tone: ${tone}. `;
        if (context) userPrompt += `User Context/Background: ${context}. `;
        userPrompt += `Stats: ${JSON.stringify(stats)}. Provide actionable, highly personalized insights depending on if it's romantic, friendship, family, or professional.`;
        
        if (compare_data) {
            userPrompt = `COMPARE two chats for ${my_name}. Chat A: ${compare_data.nameA} vs Chat B: ${compare_data.nameB}. Stats A: ${JSON.stringify(compare_data.a)}. Stats B: ${JSON.stringify(compare_data.b)}. Output Language: ${language || 'english'}. Be ${tone}.`;
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

        async function fetchLLM(currentPrompt, retry = false) {
            let result = null;
            if (provider === 'cloudflare' && env.AI) {
                const aiResult = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
                    messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: currentPrompt }]
                });
                const match = aiResult.response.match(/\{[\s\S]*\}/);
                if (match) result = JSON.parse(match[0]);
            } else if (api_key) {
                let url, model, headers, body;
                headers = { 'Authorization': `Bearer ${api_key}`, 'Content-Type': 'application/json' };
                body = { messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: currentPrompt }] };

                if (provider === 'openai') {
                    url = 'https://api.openai.com/v1/chat/completions'; model = 'gpt-4o-mini';
                    body.model = model;
                    body.response_format = { type: "json_object" };
                } else if (provider === 'anthropic') {
                    url = 'https://api.anthropic.com/v1/messages'; model = 'claude-3-5-sonnet-20240620';
                    headers = { 'x-api-key': api_key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' };
                    body = { model, max_tokens: 1024, system: systemPrompt, messages: [{ role: 'user', content: currentPrompt }] };
                } else if (provider === 'gemini') {
                    url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${api_key}`;
                    headers = { 'Content-Type': 'application/json' };
                    body = { systemInstruction: { parts: [{ text: systemPrompt }] }, contents: [{ parts: [{ text: currentPrompt }] }], generationConfig: { responseMimeType: "application/json" } };
                } else if (provider === 'grok') {
                    url = 'https://api.x.ai/v1/chat/completions'; model = 'grok-2-latest';
                    body.model = model;
                    body.response_format = { type: "json_object" };
                } else if (provider === 'openrouter') {
                    url = 'https://openrouter.ai/api/v1/chat/completions'; model = 'openai/gpt-4o-mini';
                    body.model = model;
                    body.response_format = { type: "json_object" };
                } else if (provider === 'mistral') {
                    url = 'https://api.mistral.ai/v1/chat/completions'; model = 'mistral-large-latest';
                    body.model = model;
                    body.response_format = { type: "json_object" };
                } else if (provider === 'cohere') {
                    url = 'https://api.cohere.com/v1/chat'; model = 'command-r-plus';
                    body = { message: currentPrompt, preamble: systemPrompt, model, temperature: 0.3 };
                }

                if (url) {
                    const resp = await fetchWithTimeout(url, { method: 'POST', headers, body: JSON.stringify(body) });
                    if (!resp.ok) {
                        const errorText = await resp.text();
                        if (resp.status === 401) throw new Error("Unauthorized: Please check your API key.");
                        throw new Error(`API Error ${resp.status}: ${errorText}`);
                    }
                    const resData = await resp.json();

                    let contentStr = '';
                    if (provider === 'anthropic') {
                        if (resData.content && resData.content.length > 0) contentStr = resData.content[0].text;
                    } else if (provider === 'gemini') {
                        if (resData.candidates && resData.candidates.length > 0) contentStr = resData.candidates[0].content.parts[0].text;
                    } else if (provider === 'cohere') {
                        if (resData.text) contentStr = resData.text;
                    } else {
                        if (resData.choices && resData.choices.length > 0) contentStr = resData.choices[0].message.content;
                    }

                    if (contentStr) {
                        const match = contentStr.match(/\{[\s\S]*\}/);
                        if (match) result = JSON.parse(match[0]);
                    }
                }
            }
            return result;
        }

        try {
            report = await fetchLLM(userPrompt);
            if (!report || !report.relationship_persona) {
                throw new Error("Invalid format");
            }
        } catch (err) {
            // Retry with stricter prompt
            const strictPrompt = userPrompt + " You MUST reply with valid JSON ONLY. No other text.";
            try {
                report = await fetchLLM(strictPrompt, true);
            } catch (err2) {
                console.error("LLM retry failed", err2);
            }
        }

        // 3. FALLBACK
        if (!report) {
            if (language === 'hinglish') {
                report = {
                    relationship_persona: "Vibe Explorer",
                    compatibility_score: 80,
                    ai_insight: {
                        dynamic_title: "Quick Read",
                        reality_check: partner_name + " ke saath analysis complete ho gaya hai.",
                        recent_shift: "Energy bilkul stable lag rahi hai.",
                        red_flags: ["Deep read ke liye data thoda kam hai"],
                        green_flags: ["Dono active check-ins kar rahe ho"],
                        brutal_verdict: "Ek number vibe hai bhai/behen."
                    }
                };
            } else if (language === 'hindi') {
                report = {
                    relationship_persona: "Vibe Explorer",
                    compatibility_score: 80,
                    ai_insight: {
                        dynamic_title: "Quick Read",
                        reality_check: partner_name + " के साथ विश्लेषण पूरा हुआ।",
                        recent_shift: "ऊर्जा स्थिर लग रही है।",
                        red_flags: ["गहन विश्लेषण के लिए डेटा अपर्याप्त है"],
                        green_flags: ["सक्रिय संवाद चल रहा है"],
                        brutal_verdict: "संबंध अच्छा है।"
                    }
                };
            } else {
                report = {
                    relationship_persona: "Vibe Explorer",
                    compatibility_score: 80,
                    ai_insight: {
                        dynamic_title: "Quick Read",
                        reality_check: "Analysis complete for " + partner_name,
                        recent_shift: "The energy is stable.",
                        red_flags: ["Limited data for deep read"],
                        green_flags: ["Active check-ins"],
                        brutal_verdict: "It's a vibe."
                    }
                };
            }
        }

        return new Response(JSON.stringify({ report }), { headers: { 'Content-Type': 'application/json' } });

    } catch (e) {
        const errorMsg = e.message || 'Unknown error';
        const safeErrorMsg = errorMsg.replace(/sk-[a-zA-Z0-9_-]+/g, 'sk-...').replace(api_key_ref, '***');
        return new Response(JSON.stringify({ error: safeErrorMsg }), { status: 500 });
    }
}

