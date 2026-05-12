import { makeLLMCall } from './llm_helper.js';

export async function onRequestPost(context) {
    const { request, env } = context;
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';

    try {
        const data = await request.json();
        const { stats, my_name, partner_name, connection_type, language, context, compare_data, provider = 'cloudflare', api_key = '', evidence_pack = null, source_quality = null, privacy_mode = 'stats_only', raw_excerpt_pack = null } = data;
        const tone = data.tone || 'balanced';

        if (raw_excerpt_pack && privacy_mode !== 'opt_in_raw') {
            return new Response(JSON.stringify({ error: "Raw excerpts require opt-in raw evidence mode." }), { status: 400 });
        }

        const clampHeuristic = (value, fallback = 70) => {
            const num = Number(value);
            const base = Number.isFinite(num) ? num : fallback;
            return Math.max(5, Math.min(95, Math.round(base)));
        };
        const symmetryScore = clampHeuristic(stats?.symmetry?.score, 70);
        const sourceScore = clampHeuristic(source_quality?.score || evidence_pack?.predictive_outlook?.confidence, 60);

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

        const makeFallbackReport = (reason = "Limited data for deep read") => {
            const dropOffRisk = clampHeuristic(evidence_pack?.predictive_outlook?.drop_off_risk ?? (100 - symmetryScore), 30);
            const stability = clampHeuristic(evidence_pack?.predictive_outlook?.stability ?? (100 - dropOffRisk), 65);
            const healthScore = clampHeuristic((symmetryScore * 0.75) + (sourceScore * 0.25), 75);
            const topReceipt = evidence_pack?.receipts?.[0];
            const nextAction = evidence_pack?.predictive_outlook?.next_action || topReceipt?.action || "Pick the strongest repeated pattern and ask for one concrete change.";
            return ({
            relationship_persona: topReceipt?.pattern ? `${topReceipt.pattern.replace(/_/g, ' ')} watcher` : "Pattern Watch",
            compatibility_score: clampHeuristic((symmetryScore * 0.7) + (sourceScore * 0.3), 75),
            overall_health_score: healthScore,
            communication_style: {
                dominant_pattern: stats?.symmetry?.label || "Balanced",
                tone: "Data-led",
                balance_score: symmetryScore
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
            coaching_advice: `${nextAction} Treat this as a pattern map, not a final verdict. Re-check whether the pattern changes after the next real conversation.`,
            fun_fact: `Longest active streak: ${stats?.streaks?.longest || 0} days.`,
            verdict_summary: {
                headline: topReceipt?.claim || "Pattern read complete",
                risk_level: dropOffRisk >= 65 ? "high" : "medium",
                confidence: `${sourceScore >= 95 ? '95+' : sourceScore}%`,
                best_next_move: nextAction
            },
            receipts: evidence_pack?.receipts || [{
                claim: "Local stats are readable",
                evidence: "The browser generated enough aggregate signal for a first-pass report.",
                pattern: "stats_only",
                confidence: "medium",
                action: "Use this as a starting point, then compare against the actual relationship context."
            }],
            predictive_outlook: evidence_pack?.predictive_outlook || {
                stability,
                reciprocity_trend: stats?.symmetry?.label || "balanced",
                repair_likelihood: "unclear",
                drop_off_risk: dropOffRisk,
                conflict_recurrence_risk: "normal",
                confidence: sourceScore,
                next_action: nextAction
            },
            ai_insight: {
                vibe_label: "VIBE STATUS",
                health_score: healthScore,
                dynamic_title: topReceipt?.claim ? topReceipt.claim.split(' ').slice(0, 4).join(' ') : "Pattern Watch",
                reality_check: topReceipt?.evidence || `The strongest local signal is ${stats?.symmetry?.label || 'balanced'} participation.`,
                recent_shift: evidence_pack?.predictive_outlook?.trend ? `Recent trend appears ${evidence_pack.predictive_outlook.trend}.` : "Recent shift is based on volume, sentiment, and response patterns.",
                red_flags: [reason],
                green_flags: topReceipt?.confidence ? [`Top receipt confidence is ${topReceipt.confidence}.`] : ["Active conversation patterns were detected."],
                brutal_verdict: topReceipt?.action || "The data gives you a useful mirror, not a courtroom verdict."
            }
        });
        };

        const normalizeReport = (candidate) => {
            const fallback = makeFallbackReport("AI response was incomplete, so this report was normalized from local statistics.");
            const report = { ...fallback, ...(candidate || {}) };
            report.communication_style = { ...fallback.communication_style, ...(candidate?.communication_style || {}) };
            report.attachment_style = { ...fallback.attachment_style, ...(candidate?.attachment_style || {}) };
            report.humor_dynamics = { ...fallback.humor_dynamics, ...(candidate?.humor_dynamics || {}) };
            report.silence_breaking = { ...fallback.silence_breaking, ...(candidate?.silence_breaking || {}) };
            report.ai_insight = { ...fallback.ai_insight, ...(candidate?.ai_insight || {}) };
            report.verdict_summary = { ...fallback.verdict_summary, ...(candidate?.verdict_summary || {}) };
            report.predictive_outlook = { ...fallback.predictive_outlook, ...(candidate?.predictive_outlook || {}) };
            report.key_insights = Array.isArray(candidate?.key_insights) ? candidate.key_insights : fallback.key_insights;
            report.strengths = Array.isArray(candidate?.strengths) ? candidate.strengths : fallback.strengths;
            report.growth_areas = Array.isArray(candidate?.growth_areas) ? candidate.growth_areas : fallback.growth_areas;
            report.receipts = Array.isArray(candidate?.receipts) && candidate.receipts.length ? candidate.receipts : fallback.receipts;
            report.compatibility_score = clampHeuristic(report.compatibility_score, fallback.compatibility_score);
            report.overall_health_score = clampHeuristic(report.overall_health_score || report.ai_insight.health_score, fallback.overall_health_score);
            report.ai_insight.health_score = clampHeuristic(report.ai_insight.health_score || report.overall_health_score, report.overall_health_score);
            report.communication_style.balance_score = clampHeuristic(report.communication_style.balance_score, fallback.communication_style.balance_score);
            report.predictive_outlook.stability = clampHeuristic(report.predictive_outlook.stability, fallback.predictive_outlook.stability);
            report.predictive_outlook.drop_off_risk = clampHeuristic(report.predictive_outlook.drop_off_risk, fallback.predictive_outlook.drop_off_risk);
            report.predictive_outlook.confidence = clampHeuristic(report.predictive_outlook.confidence, fallback.predictive_outlook.confidence);
            if (typeof report.verdict_summary.confidence === 'string') {
                report.verdict_summary.confidence = report.verdict_summary.confidence.replace(/\b100%/g, '95+%');
            }
            return report;
        };

        // 2. AI GENERATION
        let report = null;

        // Define standard keys we need back
        const requiredKeys = ["relationship_persona", "compatibility_score", "ai_insight", "overall_health_score", "communication_style", "attachment_style", "humor_dynamics", "silence_breaking", "key_insights", "strengths", "growth_areas", "coaching_advice", "fun_fact", "verdict_summary", "receipts", "predictive_outlook"];

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
  "verdict_summary": {
    "headline": "string",
    "risk_level": "low|medium|high",
    "confidence": "string",
    "best_next_move": "string"
  },
  "receipts": [
    {
      "claim": "string",
      "evidence": "string",
      "pattern": "string",
      "confidence": "low|medium|high",
      "action": "string"
    }
  ],
  "predictive_outlook": {
    "stability": 0,
    "reciprocity_trend": "string",
    "repair_likelihood": "string",
    "drop_off_risk": 0,
    "conflict_recurrence_risk": "string",
    "confidence": 0,
    "next_action": "string"
  },
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
4. Style: premium social-native, not generic therapy copy. Use punchy, specific observations that sound like a sharp friend with data, not a horoscope.
5. Every serious claim must point to a concrete signal from Statistics, Source Quality, Local Evidence Pack, or Opt-In Raw Evidence Excerpts.
6. Fill the report hierarchy intentionally:
   - verdict_summary is the above-the-fold executive read: one sharp headline, risk, confidence, and best next move.
   - receipts are the proof cards: each claim needs evidence, pattern, confidence, and a useful action.
   - predictive_outlook is the forward-looking panel: scores are risk estimates, not certainty.
   - ai_insight is the story-card/readout layer: memorable title, reality check, shift, flags, and final verdict.
7. Avoid filler like "communication is key", "work on trust", "keep talking", or generic attachment advice unless tied to an observed pattern.
8. The ai_insight.dynamic_title must be short enough for a story card: 2-5 words.
9. Red and green flags should be specific behavioral signals from the statistics, not generic relationship advice.
10. Predictions must include confidence and should never claim certainty. Avoid diagnosis language. Use evidence-based wording like "suggests", "appears", or "risk".
11. Explicitly factor in rhythm metrics (e.g., peak hours, double texting, and apologies) from the Statistics when formulating insights. Use them to infer behavioral patterns around responsiveness and accountability.`;

        const PROVIDER_SYSTEM_PROMPTS = {
            "anthropic": `<role>\n${baseSystemPrompt}\n</role>`,
            "default": baseSystemPrompt
        };
        const systemPrompt = PROVIDER_SYSTEM_PROMPTS[provider] || PROVIDER_SYSTEM_PROMPTS["default"];
        
        let userPrompt = `Analyze these anonymous conversation statistics and provide deep behavioral insights that can be placed directly into a dashboard.
## Relationship Context
- People: ${my_name} & ${partner_name}
- Connection Type: ${connection_type || 'romantic'}
- Output Language: ${language || 'english'}
- Tone: ${tone}
`;
        if (context) userPrompt += `- User Context/Background: ${context}\n`;
        userPrompt += `\n## Output Quality Bar
- Make the verdict feel useful in 5 seconds.
- Write 3-6 receipts when evidence exists; avoid generic claims.
- Use source_quality to lower confidence when the sample is weak.
- Do not return exact 100% confidence or certainty language.
- Keep actions concrete: what to say, what to watch, or what boundary to test next.
`;
        userPrompt += `\n## Statistics\n${JSON.stringify(stats)}`;
        if (source_quality) userPrompt += `\n\n## Source Quality\n${JSON.stringify(source_quality)}`;
        if (evidence_pack) userPrompt += `\n\n## Local Evidence Pack\n${JSON.stringify(evidence_pack)}`;
        if (raw_excerpt_pack && privacy_mode === 'opt_in_raw') {
            userPrompt += `\n\n## Opt-In Raw Evidence Excerpts\nThe user explicitly enabled raw evidence mode. Use only these short scrubbed excerpts as supporting evidence; do not quote more than needed.\n${JSON.stringify(raw_excerpt_pack)}`;
        }
        
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
            if (evidence_pack) userPrompt += `\n## Local Evidence Pack\n${JSON.stringify(evidence_pack)}`;
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

