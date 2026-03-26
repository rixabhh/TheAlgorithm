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

    // Scroll Progress Bar
    const progressBarScroll = document.getElementById('scroll-progress');
    if (progressBarScroll) {
        window.addEventListener('scroll', () => {
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (winScroll / height) * 100;
            progressBarScroll.style.width = scrolled + '%';
        });
    }

    // Intersection Observer for Progressive Reveal & Animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                // If it's the score card, trigger count up
                if (entry.target.id === 'score-card-container') {
                    const compScore = parseInt(report.compatibility_score) || 85;
                    animateValue('report-compatibility', 0, compScore, 1500);
                }
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements with .observe-me class
    document.querySelectorAll('.observe-me').forEach(el => revealObserver.observe(el));

    // 1. V4.0: Narrative & Coaching Elements
    document.getElementById('report-headline').textContent = report.dynamic_headline || "Your Relationship Pulse";
    document.getElementById('report-pulse').textContent = report.pulse_summary || "Could not generate pulse summary.";
    document.getElementById('report-persona').textContent = report.relationship_persona || "The Enigma";

    // Compatibility Animation
    const compScore = parseInt(report.compatibility_score) || 85;
    animateValue('report-compatibility', 0, compScore, 1500);

    // Support Score Calculation
    const meSupport = supportGap['ME'] || { stress_count: 0, support_received: 0 };
    const pSupport = supportGap['PARTNER'] || { stress_count: 0, support_received: 0 };
    const totalStress = meSupport.stress_count + pSupport.stress_count;
    const totalSupport = meSupport.support_received + pSupport.support_received;
    const supportScore = totalStress > 0 ? Math.round((totalSupport / totalStress) * 100) : null;

    if (supportScore !== null && document.getElementById('support-score')) {
        animateValue('support-score', 0, supportScore, 1500, '%');
    } else if (document.getElementById('support-score')) {
        document.getElementById('support-score').textContent = '--';
    }

    // Mirroring Value
    const mirroringVal = (mirroring['ME_mirroring'] || 0) + (mirroring['PARTNER_mirroring'] || 0);
    const mirEl = document.getElementById('mirroring-value');
    if (mirEl) mirEl.textContent = mirroringVal > 0 ? mirroringVal + ' level' : 'Low';

    // Core Topic
    const sortedTopics = Object.entries(topicMix).sort((a, b) => b[1] - a[1]);
    const topicEl = document.getElementById('core-topic');
    if (topicEl) topicEl.textContent = sortedTopics.length > 0 ? sortedTopics[0][0] : 'General';

    // --- Stat Cards: Populate values + micro-insights ---
    // Total messages
    const totalMsgs = data.reduce((sum, w) => sum + (w.me_count || 0) + (w.partner_count || 0), 0);
    const totalMsgsEl = document.getElementById('stat-total-msgs');
    if (totalMsgsEl) {
        totalMsgsEl.textContent = totalMsgs.toLocaleString();
    }
    const insightMsgs = document.getElementById('stat-insight-msgs');
    if (insightMsgs) {
        if (totalMsgs > 10000) insightMsgs.textContent = 'Deep conversation history';
        else if (totalMsgs > 3000) insightMsgs.textContent = 'Solid dataset for analysis';
        else if (totalMsgs > 500) insightMsgs.textContent = 'Good sample size';
        else insightMsgs.textContent = 'More data = better insights';
    }

    // Your share %
    const meTotal = data.reduce((sum, w) => sum + (w.me_count || 0), 0);
    const mePct = totalMsgs > 0 ? Math.round((meTotal / totalMsgs) * 100) : 50;
    const mePctEl = document.getElementById('stat-me-pct');
    if (mePctEl) mePctEl.textContent = mePct + '%';
    const insightShare = document.getElementById('stat-insight-share');
    if (insightShare) {
        if (mePct > 60) insightShare.textContent = 'You drive the conversation';
        else if (mePct > 45) insightShare.textContent = 'Balanced exchange';
        else if (mePct > 30) insightShare.textContent = 'Good listener';
        else insightShare.textContent = 'Very reserved';
    }

    // Avg response latency
    const latencies = data.map(w => w.avg_latency_seconds).filter(l => l && l > 0);
    const avgLatency = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
    const avgLatencyEl = document.getElementById('stat-avg-latency');
    if (avgLatencyEl) {
        if (avgLatency > 3600) avgLatencyEl.textContent = Math.round(avgLatency / 3600) + 'h';
        else if (avgLatency > 60) avgLatencyEl.textContent = Math.round(avgLatency / 60) + 'm';
        else if (avgLatency > 0) avgLatencyEl.textContent = Math.round(avgLatency) + 's';
        else avgLatencyEl.textContent = '--';
    }
    const insightLatency = document.getElementById('stat-insight-latency');
    if (insightLatency) {
        if (avgLatency > 0 && avgLatency < 120) insightLatency.textContent = 'Quick replies, high engagement';
        else if (avgLatency < 600) insightLatency.textContent = 'Responsive communication';
        else if (avgLatency < 3600) insightLatency.textContent = 'Thoughtful pauses';
        else if (avgLatency > 0) insightLatency.textContent = 'Relaxed pace';
        else insightLatency.textContent = '';
    }

    // Mirroring insight
    const insightMirror = document.getElementById('stat-insight-mirror');
    if (insightMirror) {
        if (mirroringVal >= 3) insightMirror.textContent = 'Strong linguistic sync';
        else if (mirroringVal >= 1) insightMirror.textContent = 'Moderate alignment';
        else insightMirror.textContent = 'Independent styles';
    }

    // Repair Tips (Nudges)
    const nudgeContainer = document.getElementById('report-nudges');
    if (nudgeContainer && report.repair_tips && Array.isArray(report.repair_tips)) {
        nudgeContainer.innerHTML = report.repair_tips.map(tip => `
            <div style="display:flex;gap:.5rem;align-items:flex-start;padding:.75rem;border-radius:var(--r-sm);border:1px solid var(--gray-200);margin-bottom:.5rem;background:var(--cream)">
                <span style="color:var(--pink);font-weight:900">●</span>
                <span style="font-size:.9rem">${escapeHTML(tip)}</span>
            </div>
        `).join('');
    }

    // Milestones
    const milestoneContainer = document.getElementById('report-milestones');
    if (milestoneContainer && report.milestones && Array.isArray(report.milestones)) {
        milestoneContainer.innerHTML = report.milestones.map(m => `
            <div style="display:flex;align-items:center;gap:.75rem;border-left:2px solid var(--purple);padding-left:1rem;padding:.5rem 0 .5rem 1rem">
                <div style="width:8px;height:8px;border-radius:50%;background:var(--purple);margin-left:-21px;flex-shrink:0"></div>
                <span style="font-size:.9rem">${escapeHTML(m)}</span>
            </div>
        `).join('');
    }

    const snippetEl = document.getElementById('report-snippet');
    const snippetContainer = document.getElementById('report-snippet-container');
    const copyBtn = document.getElementById('copySnippetBtn');

    if (snippetEl && report.top_shareable_snippet) {
        snippetEl.textContent = `"${report.top_shareable_snippet}"`;
        if (snippetContainer) snippetContainer.classList.remove('hidden');

        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const originalHTML = copyBtn.innerHTML;
                navigator.clipboard.writeText(report.top_shareable_snippet).then(() => {
                    showToast("Snippet copied to clipboard!", "success");
                    copyBtn.innerHTML = `
                        <svg style="width: 1.25rem; height: 1.25rem; color: #34d399;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                    `;
                    setTimeout(() => {
                        copyBtn.innerHTML = originalHTML;
                    }, 2000);
                }).catch(err => {
                    console.error('Failed to copy text: ', err);
                });
            });
        }
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
        modal.classList.add('active');
        dateEl.textContent = `Week of ${week}`;
        content.innerHTML = '<div style="text-align:center;padding:3rem 0;color:var(--gray-400)">Reliving memories...</div>';

        try {
            const messages = window.flashbacks[week] || [];

            if (!messages || messages.length === 0) {
                content.innerHTML = '<div style="text-align:center;padding:3rem 0;color:var(--gray-400)">No message data available for this week.</div>';
                return;
            }

            content.innerHTML = messages.map(m => `
                <div style="display:flex;flex-direction:column;${m.sender === 'ME' ? 'align-items:flex-end' : 'align-items:flex-start'};margin-bottom:.75rem">
                    <span style="font-size:.65rem;color:var(--gray-400);text-transform:uppercase;font-weight:700">${m.sender === 'ME' ? 'You' : 'Partner'}</span>
                    <div style="padding:.5rem 1rem;border-radius:1rem;max-width:90%;font-size:.85rem;${m.sender === 'ME' ? 'background:var(--purple);color:var(--white);border-top-right-radius:4px' : 'background:var(--cream);color:var(--black);border:var(--border);border-top-left-radius:4px'}">
                        ${escapeHTML(m.text)}
                    </div>
                </div>
            `).join('');

        } catch (e) {
            content.innerHTML = '<div style="text-align:center;padding:3rem 0;color:var(--red)">Error loading flashback.</div>';
        }
    }

    // --- Existing Stats (Emoji, Initiator, Power) ---
    const renderEmojiList = (containerId, items) => {
        const el = document.getElementById(containerId);
        if (!items || items.length === 0) { el.innerHTML = '<p class="text-gray-500 text-xs">No emojis found</p>'; return; }
        const maxCount = items[0].count;
        el.innerHTML = items.map(item => `
            <div class="flex items-center gap-2">
                <span class="text-lg w-6 text-center">${escapeHTML(item.emoji)}</span>
                <div class="flex-1 h-4 bg-cream rounded-full overflow-hidden border-2 border-black">
                    <div class="h-full bg-pink border-r-2 border-black" style="width: ${(item.count / maxCount) * 100}%;"></div>
                </div>
                <span class="font-body font-bold text-xs text-black w-6 text-right">${item.count}</span>
            </div>
        `).join('');
    };
    renderEmojiList('emojiListMe', emojiFreq['ME'] || []);
    renderEmojiList('emojiListPartner', emojiFreq['PARTNER'] || []);

    // 4. Trigger Deep Dive Animations on Expansion
    const deepDiveDetails = document.getElementById('deep-dive-details');
    if (deepDiveDetails) {
        deepDiveDetails.addEventListener('toggle', () => {
            if (deepDiveDetails.open) {
                // Initiator counts
                animateValue('meInitCount', 0, initiatorRatio.me_initiations || 0, 1000);
                animateValue('partnerInitCount', 0, initiatorRatio.partner_initiations || 0, 1000);

                const totalInit = (initiatorRatio.me_initiations || 0) + (initiatorRatio.partner_initiations || 0);
                if (totalInit > 0) {
                    const mePct = ((initiatorRatio.me_initiations || 0) / totalInit) * 100;
                    const partnerPct = ((initiatorRatio.partner_initiations || 0) / totalInit) * 100;
                    document.getElementById('meInitiatorBar').style.width = `${mePct}%`;
                    document.getElementById('partnerInitiatorBar').style.width = `${partnerPct}%`;
                }

                // Power Dynamics (Chat Balance)
                const ratioVal = powerDynamics.power_ratio || 1.0;
                animateValue('powerRatioValue', 0, ratioVal, 1000, 'x', 1);

                // Affection counts
                const affCount = affectionFriction.affirmative_count || 0;
                const disCount = affectionFriction.dismissive_count || 0;
                animateValue('affCount', 0, affCount, 1000);
                animateValue('disCount', 0, disCount, 1000);

                const totalAf = affCount + disCount;
                if (totalAf > 0) {
                    document.getElementById('affBar').style.width = `${(affCount / totalAf) * 100}%`;
                    document.getElementById('disBar').style.width = `${(disCount / totalAf) * 100}%`;
                }
            }
        }, { once: true }); // Only animate once per session
    }

    // Static description population
    const ratioVal = powerDynamics.power_ratio || 1.0;
    let ratioDesc = "You both text about the same amount.";
    if (ratioVal > 1.2) ratioDesc = "You generally send longer or more frequent messages.";
    else if (ratioVal < 0.8) ratioDesc = "Your partner generally sends longer or more frequent messages.";
    document.getElementById('powerRatioText').textContent = ratioDesc;
});

/**
 * Shows a styled toast notification.
 * @param {string} message - The message to display.
 * @param {'success' | 'error' | 'info'} type - The type of toast.
 */
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    let bgColor = 'var(--blue)';
    let icon = 'ℹ️';
    if (type === 'success') { bgColor = 'var(--green)'; icon = '✅'; }
    else if (type === 'error') { bgColor = 'var(--pink)'; icon = '❌'; }

    toast.style.cssText = `padding:1rem;border-radius:var(--r-md);border:3px solid var(--black);background:${bgColor};box-shadow:var(--shadow);min-width:280px;max-width:360px;pointer-events:auto;transform:translateY(1rem);opacity:0;transition:all 0.4s ease`;
    toast.innerHTML = `
        <div style="display:flex;align-items:center;gap:.75rem">
            <span style="font-size:1.5rem;flex-shrink:0">${icon}</span>
            <div style="font-weight:700;color:var(--black)">${escapeHTML(message)}</div>
        </div>
    `;

    toastContainer.appendChild(toast);
    requestAnimationFrame(() => { toast.style.transform = 'translateY(0)'; toast.style.opacity = '1'; });
    setTimeout(() => {
        toast.style.transform = 'translateY(1rem)'; toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 5000);
}

// --- Spotify Wrapped Download Logic ---
async function downloadWrappedCard() {
    const downloadBtn = document.getElementById('downloadVibeBtn');
    const originalContent = downloadBtn ? downloadBtn.innerHTML : '';

    try {
        if (downloadBtn) {
            downloadBtn.disabled = true;
            downloadBtn.innerHTML = `
                <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Capturing...</span>
            `;
        }

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

        // 2b. Populate new stat fields
        const weeklyData = window.algorithmData || [];
        const shareTotalMsgs = weeklyData.reduce((s, w) => s + (w.me_count || 0) + (w.partner_count || 0), 0);
        const shareMeTotal = weeklyData.reduce((s, w) => s + (w.me_count || 0), 0);
        const shareMePct = shareTotalMsgs > 0 ? Math.round((shareMeTotal / shareTotalMsgs) * 100) : 50;
        const shareLatencies = weeklyData.map(w => w.avg_latency_seconds).filter(l => l && l > 0);
        const shareAvgLat = shareLatencies.length > 0 ? shareLatencies.reduce((a, b) => a + b, 0) / shareLatencies.length : 0;
        const shareMirrorVal = (mirroring['ME_mirroring'] || 0) + (mirroring['PARTNER_mirroring'] || 0);

        const stm = document.getElementById('share-total-msgs');
        if (stm) stm.textContent = shareTotalMsgs.toLocaleString();
        const smp = document.getElementById('share-me-pct');
        if (smp) smp.textContent = shareMePct + '%';
        const sl = document.getElementById('share-latency');
        if (sl) {
            if (shareAvgLat > 3600) sl.textContent = Math.round(shareAvgLat / 3600) + 'h';
            else if (shareAvgLat > 60) sl.textContent = Math.round(shareAvgLat / 60) + 'm';
            else if (shareAvgLat > 0) sl.textContent = Math.round(shareAvgLat) + 's';
            else sl.textContent = '--';
        }
        const smr = document.getElementById('share-mirroring');
        if (smr) smr.textContent = shareMirrorVal > 0 ? 'Level ' + shareMirrorVal : 'Low';

        // 3. Unhide, Capture, and Re-hide
        const container = document.getElementById('shareable-capture-container');
        const card = document.getElementById('shareable-card');

        // Move on-screen temporarily for exact rendering
        container.style.left = '0px';
        container.style.top = '0px';
        container.style.zIndex = '-999';

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

        // Show success toast
        showToast("Vibe card downloaded successfully!", "success");

    } catch (err) {
        console.error("Failed to generate wrapped image:", err);
        showToast("Couldn't generate your wrapped image. Please try again.", "error");
    } finally {
        // Hide again
        container.style.left = '-9999px';
        container.style.top = '-9999px';
        container.style.zIndex = 'auto';

        if (downloadBtn) {
            downloadBtn.disabled = false;
            downloadBtn.innerHTML = originalContent;
        }
    }
}

// --- Contextual Highlights Popup Logic ---
async function initHighlights() {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    try {
        const data = { 
            highlights: window.highlights || [], 
            connection_type: window.connectionType || 'romantic' 
        };
        const highlights = data.highlights;
        const connectionType = data.connection_type || 'romantic';

        if (!highlights || highlights.length === 0) return;

        let iconHtml = '❤️';
        if (connectionType === 'friend') iconHtml = '🤝';
        else if (connectionType === 'professional') iconHtml = '💼';
        else if (connectionType === 'family') iconHtml = '🏠';

        let currentIndex = 0;

        const showNextHighlight = () => {
            if (currentIndex >= highlights.length) currentIndex = 0;
            const item = highlights[currentIndex];
            currentIndex++;

            const toast = document.createElement('div');
            toast.style.cssText = 'padding:1rem;display:flex;flex-direction:column;gap:.5rem;border-radius:var(--r-md);border:2px solid var(--black);background:var(--cream);box-shadow:var(--shadow);min-width:280px;max-width:360px;pointer-events:auto;transform:translateY(1rem);opacity:0;transition:all 0.4s ease';

            toast.innerHTML = `
                <div style="display:flex;align-items:center;justify-content:space-between">
                    <span style="font-family:var(--font-heading);font-weight:900;font-size:.65rem;text-transform:uppercase;letter-spacing:.05em;display:flex;align-items:center;gap:.25rem;background:var(--yellow);padding:.1rem .5rem;border:1px solid var(--black);border-radius:4px;box-shadow:1px 1px 0 0 var(--black)">
                        ${iconHtml} ${escapeHTML(item.title)}
                    </span>
                    <span style="font-weight:700;font-size:.6rem;color:var(--gray-400);border:1px solid var(--gray-300);padding:0 .25rem;border-radius:3px">${escapeHTML(item.timestamp.split(' ')[0])}</span>
                </div>
                <div style="font-style:italic;font-size:.85rem;padding:.5rem;background:var(--white);border-radius:var(--r-sm);border:1px solid rgba(0,0,0,0.1)">"${escapeHTML(item.text)}"</div>
                <div style="text-align:right;font-size:.6rem;font-weight:700;color:var(--gray-500);text-transform:uppercase">— ${escapeHTML(item.sender)}</div>
            `;

            toastContainer.appendChild(toast);
            requestAnimationFrame(() => { toast.style.transform = 'translateY(0)'; toast.style.opacity = '1'; });
            setTimeout(() => {
                toast.style.transform = 'translateY(1rem)'; toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 700);
            }, 6000);
        };

        setTimeout(() => {
            showNextHighlight();
            setInterval(showNextHighlight, 8000);
        }, 3000);

    } catch (e) {
        console.error('Failed to load highlights:', e);
    }
}

// Initialize highlights after everything else
document.addEventListener('DOMContentLoaded', () => {
    // Delay initialization slightly to let the heavy dashboard charts render first
    setTimeout(initHighlights, 1500);
});
// --- Interactivity V5.4 ---
document.addEventListener('DOMContentLoaded', () => {
    // Copy Snippet
    const copySnippetBtn = document.getElementById('copySnippetBtn');
    if (copySnippetBtn) {
        copySnippetBtn.addEventListener('click', async () => {
            const snippet = document.getElementById('report-snippet')?.innerText;
            if (snippet) {
                try {
                    await navigator.clipboard.writeText(snippet);
                    showToast('Snippet copied!');
                } catch (e) { showToast('Copy failed'); }
            }
        });
    }

    // Copy Summary
    const copySummaryBtn = document.getElementById('copySummaryBtn');
    if (copySummaryBtn) {
        copySummaryBtn.addEventListener('click', async () => {
            const summary = typeof window.llmReport === 'object' ? JSON.stringify(window.llmReport, null, 2) : window.llmReport;
            try {
                await navigator.clipboard.writeText(summary);
                showToast('Summary copied!');
            } catch (e) { showToast('Copy failed'); }
        });
    }
});
