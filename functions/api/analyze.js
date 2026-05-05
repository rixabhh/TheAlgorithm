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

        const makeFallbackReport = (reason = "Limited data for deep read") => ({
            relationship_persona: "Vibe Explorer",
            compatibility_score: 80,
            overall_health_score: stats?.symmetry?.score || 75,
            communication_style: {
                dominant_pattern: stats?.symmetry?.label || "Balanced",
                tone: "Data-led",
                balance_score: stats?.symmetry?.score || 75
            },
            attachment_style: {
                person_1: "secure",
                person_2: "secure",
                compatibility_note: stats?.attachment_style || "Not enough signal for a strong attachment read."
            },
            humor_dynamics: {
                fun_person: ((stats?.laughter?.ME || 0) >= (stats?.laughter?.PARTNER || 0)) ? my_name : partner_name,
                laughter_balance: `${stats?.laughter?.ME || 0} vs ${stats?.laughter?.PARTNER || 0} laughter signals`
            },
            silence_breaking: {
                ice_breaker: ((stats?.silence_breakers?.ME || 0) >= (stats?.silence_breakers?.PARTNER || 0)) ? my_name : partner_name,
                insight: "Long gaps are counted from local chat statistics only."
            },
            key_insights: [
                `${stats?.total_messages || ((stats?.messages?.ME || 0) + (stats?.messages?.PARTNER || 0))} messages analysed.`,
                `Conversation symmetry is ${stats?.symmetry?.label || 'balanced'}.`,
                `Detected style: ${stats?.attachment_style || 'not clear yet'}.`
            ],
            strengths: ["The chat has enough signal to read participation and response patterns."],
            growth_areas: [reason],
            coaching_advice: "Use this as a pattern map, not a verdict. Pick one repeated behavior and talk about that concrete pattern.",
            fun_fact: `Longest active streak: ${stats?.streaks?.longest || 0} days.`,
            ai_insight: {
                vibe_label: "VIBE STATUS",
                health_score: stats?.symmetry?.score || 75,
                dynamic_title: "Quick Read",
                reality_check: `Analysis complete for ${partner_name}. The strongest local signal is ${stats?.symmetry?.label || 'balanced'} participation.`,
                recent_shift: "Recent-shift analysis is based on the weekly timeline: volume, sentiment, and response patterns.",
                red_flags: [reason],
                green_flags: ["Active conversation patterns were detected"],
                brutal_verdict: "The data gives you a useful mirror, not a courtroom verdict."
            }
        });

        const normalizeReport = (candidate) => {
            const fallback = makeFallbackReport("AI response was incomplete, so this report was normalized from local statistics.");
            const report = { ...fallback, ...(candidate || {}) };
            report.communication_style = { ...fallback.communication_style, ...(candidate?.communication_style || {}) };
            report.attachment_style = { ...fallback.attachment_style, ...(candidate?.attachment_style || {}) };
            report.humor_dynamics = { ...fallback.humor_dynamics, ...(candidate?.humor_dynamics || {}) };
            report.silence_breaking = { ...fallback.silence_breaking, ...(candidate?.silence_breaking || {}) };
            report.ai_insight = { ...fallback.ai_insight, ...(candidate?.ai_insight || {}) };
            report.key_insights = Array.isArray(candidate?.key_insights) ? candidate.key_insights : fallback.key_insights;
            report.strengths = Array.isArray(candidate?.strengths) ? candidate.strengths : fallback.strengths;
            report.growth_areas = Array.isArray(candidate?.growth_areas) ? candidate.growth_areas : fallback.growth_areas;
            report.compatibility_score = Number(report.compatibility_score) || fallback.compatibility_score;
            report.overall_health_score = Number(report.overall_health_score) || Number(report.ai_insight.health_score) || fallback.overall_health_score;
            report.ai_insight.health_score = Number(report.ai_insight.health_score) || report.overall_health_score;
            return report;
        };

        // 2. AI GENERATION
        let report = null;

        // Define standard keys we need back
        const requiredKeys = ["relationship_persona", "compatibility_score", "ai_insight", "overall_health_score", "communication_style", "attachment_style", "humor_dynamics", "silence_breaking", "key_insights", "strengths", "growth_areas", "coaching_advice", "fun_fact"];

        const baseSystemPrompt = `You are 'The Algorithm', an expert relationship analyst and communication coach for new-age, social-native users. You act like a brilliant friend who happens to be a therapist: warm, insightful, empathetic, funny, and brutally honest without being cruel.
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
3. The VALUES inside the JSON MUST be written in the requested Output Language (${language || 'english'}). If Hinglish is requested, use conversational Hindi written in the English alphabet (e.g., 'Bhai kya kar raha hai').
4. Style: make it social-media friendly and Gen Z without sounding fake. Use punchy lines, meme-aware phrasing, and clear emotional truth. Avoid clinical jargon unless you explain it simply.
5. The ai_insight.dynamic_title must be short enough for a story card: 2-5 words.
6. Red and green flags should be specific behavioral signals from the statistics, not generic relationship advice.`;

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
                            return normalizeReport(parsed);
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

        report = normalizeReport(report);

        return new Response(JSON.stringify({ report }), { headers: { 'Content-Type': 'application/json' } });

    } catch (e) {
        let errorMsg = e.message || "Analysis failed. Check your API key and try again.";
        // Mask any API keys that might have leaked in the error message
        errorMsg = errorMsg.replace(/sk-[a-zA-Z0-9_-]+/g, 'sk-...');
        return new Response(JSON.stringify({ error: errorMsg }), { status: 500 });
    }
}

