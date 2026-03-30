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

        // 2. AI GENERATION
        let report = null;
        const systemPrompt = "You are 'The Algorithm', a brutally honest relationship analyst. Return ONLY a JSON object: { relationship_persona, compatibility_score, ai_insight: { dynamic_title, reality_check, recent_shift, red_flags: [], green_flags: [], brutal_verdict } }.";
        
        let userPrompt = `Analyze chat: ${my_name} & ${partner_name}. Tone: ${tone}. Stats: ${JSON.stringify(stats)}.`;
        if (compare_data) {
            userPrompt = `COMPARE two chats for ${my_name}. Chat A: ${compare_data.nameA} vs Chat B: ${compare_data.nameB}. Stats A: ${JSON.stringify(compare_data.a)}. Stats B: ${JSON.stringify(compare_data.b)}. Be direct.`;
        }

        if (provider === 'cloudflare' && env.AI) {
            const aiResult = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
                messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }]
            });
            const match = aiResult.response.match(/\{[\s\S]*\}/);
            if (match) report = JSON.parse(match[0]);
        } else if (api_key && (provider === 'openai' || provider === 'groq' || provider === 'openrouter')) {
            const url = provider === 'openai' ? 'https://api.openai.com/v1/chat/completions' :
                        provider === 'groq' ? 'https://api.groq.com/openai/v1/chat/completions' :
                        'https://openrouter.ai/api/v1/chat/completions';
            const model = provider === 'openai' ? 'gpt-4o-mini' :
                          provider === 'groq' ? 'llama-3.1-70b-versatile' :
                          'meta-llama/llama-3.1-8b-instruct:free';
            const headers = { 'Authorization': `Bearer ${api_key}`, 'Content-Type': 'application/json' };
            if (provider === 'openrouter') {
                headers['HTTP-Referer'] = 'https://the-algorithm.pages.dev';
                headers['X-Title'] = 'TheAlgorithm';
            }
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
            try {
                const resp = await fetch(url, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify({ model, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], response_format: { type: "json_object" } }),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                const resData = await resp.json();
                if (resData.choices && resData.choices.length > 0) {
                     const content = resData.choices[0].message.content;
                     const match = content.match(/\{[\s\S]*\}/);
                     if (match) report = JSON.parse(match[0]);
                     else report = JSON.parse(content);
                }
            } catch (fetchError) {
                clearTimeout(timeoutId);
                console.error("Fetch error:", fetchError);
                throw new Error("API request failed or timed out. Please try again.");
            }
        }

        // 3. FALLBACK
        if (!report) {
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

        return new Response(JSON.stringify({ report }), { headers: { 'Content-Type': 'application/json' } });

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}

