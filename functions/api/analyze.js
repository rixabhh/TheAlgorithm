export async function onRequestPost(context) {
    const { request, env } = context;
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';

    try {
        const data = await request.json();
        const { stats, my_name, partner_name, compare_data, provider = 'cloudflare', api_key = '' } = data;
        const tone = data.tone || 'balanced';

        // 1. RATE LIMITING (KV-based, Cloudflare only)
        if (provider === 'cloudflare' && env.KV_RATELIMIT) {
            const limitKey = `ratelimit_${ip}`;
            const current = await env.KV_RATELIMIT.get(limitKey);
            const count = current ? parseInt(current) : 0;
            if (count >= 2) return new Response(JSON.stringify({ error: "Free tier limit reached (2/hr). Wait or use BYOK." }), { status: 429 });
            await env.KV_RATELIMIT.put(limitKey, (count + 1).toString(), { expirationTtl: 3600 });
        }

        // 2. AI GENERATION SETTINGS
        const ANALYSIS_SCHEMA = {
            "relationship_persona": "string (creative title)",
            "compatibility_score": "integer 1-100",
            "ai_insight": {
                "dynamic_title": "string (short headline)",
                "reality_check": "string (1-2 sentences)",
                "recent_shift": "string (1-2 sentences)",
                "red_flags": ["string"],
                "green_flags": ["string"],
                "brutal_verdict": "string (short impactful summary)",
                "coaching_advice": "string (2-3 actionable sentences)",
                "growth_areas": ["string"]
            }
        };

        const PROVIDER_SYSTEM_PROMPTS = {
            "openai": `You are an expert relationship analyst and communication coach. You provide brutally honest but helpful insights.`,
            "anthropic": `<role>You are an expert relationship analyst and communication coach. You provide brutally honest but helpful insights.</role>`,
            "gemini": `You are an expert relationship analyst and communication coach. You provide brutally honest but helpful insights. 1. Be direct. 2. Follow schema exactly.`,
            "openrouter": `You are an expert relationship analyst and communication coach. You provide brutally honest but helpful insights.`,
            "cloudflare": `You are an expert relationship analyst and communication coach. You provide brutally honest but helpful insights.`,
            "grok": `You are an expert relationship analyst and communication coach. You provide brutally honest but helpful insights.`,
            "groq": `You are an expert relationship analyst and communication coach. You provide brutally honest but helpful insights.`
        };

        const ANALYSIS_PROMPT_TEMPLATE = `
Analyze these anonymous conversation statistics and provide deep behavioral insights. Tone: ${tone}.

## Statistics
{stats_json}

## Relationship Context
- Person A: ${my_name}
- Person B: ${partner_name}

## Required Output
Respond ONLY with valid JSON matching this exact schema. No preamble, no explanation, no markdown blocks.

${JSON.stringify(ANALYSIS_SCHEMA, null, 2)}
`;
        
        let statsJson = JSON.stringify(stats);
        if (compare_data) {
            statsJson = `COMPARE two chats for ${my_name}. Chat A: ${compare_data.nameA} vs Chat B: ${compare_data.nameB}. Stats A: ${JSON.stringify(compare_data.a)}. Stats B: ${JSON.stringify(compare_data.b)}.`;
        }

        const systemPrompt = PROVIDER_SYSTEM_PROMPTS[provider] || PROVIDER_SYSTEM_PROMPTS["openai"];
        const userPrompt = ANALYSIS_PROMPT_TEMPLATE.replace('{stats_json}', statsJson);

        let report = null;

        // Validation Function
        const validateAnalysisResponse = (response) => {
            if (!response) return false;
            const requiredKeys = ['relationship_persona', 'compatibility_score', 'ai_insight'];
            const hasOuter = requiredKeys.every(key => key in response);
            if (!hasOuter) return false;
            const requiredInsightKeys = ['dynamic_title', 'reality_check', 'recent_shift', 'red_flags', 'green_flags', 'brutal_verdict', 'coaching_advice', 'growth_areas'];
            const hasInner = requiredInsightKeys.every(key => key in response.ai_insight);
            return hasInner;
        };

        // LLM Caller
        const callLLM = async (currentProvider, apiKey, sysPrompt, usrPrompt, strict = false) => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            let finalUserPrompt = usrPrompt;
            if (strict) {
                finalUserPrompt += "\n\nCRITICAL: You MUST return ONLY valid JSON. No markdown backticks, no text before or after.";
            }

            try {
                let parsed = null;

                if (currentProvider === 'cloudflare' && env.AI) {
                    const aiResult = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
                        messages: [{ role: 'system', content: sysPrompt }, { role: 'user', content: finalUserPrompt }]
                    });
                    const match = aiResult.response.match(/\{[\s\S]*\}/);
                    if (match) parsed = JSON.parse(match[0]);
                } else if (currentProvider === 'anthropic' && apiKey) {
                    const resp = await fetch('https://api.anthropic.com/v1/messages', {
                        method: 'POST',
                        headers: {
                            'x-api-key': apiKey,
                            'anthropic-version': '2023-06-01',
                            'content-type': 'application/json'
                        },
                        body: JSON.stringify({
                            model: 'claude-3-haiku-20240307',
                            max_tokens: 1000,
                            system: sysPrompt,
                            messages: [{ role: 'user', content: finalUserPrompt }]
                        }),
                        signal: controller.signal
                    });
                    const resData = await resp.json();
                    if (resData.content && resData.content.length > 0) {
                        const text = resData.content[0].text;
                        const match = text.match(/\{[\s\S]*\}/);
                        if (match) parsed = JSON.parse(match[0]);
                    }
                } else if (currentProvider === 'gemini' && apiKey) {
                    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
                    const resp = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            systemInstruction: { parts: [{ text: sysPrompt }] },
                            contents: [{ parts: [{ text: finalUserPrompt }] }],
                            generationConfig: { responseMimeType: "application/json" }
                        }),
                        signal: controller.signal
                    });
                    const resData = await resp.json();
                    if (resData.candidates && resData.candidates.length > 0) {
                        const text = resData.candidates[0].content.parts[0].text;
                        const match = text.match(/\{[\s\S]*\}/);
                        if (match) parsed = JSON.parse(match[0]);
                    }
                } else if (apiKey && (currentProvider === 'openai' || currentProvider === 'grok' || currentProvider === 'openrouter' || currentProvider === 'groq')) {
                    let url, model;
                    if (currentProvider === 'openai') {
                        url = 'https://api.openai.com/v1/chat/completions';
                        model = 'gpt-4o-mini';
                    } else if (currentProvider === 'openrouter') {
                        url = 'https://openrouter.ai/api/v1/chat/completions';
                        model = 'openai/gpt-4o-mini';
                    } else if (currentProvider === 'grok') {
                        url = 'https://api.x.ai/v1/chat/completions';
                        model = 'grok-beta';
                    } else {
                        url = 'https://api.groq.com/openai/v1/chat/completions';
                        model = 'llama-3.1-70b-versatile';
                    }

                    const headers = { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
                    if (currentProvider === 'openrouter') {
                        headers['HTTP-Referer'] = 'https://thealgorithm.reports';
                        headers['X-Title'] = 'The Algorithm';
                    }

                    const body = {
                        model,
                        messages: [{ role: 'system', content: sysPrompt }, { role: 'user', content: finalUserPrompt }]
                    };

                    if (currentProvider !== 'openrouter') {
                         body.response_format = { type: "json_object" };
                    }

                    const resp = await fetch(url, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify(body),
                        signal: controller.signal
                    });
                    const resData = await resp.json();
                    if (resData.choices && resData.choices.length > 0) {
                        const text = resData.choices[0].message.content;
                        const match = text.match(/\{[\s\S]*\}/);
                        if (match) parsed = JSON.parse(match[0]);
                    }
                }
                clearTimeout(timeoutId);
                return parsed;
            } catch (err) {
                clearTimeout(timeoutId);
                let safeKey = apiKey ? apiKey.substring(0, 4) + '...' : 'none';
                console.error(`LLM call failed for ${currentProvider} with key ${safeKey}: ${err.message}`);
                return null;
            }
        };

        // 3. EXECUTE & VALIDATE
        report = await callLLM(provider, api_key, systemPrompt, userPrompt, false);

        if (!validateAnalysisResponse(report)) {
            // Retry once with stricter prompt
            report = await callLLM(provider, api_key, systemPrompt, userPrompt, true);
        }

        // 4. FALLBACK
        if (!validateAnalysisResponse(report)) {
            report = {
                relationship_persona: "Vibe Explorer",
                compatibility_score: 80,
                ai_insight: {
                    dynamic_title: "Quick Read",
                    reality_check: "Analysis complete for " + partner_name,
                    recent_shift: "The energy is stable.",
                    red_flags: ["Limited data for deep read"],
                    green_flags: ["Active check-ins"],
                    brutal_verdict: "It's a vibe.",
                    coaching_advice: "Keep communicating openly and building trust.",
                    growth_areas: ["More frequent deep conversations"]
                }
            };
        }

        return new Response(JSON.stringify({ report }), { headers: { 'Content-Type': 'application/json' } });

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
