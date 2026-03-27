export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const data = await request.json();
        const { stats, my_name, partner_name, connection_type, tone = 'balanced', context: userContext = '' } = data;

        const powerRatio = stats.power_dynamics?.power_ratio || 1.0;
        const meRatio = stats.initiator_ratio?.me_ratio || 0.5;
        const mirror = stats.mirroring || 0;
        const suppScore = stats.support_score || 0;
        const topTopic = stats.topic_mix?.top_topic || "Life Talk";
        const attachment = stats.attachment_style || "Securely Connected";
        const topWords = stats.top_words || [];
        const totalMsgs = stats.weekly_data?.reduce((sum, w) => sum + (w.me_count || 0) + (w.partner_count || 0), 0) || 0;

        const simulatedReport = {
            dynamic_headline: totalMsgs > 2000 ? "The Heavyweights: A Digital Dynasty" : "Your Vibe: Analysis Complete",
            pulse_summary: "Your interactions show a " + (powerRatio > 1.2 ? 'high-energy' : 'stable') + " pulse with a " + (meRatio > 0.6 ? 'proactive' : 'balanced') + " communication style.",
            relationship_persona: powerRatio > 1.5 ? "The Driver & The Co-Pilot" : (powerRatio < 0.7 ? "The Listener & The Talker" : "The Balanced Duo"),
            persona_summary: "Your communication patterns show a " + (powerRatio > 1.1 ? "dynamic where one person leads the flow," : "harmony where both voices carry equal weight,") + " creating a unique digital fingerprint of your connection.",
            attachment_style: attachment,
            compatibility_score: Math.round(78 + (Math.random() * 18)),
            mirroring_score: mirror,
            support_score: suppScore,
            main_topic: topTopic,
            top_words: topWords,
            repair_tips: [
                "Aim for more balanced message lengths.",
                "Maintain the healthy " + mirror + "% linguistic mirroring.",
                "Your " + attachment + " style thrives on consistent check-ins."
            ],
            milestones: [
                "Consistent daily check-ins detected.",
                "Linguistic mirroring at " + mirror + "%.",
                "Top words like '" + (topWords[0] || 'pyaar') + "' show deep connection."
            ],
            top_shareable_snippet: "Our digital connection is a " + (Math.round(85 + Math.random()*12)) + "/100 vibe.",
            predictive_path: "Continued growth and stability.",
            time_machine_insights: "Looking back, your communication has evolved into a " + attachment + " pattern.",
            chart_insights: {
                stability: "Rhythm is consistent across the period.",
                volume: "Word counts show a " + (powerRatio > 1.2 ? "noticeable lean." : "very even split."),
                latency: "Response times are within a healthy range.",
                emoji: "Expressive usage is active and " + (stats.emoji_frequency?.ME?.length > 0 ? "diverse." : "focused."),
                initiator: "Initiations are well-distributed.",
                power: "Currently leaning towards " + (powerRatio > 1.1 ? "leadership." : "stability."),
                affection: "Support Score is " + suppScore + "/100."
            }
        };

        return new Response(JSON.stringify({ report: simulatedReport }), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
