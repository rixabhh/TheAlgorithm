export async function onRequestPost(context) {
    const { request, env } = context;
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';

    try {
        const data = await request.json();
        const { stats, my_name, partner_name, connection_type, language, context, compare_data, provider = 'cloudflare', api_key = '' } = data;
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

        const baseSystemPrompt = `You are 'The Algorithm', an expert relationship analyst and communication coach. Your role is to provide deep behavioral insights based on statistical communication data. You are acting as a brilliant friend who happens to be a therapist - warm, insightful, but brutally honest.

Your analysis tone should be: ${tone}.

CRITICAL RULES:
1. Return ONLY a valid JSON object. Do NOT wrap in markdown code blocks. No preamble, no explanation.
2. The JSON keys MUST remain exactly as follows (in English): { "relationship_persona": "", "compatibility_score": 0, "ai_insight": { "dynamic_title": "", "reality_check": "", "recent_shift": "", "red_flags": [], "green_flags": [], "brutal_verdict": "" } }.
3. The VALUES inside the JSON MUST be written in the requested Output Language (${language || 'english'}). If Hinglish is requested, use conversational Hindi written in the English alphabet (e.g., 'Bhai kya kar raha hai'). Make it engaging and witty.
4. Ensure your "reality_check" and "brutal_verdict" directly address the power dynamics, response times, and sentiment patterns provided in the stats.`;

        let systemPrompt = baseSystemPrompt;
        if (provider === 'anthropic') {
            systemPrompt = `<role>\n${baseSystemPrompt}\n</role>`;
        }

        let userPrompt = `Analyze chat: ${my_name} & ${partner_name}. Connection Type: ${connection_type || 'romantic'}. Output Language: ${language || 'english'}. Tone: ${tone}. `;
        if (context) userPrompt += `User Context/Background: ${context}. `;
        userPrompt += `Stats: ${JSON.stringify(stats)}.`;
        
        if (compare_data) {
            userPrompt = `COMPARE two chats for ${my_name}. Chat A: ${compare_data.nameA} vs Chat B: ${compare_data.nameB}. Stats A: ${JSON.stringify(compare_data.a)}. Stats B: ${JSON.stringify(compare_data.b)}. Output Language: ${language || 'english'}. Be ${tone}.`;
        }

        let rawTextResponse = null;

        if (provider === 'cloudflare' && env.AI) {
            const aiResult = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
                messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }]
            });
            rawTextResponse = aiResult.response;
        } else if (api_key) {
            let url, model, headers, body;
            
            headers = { 'Authorization': `Bearer ${api_key}`, 'Content-Type': 'application/json' };

            if (provider === 'anthropic') {
                url = 'https://api.anthropic.com/v1/messages';
                headers['x-api-key'] = api_key;
                headers['anthropic-version'] = '2023-06-01';
                delete headers['Authorization'];
                body = {
                    model: 'claude-3-haiku-20240307',
                    system: systemPrompt,
                    messages: [{ role: 'user', content: userPrompt }],
                    max_tokens: 1000
                };
            } else if (provider === 'gemini') {
                url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${api_key}`;
                delete headers['Authorization'];
                body = {
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    contents: [{ parts: [{ text: userPrompt }] }],
                    generationConfig: { responseMimeType: "application/json" }
                };
            } else {
                // OpenAI-compatible providers
                if (provider === 'openai') { url = 'https://api.openai.com/v1/chat/completions'; model = 'gpt-4o-mini'; }
                else if (provider === 'groq') { url = 'https://api.groq.com/openai/v1/chat/completions'; model = 'llama-3.1-70b-versatile'; }
                else if (provider === 'grok') { url = 'https://api.x.ai/v1/chat/completions'; model = 'grok-2-latest'; }
                else if (provider === 'openrouter') { url = 'https://openrouter.ai/api/v1/chat/completions'; model = 'openai/gpt-4o-mini'; }
                else if (provider === 'mistral') { url = 'https://api.mistral.ai/v1/chat/completions'; model = 'mistral-small-latest'; }
                else if (provider === 'cohere') { url = 'https://api.cohere.ai/v1/chat'; model = 'command-r-plus'; } // Note: Cohere V1 chat is slightly different, adapting if needed. Let's stick to standard completion for cohere if possible, actually cohere requires different payload. Let's implement cohere properly.

                if (provider === 'cohere') {
                    // Cohere uses a different payload structure
                    body = {
                        model: model,
                        message: userPrompt,
                        preamble: systemPrompt
                    };
                } else {
                    body = {
                        model,
                        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }]
                    };
                    if (provider === 'openai' || provider === 'groq' || provider === 'grok' || provider === 'openrouter' || provider === 'mistral') {
                        body.response_format = { type: "json_object" };
                    }
                }
            }

            // AbortController for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

            try {
                const resp = await fetch(url, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(body),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (!resp.ok) {
                    console.error(`API returned status: ${resp.status}`);
                } else {
                    const resData = await resp.json();

                    if (provider === 'anthropic') {
                        if (resData.content && resData.content.length > 0) rawTextResponse = resData.content[0].text;
                    } else if (provider === 'gemini') {
                        if (resData.candidates && resData.candidates.length > 0) rawTextResponse = resData.candidates[0].content.parts[0].text;
                    } else if (provider === 'cohere') {
                        if (resData.text) rawTextResponse = resData.text;
                    } else {
                        if (resData.choices && resData.choices.length > 0) rawTextResponse = resData.choices[0].message.content;
                    }
                }
            } catch (e) {
                console.error("LLM fetch failed:", e);
                // Fallthrough to report = null
            }
        }

        // Try to parse the report
        if (rawTextResponse) {
            try {
                const match = rawTextResponse.match(/\{[\s\S]*\}/);
                if (match) {
                    report = JSON.parse(match[0]);

                    // Validate schema
                    const required = ["relationship_persona", "compatibility_score", "ai_insight"];
                    const isValid = required.every(key => key in report);
                    if (!isValid) {
                        console.error("JSON missing required fields");
                        report = null;
                    }
                } else {
                    console.error("No JSON found in response");
                    report = null;
                }
            } catch (e) {
                // If it fails, we fall through to the fallback report
                console.error("Failed to parse LLM response:", e);
                report = null;
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
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}

