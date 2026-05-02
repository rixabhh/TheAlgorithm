import { makeLLMCall } from './llm_helper.js';

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

        // Define standard keys we need back
        const requiredKeys = ["relationship_persona", "compatibility_score", "ai_insight", "overall_health_score", "communication_style", "attachment_style", "humor_dynamics", "silence_breaking", "key_insights", "strengths", "growth_areas", "coaching_advice", "fun_fact"];

        const baseSystemPrompt = `You are 'The Algorithm', an expert relationship analyst and communication coach. You act like a brilliant friend who happens to be a therapist - warm, insightful, empathetic, but brutally honest.
CRITICAL RULES:
1. Return ONLY a valid JSON object. Do NOT wrap in markdown code blocks.
2. The JSON keys MUST remain exactly as follows (in English):
{
  "relationship_persona": "string",
  "compatibility_score": 0,
  "overall_health_score": 0,
  "communication_style": {
    "dominant_pattern": "string",
    "tone": "string",
    "balance_score": 0
  },
  "attachment_style": {
    "person_1": "secure|anxious|avoidant|disorganized",
    "person_2": "secure|anxious|avoidant|disorganized",
    "compatibility_note": "string"
  },
  "humor_dynamics": {
    "fun_person": "string",
    "laughter_balance": "string"
  },
  "silence_breaking": {
    "ice_breaker": "string",
    "insight": "string"
  },
  "key_insights": ["string", "string", "string"],
  "strengths": ["string"],
  "growth_areas": ["string"],
  "coaching_advice": "string (2-3 actionable sentences)",
  "fun_fact": "string (one interesting or surprising observation)",
  "ai_insight": {
    "dynamic_title": "string",
    "reality_check": "string",
    "recent_shift": "string",
    "red_flags": ["string"],
    "green_flags": ["string"],
    "brutal_verdict": "string"
  }
}
3. The VALUES inside the JSON MUST be written in the requested Output Language (${language || 'english'}). If Hinglish is requested, use conversational Hindi written in the English alphabet (e.g., 'Bhai kya kar raha hai'). Make it gen-z, witty, and brutal.`;

        const PROVIDER_SYSTEM_PROMPTS = {
            "anthropic": `<role>\n${baseSystemPrompt}\n</role>`,
            "default": baseSystemPrompt
        };
        const systemPrompt = PROVIDER_SYSTEM_PROMPTS[provider] || PROVIDER_SYSTEM_PROMPTS["default"];
        
        let userPrompt = `Analyze these anonymous conversation statistics and provide deep behavioral insights.
## Relationship Context
- People: ${my_name} & ${partner_name}
- Connection Type: ${connection_type || 'romantic'}
- Output Language: ${language || 'english'}
- Tone: ${tone}
`;
        if (context) userPrompt += `- User Context/Background: ${context}\n`;
        userPrompt += `\n## Statistics\n${JSON.stringify(stats)}`;
        
        if (compare_data) {
            userPrompt = `COMPARE two anonymous chat statistics for ${my_name}.
## Relationship Context
- Chat A: ${compare_data.nameA} vs Chat B: ${compare_data.nameB}
- Output Language: ${language || 'english'}
- Tone: ${tone}

## Statistics
- Stats A: ${JSON.stringify(compare_data.a)}
- Stats B: ${JSON.stringify(compare_data.b)}
`;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30-second timeout max

        try {
            let rawResponseText = await makeLLMCall(provider, api_key, systemPrompt, userPrompt, env, controller.signal);

            clearTimeout(timeoutId);

            const parseResponse = (text) => {
                const match = text.match(/\{[\s\S]*\}/);
                if (match) {
                    try {
                        const parsed = JSON.parse(match[0]);
                        const isValid = requiredKeys.every(k => Object.hasOwn(parsed, k));
                        if (isValid || Object.hasOwn(parsed, 'compatibility_score')) {
                            return parsed;
                        }
                    } catch (e) {
                        return null;
                    }
                }
                return null;
            };

            if (rawResponseText) {
                report = parseResponse(rawResponseText);

                // Fallback / Retry Logic
                if (!report && api_key && provider !== 'cloudflare') {
                    // Try one more time with a stricter prompt if parsing failed
                    const stricterUserPrompt = userPrompt + "\n\nWARNING: Your previous response failed validation. You MUST return ONLY a valid JSON object matching the requested schema. No conversational text.";
                    const retryController = new AbortController();
                    const retryTimeoutId = setTimeout(() => retryController.abort(), 30000);
                    try {
                        const retryResponseText = await makeLLMCall(provider, api_key, systemPrompt, stricterUserPrompt, env, retryController.signal);
                        report = parseResponse(retryResponseText);
                    } catch (retryErr) {
                        console.error("Retry failed:", retryErr);
                    } finally {
                        clearTimeout(retryTimeoutId);
                    }
                }

                if (!report) {
                    throw new Error("Invalid schema from LLM or parsing failed.");
                }
            }
        } catch (callError) {
            clearTimeout(timeoutId);
            // Catch timeouts or parsing errors specifically if needed
            if (callError.name === 'AbortError') {
                throw new Error("Analysis timed out. Please try again.");
            }
            throw callError;
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
        let errorMsg = e.message || "Analysis failed. Check your API key and try again.";
        // Mask any API keys that might have leaked in the error message
        errorMsg = errorMsg.replace(/sk-[a-zA-Z0-9_-]+/g, 'sk-...');
        return new Response(JSON.stringify({ error: errorMsg }), { status: 500 });
    }
}

