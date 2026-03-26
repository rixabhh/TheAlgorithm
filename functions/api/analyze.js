export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const data = await request.json();
        const { stats, my_name, partner_name, connection_type, tone = 'balanced', context: userContext = '' } = data;

        const powerRatio = stats.power_dynamics?.power_ratio || 1.0;
        const meRatio = stats.initiator_ratio?.me_ratio || 0.5;
        const mirror = stats.mirroring || 0;
        const suppScore = stats.support_score || 0;
        const topTopic = stats.topic_mix?.top_topic || "Random Talk";
        const totalMsgs = stats.weekly_data?.reduce((sum, w) => sum + (w.me_count || 0) + (w.partner_count || 0), 0) || 0;

        const simulatedReport = {
            dynamic_headline: totalMsgs > 1000 ? "The Heavyweights: A Massive Digital History" : "Modern Connection: Analysis Complete",
            pulse_summary: "Your interactions show a " + (powerRatio > 1.2 ? 'high-energy' : 'stable') + " pulse with a " + (meRatio > 0.6 ? 'proactive' : 'balanced') + " communication style.",
            relationship_persona: powerRatio > 1.5 ? "The Driver & The Co-Pilot" : (powerRatio < 0.7 ? "The Listener & The Talker" : "The Balanced Duo"),
            persona_summary: "Your communication patterns show a " + (powerRatio > 1.1 ? "strong dynamic where one person leads the flow," : "balanced harmony where both voices carry equal weight,") + " creating a unique digital fingerprint of your connection.",
            compatibility_score: Math.round(75 + (Math.random() * 20)),
            mirroring_score: mirror,
            support_score: suppScore,
            main_topic: topTopic,
            repair_tips: [
                "Aim for more balanced message lengths.",
                "Try to reduce response latency during peak hours.",
                "Maintain the healthy " + mirror + "% linguistic mirroring."
            ],
            milestones: [
                "Consistent daily check-ins.",
                "Linguistic mirroring at " + mirror + "%.",
                "High emotional sync."
            ],
            top_shareable_snippet: "Our digital connection is a " + (Math.round(80 + Math.random()*15)) + "/100 vibe.",
            predictive_path: "Continued growth and stability.",
            time_machine_insights: "Your early days were much more rapid-fire.",
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
