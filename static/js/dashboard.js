/**
 * The Algorithm - Dashboard Controller (V8.0 Final)
 * Complete restoration of charts, download, and AI insights.
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log("Dashboard Initializing (V8.0 Final)...");
    
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
    
    // Global exposure for download function
    window.dashboardData = dashboardData;
    const report = dashboardData.report || {};
    window.llmReport = report;
    const stats = dashboardData.stats || {};
    const weeklyData = stats.weekly_data || [];

    // --- 1. UI HELPERS ---
    const setText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text || '';
    };

    const renderList = (id, items) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (!items || !items.length) { el.innerHTML = '<p style="color:var(--gray-400);font-size:.75rem">No data for this section.</p>'; return; }
        el.innerHTML = items.map(i => '<div style="margin-bottom:.5rem;font-size:.85rem;display:flex;gap:.5rem"><span>✨</span><span>' + i + '</span></div>').join('');
    };

    // --- 2. HERO & NARRATIVE ---
    setText('report-headline', report.dynamic_headline || "Your Analysis");
    setText('report-pulse', report.pulse_summary || "Analyzing your digital footprint...");
    setText('report-persona', report.relationship_persona || "The Balanced Duo");
    setText('report-persona-text', report.persona_summary || "Predicting your communication spirit based on the data...");
    
    if (report.top_shareable_snippet) {
        setText('report-snippet', '"' + report.top_shareable_snippet + '"');
    }

    const compScore = parseInt(report.compatibility_score) || 85;
    if (window.animateValue) animateValue('report-compatibility', 0, compScore, 1500);
    else setText('report-compatibility', compScore);

    // AI Detail Cards
    renderList('report-milestones', report.milestones);
    renderList('report-nudges', report.repair_tips);
    setText('report-predictive-path', report.predictive_path);

    // --- 3. STAT CARDS ---
    const totalMsgs = weeklyData.reduce((sum, w) => sum + (w.me_count || 0) + (w.partner_count || 0), 0);
    setText('stat-total-msgs', totalMsgs.toLocaleString());

    const meTotal = weeklyData.reduce((sum, w) => sum + (w.me_count || 0), 0);
    const mePct = totalMsgs > 0 ? Math.round((meTotal / totalMsgs) * 100) : 50;
    setText('stat-me-pct', mePct + '%');

    const latencies = weeklyData.map(w => w.avg_latency_seconds).filter(l => l > 0);
    const avgLat = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
    if (avgLat > 0) {
        if (avgLat > 3600) setText('stat-avg-latency', Math.round(avgLat / 3600) + 'h');
        else if (avgLat > 60) setText('stat-avg-latency', Math.round(avgLat / 60) + 'm');
        else setText('stat-avg-latency', Math.round(avgLat) + 's');
    }

    // --- 4. DEEP DIVE INSIGHTS ---
    const insights = report.chart_insights || {};
    setText('insight-stability', insights.stability);
    setText('insight-volume', insights.volume);
    setText('insight-latency', insights.latency);
    setText('insight-emoji', insights.emoji);
    setText('insight-initiator', insights.initiator);
    setText('insight-power', insights.power);
    setText('insight-affection', insights.affection);

    // Emoji Lists
    const emojiFreq = stats.emoji_frequency || { ME: [], PARTNER: [] };
    const renderEmoji = (id, items) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (!items || !items.length) { el.innerHTML = '<p style="color:var(--gray-400);font-size:.75rem">No emojis detected</p>'; return; }
        el.innerHTML = items.slice(0, 5).map(i => 
            '<div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.4rem">' +
                '<span style="font-size:1.2rem">' + i.emoji + '</span>' +
                '<div style="flex:1;height:8px;background:var(--cream);border-radius:4px;overflow:hidden;border:1px solid rgba(0,0,0,0.05)">' +
                    '<div style="height:100%;background:var(--pink);width:' + (i.count / items[0].count * 100) + '%"></div>' +
                '</div>' +
                '<span style="font-size:.7rem;font-weight:700">' + i.count + '</span>' +
            '</div>'
        ).join('');
    };
    renderEmoji('emojiListMe', emojiFreq.ME);
    renderEmoji('emojiListPartner', emojiFreq.PARTNER);

    // Initiator Bars
    const inits = stats.initiator_ratio || { me_initiations: 0, partner_initiations: 0 };
    const totalInits = (inits.me_initiations || 0) + (inits.partner_initiations || 0);
    const meInitPct = totalInits > 0 ? Math.round((inits.me_initiations / totalInits) * 100) : 50;
    setText('meInitCount', inits.me_initiations || 0);
    setText('partnerInitCount', inits.partner_initiations || 0);
    document.getElementById('meInitiatorBar').style.width = meInitPct + '%';
    document.getElementById('partnerInitiatorBar').style.width = (100 - meInitPct) + '%';

    // Power & Affection
    const power = stats.power_dynamics || { power_ratio: 1.0 };
    setText('powerRatioValue', parseFloat(power.power_ratio).toFixed(1) + '×');

    const support = stats.support_gap || { ME: { support_received: 0, stress_count: 0 }, PARTNER: { support_received: 0, stress_count: 0 } };
    const totalAff = support.ME.support_received + support.PARTNER.support_received;
    const totalStress = support.ME.stress_count + support.PARTNER.stress_count;
    setText('affCount', totalAff);
    setText('disCount', totalStress);
    const affTotal = (totalAff + totalStress) || 1;
    document.getElementById('affBar').style.width = (totalAff / affTotal * 100) + '%';
    document.getElementById('disBar').style.width = (totalStress / affTotal * 100) + '%';

    // --- 5. INITIALIZE VISUALS ---
    setTimeout(() => {
        document.querySelectorAll('.skeleton').forEach(el => el.classList.remove('skeleton'));
    }, 800);

    // RESTORE CHARTS
    if (window.Chart && weeklyData.length > 1) {
        initVolumeChart(weeklyData);
    }
});

function initVolumeChart(weeks) {
    const ctx = document.createElement('canvas');
    ctx.style.maxHeight = '200px';
    const container = document.getElementById('deep-dive-details');
    if (!container) return;
    
    // Inject at the top of the details
    const div = document.createElement('div');
    div.style.marginBottom = '2rem';
    div.innerHTML = '<h3 style="margin-bottom:1rem">Chat Volume Intensity</h3>';
    div.appendChild(ctx);
    container.querySelector('div').prepend(div);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: weeks.map(w => w.week_start),
            datasets: [{
                label: 'Messages',
                data: weeks.map(w => w.volume),
                borderColor: '#E040FB',
                backgroundColor: 'rgba(224, 64, 251, 0.1)',
                tension: 0.4,
                fill: true,
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { display: false } },
                x: { grid: { display: false } }
            }
        }
    });
}

/**
 * html2canvas Card Generation
 */
async function downloadWrappedCard() {
    const btn = document.getElementById('downloadVibeBtn');
    if (!btn || btn.disabled) return;
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Processing...";

    try {
        const card = document.getElementById('shareable-card');
        const report = window.llmReport || {};
        
        // Final map of shareable fields
        const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || '--'; };
        setVal('share-headline', report.dynamic_headline);
        setVal('share-persona', report.relationship_persona);
        setVal('share-compatibility', report.compatibility_score);
        setVal('share-total-msgs', document.getElementById('stat-total-msgs').textContent);
        setVal('share-me-pct', document.getElementById('stat-me-pct').textContent);
        setVal('share-latency', document.getElementById('stat-avg-latency').textContent);
        setVal('share-mirroring', document.getElementById('mirroring-value').textContent);
        setVal('share-snippet', report.top_shareable_snippet);

        const canvas = await html2canvas(card, {
            scale: 2,
            backgroundColor: "#FFF8F0",
            logging: false,
            useCORS: true
        });

        const link = document.createElement('a');
        link.download = 'VibeCard_TheAlgorithm.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        if (window.showToast) showToast('Vibe Card Downloaded!', 'success');
    } catch (err) {
        console.error("Download failed:", err);
        if (window.showToast) showToast('Download error. Try again.', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}
