document.addEventListener('DOMContentLoaded', () => {
    console.log("Dashboard Initializing (V6.1 - Restoration)...");
    
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
    if (typeof animateValue === 'function') {
        animateValue('report-compatibility', 0, compScore, 1500);
    } else {
        const el = document.getElementById('report-compatibility');
        if (el) el.textContent = compScore;
    }

    // Support Score
    const meSupport = supportGap['ME'] || { stress_count: 0, support_received: 0 };
    const pSupport = supportGap['PARTNER'] || { stress_count: 0, support_received: 0 };
    const totalStress = (meSupport.stress_count || 0) + (pSupport.stress_count || 0);
    const totalSupport = (meSupport.support_received || 0) + (pSupport.support_received || 0);
    const supportScoreVal = totalStress > 0 ? Math.round((totalSupport / totalStress) * 100) : null;

    if (supportScoreVal !== null && document.getElementById('support-score')) {
        if (typeof animateValue === 'function') animateValue('support-score', 0, supportScoreVal, 1500, '%');
        else document.getElementById('support-score').textContent = supportScoreVal + '%';
    }

    // Mirroring & Topic
    const mirroringVal = (mirroring['ME_mirroring'] || 0) + (mirroring['PARTNER_mirroring'] || 0);
    const mirEl = document.getElementById('mirroring-value');
    if (mirEl) mirEl.textContent = mirroringVal > 0 ? (mirroringVal > 5 ? 'High' : 'Moderate') : 'Stable';

    const sortedTopics = Object.entries(topicMix).sort((a, b) => b[1] - a[1]);
    const topicEl = document.getElementById('core-topic');
    if (topicEl) topicEl.textContent = sortedTopics.length > 0 ? sortedTopics[0][0].charAt(0).toUpperCase() + sortedTopics[0][0].slice(1) : 'General';

    // --- Stats Cards ---
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

    // --- Emoji Lists ---
    const renderEmoji = (id, items) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (!items || !items.length) { el.innerHTML = '<p style="color:var(--gray-400);font-size:.8rem">No emojis found</p>'; return; }
        el.innerHTML = items.slice(0, 5).map(i => `
            <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.25rem">
                <span style="font-size:1.2rem">${i.emoji}</span>
                <div style="flex:1;height:8px;background:var(--cream);border-radius:4px;overflow:hidden;border:1px solid rgba(0,0,0,0.1)">
                    <div style="height:100%;background:var(--pink);width:${(i.count / items[0].count) * 100}%"></div>
                </div>
                <span style="font-size:.7rem;font-weight:700">${i.count}</span>
            </div>
        `).join('');
    };
    renderEmoji('emojiListMe', emojiFreq['ME']);
    renderEmoji('emojiListPartner', emojiFreq['PARTNER']);

    // --- Interaction & Copy ---
    const formatSummary = (rep) => {
        const title = "📊 THE ALGORITHM: RELATIONSHIP WRAPPED\n";
        const body = "✨ Headline: " + (rep.dynamic_headline || 'Complete') + 
                    "\n🧬 Persona: " + (rep.relationship_persona || 'The Duo') + 
                    "\n📈 Compatibility: " + (rep.compatibility_score || 85) + "/100" + 
                    "\n\n💡 Pulse: " + (rep.pulse_summary || '');
        return title + body + "\n\n🔗 the-algorithm.pages.dev";
    };

    document.getElementById('copySummaryBtn')?.addEventListener('click', () => {
        navigator.clipboard.writeText(formatSummary(report)).then(() => showToast('Summary copied!', 'success'));
    });

    if (report.top_shareable_snippet) {
        const snippetEl = document.getElementById('report-snippet');
        const container = document.getElementById('report-snippet-container');
        if (snippetEl) snippetEl.textContent = '"' + report.top_shareable_snippet + '"';
        if (container) container.classList.remove('hidden');
        document.getElementById('copySnippetBtn')?.addEventListener('click', () => {
            navigator.clipboard.writeText(report.top_shareable_snippet).then(() => showToast('Snippet copied!', 'success'));
        });
    }

    // --- Late Init ---
    setTimeout(initHighlights, 1500);
});

async function initHighlights() {
    console.log("Highlights logic ready.");
}
