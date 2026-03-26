const fs = require('fs');
const path = 'd:/PROJECTS/TheAlgorithm/static/js/dashboard.js';
const code = `document.addEventListener('DOMContentLoaded', () => {
    console.log("Dashboard Initializing (V6.0)...");
    
    // 1. DATA LOADING
    const stored = sessionStorage.getItem('dashboard_data');
    if (!stored) {
        console.warn("No analysis data found in sessionStorage.");
        return;
    }
    
    let dashboardData;
    try {
        dashboardData = JSON.parse(stored);
    } catch (e) {
        console.error("Failed to parse dashboard data:", e);
        return;
    }
    
    // Populate window variables for utility compatibility
    window.algorithmData = dashboardData.stats?.weekly_data || [];
    window.llmReport = dashboardData.report || {};
    window.highlights = dashboardData.highlights || [];
    window.flashbacks = dashboardData.flashbacks || {};
    window.connectionType = dashboardData.connection_type || 'romantic';

    const data = Array.isArray(window.algorithmData) ? window.algorithmData : [];
    const report = window.llmReport;
    const stats = dashboardData.stats || {};
    const emojiFreq = stats.emoji_frequency || {};
    const initiatorRatio = stats.initiator_ratio || {};
    const powerDynamics = stats.power_dynamics || {};
    const affectionFriction = stats.affection_friction || {};
    const supportGap = stats.support_gap || {};
    const mirroring = stats.mirroring || {};
    const topicMix = stats.topic_mix || {};

    // --- UI POPULATION ---

    // Narrative Elements
    const hHeadline = document.getElementById('report-headline');
    const hPulse = document.getElementById('report-pulse');
    const hPersona = document.getElementById('report-persona');
    
    if (hHeadline) hHeadline.textContent = report.dynamic_headline || "Your Relationship Pulse";
    if (hPulse) hPulse.textContent = report.pulse_summary || "Analyzing your digital footprint...";
    if (hPersona) hPersona.textContent = report.relationship_persona || "The Balanced Duo";

    // Compatibility Animation
    const compScore = parseInt(report.compatibility_score) || 85;
    animateValue('report-compatibility', 0, compScore, 1500);

    // Support Score
    const meSupport = supportGap['ME'] || { stress_count: 0, support_received: 0 };
    const pSupport = supportGap['PARTNER'] || { stress_count: 0, support_received: 0 };
    const totalStress = (meSupport.stress_count || 0) + (pSupport.stress_count || 0);
    const totalSupport = (meSupport.support_received || 0) + (pSupport.support_received || 0);
    const supportScoreVal = totalStress > 0 ? Math.round((totalSupport / totalStress) * 100) : null;

    if (supportScoreVal !== null && document.getElementById('support-score')) {
        animateValue('support-score', 0, supportScoreVal, 1500, '%');
    }

    // Mirroring & Topic
    const mirroringVal = (mirroring['ME_mirroring'] || 0) + (mirroring['PARTNER_mirroring'] || 0);
    const mirEl = document.getElementById('mirroring-value');
    if (mirEl) mirEl.textContent = mirroringVal > 0 ? mirroringVal + ' Level' : 'Stable';

    const sortedTopics = Object.entries(topicMix).sort((a, b) => b[1] - a[1]);
    const topicEl = document.getElementById('core-topic');
    if (topicEl) topicEl.textContent = sortedTopics.length > 0 ? sortedTopics[0][0] : 'Chatting';

    // --- Stats Logic ---
    const totalMsgs = data.reduce((sum, w) => sum + (w.me_count || 0) + (w.partner_count || 0), 0);
    const totalMsgsEl = document.getElementById('stat-total-msgs');
    if (totalMsgsEl) totalMsgsEl.textContent = totalMsgs.toLocaleString();

    const meTotal = data.reduce((sum, w) => sum + (w.me_count || 0), 0);
    const mePct = totalMsgs > 0 ? Math.round((meTotal / totalMsgs) * 100) : 50;
    const mePctEl = document.getElementById('stat-me-pct');
    if (mePctEl) mePctEl.textContent = mePct + '%';

    const latencies = data.map(w => w.avg_latency_seconds).filter(l => l && l > 0);
    const avgLatency = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
    const avgLatencyEl = document.getElementById('stat-avg-latency');
    if (avgLatencyEl) {
        if (avgLatency > 3600) avgLatencyEl.textContent = Math.round(avgLatency / 3600) + 'h';
        else if (avgLatency > 60) avgLatencyEl.textContent = Math.round(avgLatency / 60) + 'm';
        else if (avgLatency > 0) avgLatencyEl.textContent = Math.round(avgLatency) + 's';
        else avgLatencyEl.textContent = '--';
    }

    // --- Chart Insights (Text Injection) ---
    const insights = report.chart_insights || {};
    const insightMap = {
        'insight-stability': insights.stability,
        'insight-volume': insights.volume,
        'insight-latency': insights.latency,
        'insight-emoji': insights.emoji,
        'insight-initiator': insights.initiator,
        'insight-power': insights.power,
        'insight-affection': insights.affection
    };

    Object.entries(insightMap).forEach(([id, text]) => {
        const el = document.getElementById(id);
        if (el && text) el.textContent = text;
    });

    // --- Deep Dive Interactivity ---
    const deepDiveDetails = document.getElementById('deep-dive-details');
    if (deepDiveDetails) {
        deepDiveDetails.addEventListener('toggle', () => {
            if (deepDiveDetails.open) {
                // Initiator
                animateValue('meInitCount', 0, initiatorRatio.me_initiations || 0, 1000);
                animateValue('partnerInitCount', 0, initiatorRatio.partner_initiations || 0, 1000);
                
                const totalInit = (initiatorRatio.me_initiations || 0) + (initiatorRatio.partner_initiations || 0);
                if (totalInit > 0) {
                    document.getElementById('meInitiatorBar').style.width = \`\${((initiatorRatio.me_initiations || 0) / totalInit) * 100}%\`;
                    document.getElementById('partnerInitiatorBar').style.width = \`\${((initiatorRatio.partner_initiations || 0) / totalInit) * 100}%\`;
                }

                // Power Dynamics
                const ratioVal = powerDynamics.power_ratio || 1.0;
                animateValue('powerRatioValue', 0, ratioVal, 1000, 'x', 1);

                // Affection
                const affCount = affectionFriction.affirmative_count || 0;
                const disCount = affectionFriction.dismissive_count || 0;
                animateValue('affCount', 0, affCount, 1000);
                animateValue('disCount', 0, disCount, 1000);
                const totalAf = affCount + disCount;
                if (totalAf > 0) {
                    document.getElementById('affBar').style.width = \`\${(affCount / totalAf) * 100}%\`;
                    document.getElementById('disBar').style.width = \`\${(disCount / totalAf) * 100}%\`;
                }
            }
        }, { once: true });
    }

    // --- Copy Functionality ---
    const formatReportSummary = (rep) => {
        let text = \"📊 THE ALGORITHM: RELATIONSHIP WRAPPED\\n\";
        text += \"✨ Headline: \" + (rep.dynamic_headline || \"Analysis Complete\") + \"\\n\";
        text += \"🧬 Persona: \" + (rep.relationship_persona || \"The Duo\") + \"\\n\";
        text += \"📈 Compatibility: \" + (rep.compatibility_score || \"--\") + \"/100\\n\\n\";
        text += \"💡 Pulse: \" + (rep.pulse_summary || \"\") + \"\\n\\n\";
        if (rep.repair_tips && rep.repair_tips.length) {
            text += \"🛠 Repair Tips:\\n\" + rep.repair_tips.map(t => \"• \" + t).join('\\n') + \"\\n\\n\";
        }
        text += \"🔗 Generated locally via the-algorithm.pages.dev\";
        return text;
    };

    const copySummaryBtn = document.getElementById('copySummaryBtn');
    if (copySummaryBtn) {
        copySummaryBtn.addEventListener('click', () => {
            const summary = formatReportSummary(report);
            navigator.clipboard.writeText(summary).then(() => showToast('Summary copied!', 'success'));
        });
    }

    const copySnippetBtn = document.getElementById('copySnippetBtn');
    if (copySnippetBtn) {
        const snippetText = report.top_shareable_snippet;
        if (snippetText) {
            document.getElementById('report-snippet').textContent = '\"' + snippetText + '\"';
            document.getElementById('report-snippet-container').classList.remove('hidden');
            copySnippetBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(snippetText).then(() => showToast('Snippet copied!', 'success'));
            });
        }
    }

    // --- Insights Cards Popup ---
    setTimeout(initHighlights, 1000);
});

async function initHighlights() {
    console.log(\"Highlights initialized.\");
}
\`;

fs.writeFileSync(path, code);
console.log('Fixed dashboard.js completely via Node');
