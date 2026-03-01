document.addEventListener('DOMContentLoaded', () => {
    const data = window.algorithmData || [];
    const report = window.llmReport || {};
    const emojiFreq = window.emojiFreq || {};
    const initiatorRatio = window.initiatorRatio || {};
    const powerDynamics = window.powerDynamics || {};
    const affectionFriction = window.affectionFriction || {};
    const supportGap = window.supportGap || {};
    const mirroring = window.mirroring || {};
    const topicMix = window.topicMix || {};

    // 1. V4.0: Narrative & Coaching Elements
    document.getElementById('report-headline').textContent = report.dynamic_headline || "Your Relationship Pulse";
    document.getElementById('report-pulse').textContent = report.pulse_summary || "Could not generate pulse summary.";
    document.getElementById('report-persona').textContent = report.relationship_persona || "The Enigma";
    document.getElementById('report-compatibility').textContent = report.compatibility_score || "85";

    // Support Score Calculation
    const meSupport = supportGap['ME'] || { stress_count: 0, support_received: 0 };
    const pSupport = supportGap['PARTNER'] || { stress_count: 0, support_received: 0 };
    const totalStress = meSupport.stress_count + pSupport.stress_count;
    const totalSupport = meSupport.support_received + pSupport.support_received;
    const supportScore = totalStress > 0 ? Math.round((totalSupport / totalStress) * 100) : '--';
    document.getElementById('support-score').textContent = supportScore + (supportScore !== '--' ? '%' : '');

    // Mirroring Value
    const mirroringVal = (mirroring['ME_mirroring'] || 0) + (mirroring['PARTNER_mirroring'] || 0);
    document.getElementById('mirroring-value').textContent = mirroringVal > 0 ? mirroringVal + ' level' : 'Low';

    // Core Topic
    const sortedTopics = Object.entries(topicMix).sort((a, b) => b[1] - a[1]);
    document.getElementById('core-topic').textContent = sortedTopics.length > 0 ? sortedTopics[0][0] : 'General';

    // Repair Tips (Nudges)
    const nudgeContainer = document.getElementById('report-nudges');
    if (report.repair_tips && Array.isArray(report.repair_tips)) {
        nudgeContainer.innerHTML = report.repair_tips.map(tip => `
            <div class="flex gap-2 items-start bg-white/5 p-3 rounded-xl border border-white/5 hover:border-pink-500/30 transition-colors">
                <span class="text-pink-400 font-bold">●</span>
                <span>${tip}</span>
            </div>
        `).join('');
    }

    // Milestones
    const milestoneContainer = document.getElementById('report-milestones');
    if (report.milestones && Array.isArray(report.milestones)) {
        milestoneContainer.innerHTML = report.milestones.map(m => `
            <div class="flex items-center gap-3 border-l border-purple-500/30 pl-4 py-1">
                <div class="w-2 h-2 rounded-full bg-purple-500 -ml-[21px]"></div>
                <span>${m}</span>
            </div>
        `).join('');
    }

    const snippetEl = document.getElementById('report-snippet');
    if (snippetEl) {
        snippetEl.textContent = report.top_shareable_snippet || "No shareable highlight generated.";
    }

    // Populate Chart Insights
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

    if (!data.length) return;

    // Removed raw chart code (riskChart, volumeChart, latencyChart) since we replaced them with text cards.

    // 3. Modals & Flashbacks
    async function showFlashback(week) {
        const modal = document.getElementById('flashback-modal');
        const content = document.getElementById('flashback-content');
        const dateEl = document.getElementById('flashback-date');

        modal.classList.remove('hidden');
        dateEl.textContent = `Week of ${week}`;
        content.innerHTML = '<div class="text-center py-12 text-gray-500">Reliving memories...</div>';

        try {
            const resp = await fetch(`/flashback?week=${week}`);
            const messages = await resp.json();

            if (!messages || messages.length === 0) {
                content.innerHTML = '<div class="text-center py-12 text-gray-400">No message data available for this week.</div>';
                return;
            }

            content.innerHTML = messages.map(m => `
                <div class="flex flex-col ${m.sender === 'ME' ? 'items-end' : 'items-start'} space-y-1">
                    <span class="text-[10px] text-gray-500 uppercase">${m.sender === 'ME' ? 'You' : 'Partner'}</span>
                    <div class="px-4 py-2 rounded-2xl max-w-[90%] text-sm ${m.sender === 'ME' ? 'bg-brand-600 text-white rounded-tr-none' : 'bg-white/10 text-gray-100 rounded-tl-none border border-white/5'}">
                        ${m.text}
                    </div>
                </div>
            `).join('');

        } catch (e) {
            content.innerHTML = '<div class="text-center py-12 text-red-400">Error loading flashback.</div>';
        }
    }

    // --- Existing Stats (Emoji, Initiator, Power) ---
    const renderEmojiList = (containerId, items) => {
        const el = document.getElementById(containerId);
        if (!items || items.length === 0) { el.innerHTML = '<p class="text-gray-500 text-xs">No emojis found</p>'; return; }
        const maxCount = items[0].count;
        el.innerHTML = items.map(item => `
            <div class="flex items-center gap-2">
                <span class="text-lg w-6 text-center">${item.emoji}</span>
                <div class="flex-1 h-3 bg-dark-900 rounded-full overflow-hidden">
                    <div class="h-full rounded-full bg-gradient-to-r from-brand-500 to-pink-500" style="width: ${(item.count / maxCount) * 100}%"></div>
                </div>
                <span class="text-xs text-gray-400 w-6 text-right">${item.count}</span>
            </div>
        `).join('');
    };
    renderEmojiList('emojiListMe', emojiFreq['ME'] || []);
    renderEmojiList('emojiListPartner', emojiFreq['PARTNER'] || []);

    const totalInit = (initiatorRatio.me_initiations || 0) + (initiatorRatio.partner_initiations || 0);
    document.getElementById('meInitCount').textContent = initiatorRatio.me_initiations || 0;
    document.getElementById('partnerInitCount').textContent = initiatorRatio.partner_initiations || 0;

    if (totalInit > 0) {
        const mePct = ((initiatorRatio.me_initiations || 0) / totalInit) * 100;
        const partnerPct = ((initiatorRatio.partner_initiations || 0) / totalInit) * 100;

        document.getElementById('meInitiatorBar').style.width = `${mePct}%`;
        document.getElementById('partnerInitiatorBar').style.width = `${partnerPct}%`;
    }
    const ratioVal = powerDynamics.power_ratio || 1.0;
    document.getElementById('powerRatioValue').textContent = ratioVal.toFixed(1) + 'x';
    let ratioDesc = "You both text about the same amount.";
    if (ratioVal > 1.2) ratioDesc = "You generally send longer or more frequent messages.";
    else if (ratioVal < 0.8) ratioDesc = "Your partner generally sends longer or more frequent messages.";
    document.getElementById('powerRatioText').textContent = ratioDesc;

    const affCount = affectionFriction.affirmative_count || 0;
    const disCount = affectionFriction.dismissive_count || 0;
    document.getElementById('affCount').textContent = affCount;
    document.getElementById('disCount').textContent = disCount;
    const totalAf = affCount + disCount;
    if (totalAf > 0) {
        document.getElementById('affBar').style.width = `${(affCount / totalAf) * 100}%`;
        document.getElementById('disBar').style.width = `${(disCount / totalAf) * 100}%`;
    }
});

// --- Spotify Wrapped Download Logic ---
async function downloadWrappedCard() {
    const report = window.llmReport || {};
    const topicMix = window.topicMix || {};
    const supportGap = window.supportGap || {};
    const mirroring = window.mirroring || {};

    // 1. Calculate values
    const sortedTopics = Object.entries(topicMix).sort((a, b) => b[1] - a[1]);
    const coreTopic = sortedTopics.length > 0 ? sortedTopics[0][0] : 'General';

    const meSupport = supportGap['ME'] || { stress_count: 0, support_received: 0 };
    const pSupport = supportGap['PARTNER'] || { stress_count: 0, support_received: 0 };
    const totalStress = meSupport.stress_count + pSupport.stress_count;
    const totalSupport = meSupport.support_received + pSupport.support_received;
    const supportScore = totalStress > 0 ? Math.round((totalSupport / totalStress) * 100) + '%' : '--';

    // 2. Populate the hidden card
    document.getElementById('share-persona').textContent = report.relationship_persona || "The Mystery";
    document.getElementById('share-topic').textContent = coreTopic;
    document.getElementById('share-support').textContent = supportScore;
    document.getElementById('share-snippet').textContent = report.top_shareable_snippet || "Just vibing.";
    document.getElementById('share-predictive').textContent = report.predictive_path || "Walking the path together.";
    document.getElementById('share-time-machine').textContent = report.time_machine_insights || "Building history.";
    document.getElementById('share-compatibility').textContent = report.compatibility_score || "85";

    // 3. Unhide, Capture, and Re-hide
    const container = document.getElementById('shareable-capture-container');
    const card = document.getElementById('shareable-card');

    // Move on-screen temporarily for exact rendering
    container.style.left = '0px';
    container.style.top = '0px';
    container.style.zIndex = '-999';

    try {
        const canvas = await html2canvas(card, {
            scale: 2, // High-res export
            useCORS: true,
            backgroundColor: '#111827' // match dark bg
        });

        // Trigger download
        const link = document.createElement('a');
        link.download = 'relationship-wrapped.png';
        link.href = canvas.toDataURL('image/png');
        link.click();

    } catch (err) {
        console.error("Failed to generate wrapped image:", err);
        alert("Oops! Couldn't generate your wrapped image. Check console for details.");
    } finally {
        // Hide again
        container.style.left = '-9999px';
        container.style.top = '-9999px';
        container.style.zIndex = 'auto';
    }
}
