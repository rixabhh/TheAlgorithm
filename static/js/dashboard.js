/**
 * The Algorithm - Dashboard Controller (V9.0 Premium)
 * Fixes missing details in Vibe Card and Dashboard stats.
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log("Dashboard Initializing (V9.0 Premium)...");
    
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
    
    // Global exposure
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
        el.innerHTML = items.slice(0, 3).map(i => '<div style="margin-bottom:.5rem;font-size:.85rem;display:flex;gap:.5rem"><span>✨</span><span>' + i + '</span></div>').join('');
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
    setText('report-milestones', (report.milestones || []).join(' ')); // Fallback if list rendering fails
    renderList('report-milestones', report.milestones); // Re-render properly

    // Road Ahead Special ID (if exists)
    const roadAhead = document.getElementById('report-milestones')?.parentElement?.querySelector('h3');
    if (roadAhead && report.predictive_path) {
        const p = document.createElement('p');
        p.style.fontSize = '0.85rem';
        p.style.marginTop = '0.5rem';
        p.textContent = report.predictive_path;
        document.getElementById('report-milestones')?.parentElement?.appendChild(p);
    }

    // --- 3. STAT CARDS ---
    const totalMsgs = weeklyData.reduce((sum, w) => sum + (w.me_count || 0) + (w.partner_count || 0), 0);
    setText('stat-total-msgs', totalMsgs.toLocaleString());

    const meTotal = weeklyData.reduce((sum, w) => sum + (w.me_count || 0), 0);
    const mePct = totalMsgs > 0 ? Math.round((meTotal / totalMsgs) * 100) : 50;
    setText('stat-me-pct', mePct + '%');

    const latencies = weeklyData.map(w => w.avg_latency_seconds || 0).filter(l => l > 0);
    const avgLat = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
    let latencyDisplay = '0s';
    if (avgLat > 0) {
        if (avgLat > 3600) latencyDisplay = Math.round(avgLat / 3600) + 'h';
        else if (avgLat > 60) latencyDisplay = Math.round(avgLat / 60) + 'm';
        else latencyDisplay = Math.round(avgLat) + 's';
    }
    setText('stat-avg-latency', latencyDisplay);

    const mirror = report.mirroring_score || stats.mirroring || 0;
    setText('mirroring-value', mirror + '%');

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
        if (!items || !items.length) { el.innerHTML = '<p style="color:var(--gray-400);font-size:.7rem">No emojis detected</p>'; return; }
        el.innerHTML = items.slice(0, 5).map(i => 
            '<div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.4rem">' +
                '<span style="font-size:1.2rem">' + i.emoji + '</span>' +
                '<div style="flex:1;height:8px;background:var(--cream);border-radius:4px;overflow:hidden">' +
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
    const meBar = document.getElementById('meInitiatorBar');
    const pBar = document.getElementById('partnerInitiatorBar');
    if (meBar) meBar.style.width = meInitPct + '%';
    if (pBar) pBar.style.width = (100 - meInitPct) + '%';

    // Power & Affection
    const power = stats.power_dynamics || { power_ratio: 1.0 };
    setText('powerRatioValue', parseFloat(power.power_ratio || 1.0).toFixed(1) + '×');

    const support = stats.support_gap || { ME: { support_received: 0, stress_count: 0 }, PARTNER: { support_received: 0, stress_count: 0 } };
    const totalAff = (support.ME.support_received || 0) + (support.PARTNER.support_received || 0);
    const totalStress = (support.ME.stress_count || 0) + (support.PARTNER.stress_count || 0);
    setText('affCount', totalAff);
    setText('disCount', totalStress);
    const affTotal = (totalAff + totalStress) || 1;
    const affBar = document.getElementById('affBar');
    const disBar = document.getElementById('disBar');
    if (affBar) affBar.style.width = (totalAff / affTotal * 100) + '%';
    if (disBar) disBar.style.width = (totalStress / affTotal * 100) + '%';

    // --- 5. INITIALIZE VISUALS ---
    setTimeout(() => {
        document.querySelectorAll('.skeleton').forEach(el => el.classList.remove('skeleton'));
        // Final visibility safety
        const hero = document.querySelector('.hero-dashboard');
        if (hero) {
            hero.style.opacity = '1';
            hero.style.visibility = 'visible';
        }
    }, 500);

    if (window.Chart && weeklyData.length > 1) {
        initVolumeChart(weeklyData);
    }
});

function initVolumeChart(weeks) {
    const canvas = document.createElement('canvas');
    canvas.style.maxHeight = '220px';
    canvas.style.marginTop = '1rem';
    const container = document.getElementById('deep-dive-details');
    if (!container) return;
    const inner = container.querySelector('div');
    if (inner) {
        const h3 = document.createElement('h3');
        h3.style.marginBottom = '0.5rem';
        h3.textContent = "Chat Volume Trends";
        inner.prepend(canvas);
        inner.prepend(h3);
    }
    new Chart(canvas, {
        type: 'line',
        data: {
            labels: weeks.map(w => w.week_start),
            datasets: [{
                label: 'Messages',
                count: weeks.map(w => w.volume),
                data: weeks.map(w => w.volume),
                borderColor: '#E040FB',
                backgroundColor: 'rgba(224, 64, 251, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 4
            }]
        },
        options: {
            plugins: { legend: { display: false } },
            scales: { x: { display: false }, y: { beginAtZero: true } }
        }
    });
}

/**
 * Robust Vibe Card Generation
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
        const setVal = (id, val) => { 
            const el = document.getElementById(id); 
            if (el) { el.textContent = val || ''; el.parentElement.style.opacity = '1'; }
        };

        setVal('share-headline', report.dynamic_headline);
        setVal('share-persona', report.relationship_persona);
        setVal('share-compatibility', report.compatibility_score);
        setVal('share-total-msgs', document.getElementById('stat-total-msgs')?.textContent || '--');
        setVal('share-me-pct', document.getElementById('stat-me-pct')?.textContent || '--');
        setVal('share-latency', document.getElementById('stat-avg-latency')?.textContent || '--');
        setVal('share-mirroring', document.getElementById('mirroring-value')?.textContent || '--');
        setVal('share-topic', report.main_topic || 'Random Talk');
        setVal('share-support', (report.support_score || '0') + '/100');
        setVal('share-snippet', report.top_shareable_snippet ? '"' + report.top_shareable_snippet + '"' : '');

        const canvas = await html2canvas(card, {
            scale: 2,
            backgroundColor: "#FFF8F0",
            logging: false,
            useCORS: true,
            allowTaint: true
        });

        const link = document.createElement('a');
        link.download = 'TheAlgorithm_Wrapped.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        if (window.showToast) showToast('Vibe Card Saved!', 'success');
    } catch (err) {
        console.error("Download failed:", err);
        if (window.showToast) showToast('Download failed. Please try again.', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}
