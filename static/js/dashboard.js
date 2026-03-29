/**
 * The Algorithm - Dashboard Controller (V10.0 Premium Comparison)
 */

function escapeHTML(str) {
    if (typeof str !== 'string') return String(str);
    return str.replace(/[&<>'"]/g,
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const isCompareMode = urlParams.get('mode') === 'compare';
    
    let dataA = null;
    let dataB = null;
    let activeData = null;
    let activeSlot = 'a';

    // 1. DATA LOADING
    const hash = window.location.hash;
    if (hash && hash.startsWith('#share=')) {
        try {
            const encoded = hash.substring(7);
            activeData = JSON.parse(decodeURIComponent(atob(encoded)));
            window.activeData = activeData;
            document.getElementById('profile-name').textContent = `${activeData.my_name} & ${activeData.partner_name}`;

            // Reconstruct a minimal LLM report mock since shared URL does not include full stats
            if (activeData.share_report) {
                window.llmReport = activeData.share_report;
                setTimeout(() => {
                    const results = document.getElementById('ai-results-container');
                    const permission = document.getElementById('ai-permission-container');
                    if (permission) permission.classList.add('hidden');
                    if (results) {
                        results.classList.remove('hidden');
                        document.getElementById('ai-insight-title').textContent = activeData.share_report.title;
                        document.getElementById('ai-insight-reality').textContent = activeData.share_report.reality;
                        document.getElementById('ai-insight-shift').textContent = activeData.share_report.shift;
                        document.getElementById('ai-insight-verdict').textContent = activeData.share_report.verdict;

                        const red = document.getElementById('ai-insight-red-flags');
                        const green = document.getElementById('ai-insight-green-flags');
                        if (red && activeData.share_report.red) red.innerHTML = `<li>${escapeHTML(activeData.share_report.red)}</li>`;
                        if (green && activeData.share_report.green) green.innerHTML = `<li>${escapeHTML(activeData.share_report.green)}</li>`;

                        const regen = document.getElementById('regenerateBtn');
                        if(regen) regen.style.display = 'none';
                    }
                }, 500);
            }
        } catch (e) {
            console.error("Failed to parse share data", e);
            window.location.href = '/';
            return;
        }
    } else if (isCompareMode) {
        dataA = JSON.parse(sessionStorage.getItem('compare_a'));
        dataB = JSON.parse(sessionStorage.getItem('compare_b'));
        if (!dataA || !dataB) { window.location.href = '/'; return; }
        activeData = dataA;
        window.activeData = activeData; // Added
        document.getElementById('comparison-sticky-nav')?.classList.remove('hidden');
        document.getElementById('comp-name-a').textContent = `${dataA.my_name} & ${dataA.partner_name}`;
        document.getElementById('comp-name-b').textContent = `${dataB.my_name} & ${dataB.partner_name}`;
        document.getElementById('insights-heading').textContent = "Comparative Analysis";
        document.getElementById('insights-sub').textContent = "Side-by-side comparison of your chat dynamics.";
    } else {
        const stored = sessionStorage.getItem('dashboard_data');
        if (!stored) { window.location.href = '/'; return; }
        activeData = JSON.parse(stored);
        window.activeData = activeData; // Added
    }

    // --- NAVIGATION ---
    const setupNavigation = () => {
        const navLinks = document.querySelectorAll('.sidebar-nav a');
        const sections = document.querySelectorAll('main section');
        window.addEventListener('scroll', () => {
            let current = '';
            sections.forEach(s => { if (pageYOffset >= s.offsetTop - 150) current = s.getAttribute('id'); });
            navLinks.forEach(l => {
                l.classList.remove('active');
                if (l.getAttribute('href').substring(1) === current) l.classList.add('active');
            });
        });
    };
    setupNavigation();

    // --- RENDER FUNCTIONS ---
    const refreshAll = () => {
        const stats = activeData.stats || {};
        const meName = activeData.my_name || "You";
        const partnerName = activeData.partner_name || "Partner";

        document.getElementById('profile-name').textContent = `${meName} & ${partnerName}`;
        document.getElementById('traits-name-me').textContent = meName;
        document.getElementById('traits-name-partner').textContent = partnerName;
        document.getElementById('report-headline').textContent = isCompareMode ? `Comparing Chats` : `Analysis: ${partnerName}`;

        renderSocialDynamics(stats);
        renderEngagement(stats);
        renderStreaks(stats);
        renderWordCloud(stats);
        renderEmoji(stats);
        
        if (window.Chart) {
            initRatioChart(stats);
            initActivityChart(stats.weekly_data || []);
        }
    };

    const renderSocialDynamics = (stats) => {
        const traits = stats.behavioral_traits || { ME: {}, PARTNER: {} };
        const update = (suffix, data) => {
            const scores = data.scores || {};
            ['curiosity', 'politeness', 'warmth', 'intimacy'].forEach(t => {
                const val = scores[t] || 0;
                const el = document.getElementById(`trait-val-${t}-${suffix}`);
                if (el) el.textContent = val;
                const bar = document.getElementById(`trait-bar-${t}-${suffix}`);
                if (bar) bar.style.width = val + '%';
            });
            const pills = document.getElementById(`traits-pills-${suffix}`);
            if (pills) pills.innerHTML = (data.highlights || []).map(h => `<span class="pill-label pill-label--pink" style="font-size:0.6rem">${escapeHTML(h.label)}: ${escapeHTML(h.count)}</span>`).join('');
            const summary = document.getElementById(`traits-summary-${suffix}`);
            if (summary) summary.innerHTML = (data.summary || []).map(s => `<li>${escapeHTML(s)}</li>`).join('');
        };
        update('me', traits.ME);
        update('partner', traits.PARTNER);
    };

    const formatTime = (seconds) => {
        if (!seconds || seconds < 0) return "N/A";
        if (seconds < 60) return `${Math.round(seconds)}s`;
        const mins = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        return `${mins}m ${secs}s`;
    };

    const renderEngagement = (stats) => {
        const el = document.getElementById('engagement-list');
        if (!el) return;
        const init = stats.initiator_ratio || { me_count: 0, partner_count: 0 };
        const myNameSafe = escapeHTML(activeData.my_name);
        const partnerNameSafe = escapeHTML(activeData.partner_name);
        const starter = init.me_initiations > init.partner_initiations ? myNameSafe : partnerNameSafe;
        el.innerHTML = `
            <div class="flex justify-between"><span>Chat Starter</span><span class="pill-label pill-label--purple">${starter}</span></div>
            <div class="flex justify-between"><span>Mirroring</span><span class="font-black">${escapeHTML(stats.mirroring || 0)}%</span></div>
            <div class="flex justify-between"><span>Max Inactivity</span><span class="font-black">${escapeHTML(stats.max_inactivity || "N/A")} days</span></div>
            <div class="flex justify-between"><span>Avg Response (${myNameSafe})</span><span class="font-black">${escapeHTML(formatTime(init.me_latency_avg))}</span></div>
            <div class="flex justify-between"><span>Avg Response (${partnerNameSafe})</span><span class="font-black">${escapeHTML(formatTime(init.partner_latency_avg))}</span></div>
        `;
    };

    const renderEmoji = (stats) => {
        const container = document.getElementById('emoji-container');
        if (!container) return;
        const emojis = [...(stats.emoji_frequency?.ME || []), ...(stats.emoji_frequency?.PARTNER || [])].sort((a,b)=>b.count-a.count).slice(0, 8);
        container.innerHTML = emojis.map(e => `<div class="flex align-center gap-3"><span>${escapeHTML(e.emoji)}</span><div class="flex-1 h-2 bg-cream rounded-full overflow-hidden"><div class="h-full bg-pink" style="width:${escapeHTML((e.count / emojis[0].count * 100))}%"></div></div></div>`).join('');
    };

    const renderStreaks = (stats) => {
        const container = document.getElementById('streaks-container');
        if (!container) return;
        const s = stats.streaks || { longest: 0, current: 0 };
        container.innerHTML = `
            <div class="card p-4 bg-cream text-center"><p class="text-xs uppercase op-50">Longest Streak</p><p class="text-xl font-black">${escapeHTML(s.longest)} days</p></div>
            <div class="card p-4 bg-cream text-center"><p class="text-xs uppercase op-50">Current Streak</p><p class="text-xl font-black">${escapeHTML(s.current)} days</p></div>
        `;
    };

    const renderWordCloud = (stats) => {
        const container = document.getElementById('wordcloud-container');
        if (!container) return;
        const words = stats.top_words || [];
        if (!words.length) { container.innerHTML = '<p class="op-30">No data</p>'; return; }
        const max = words[0].count;
        container.innerHTML = `<div class="flex flex-wrap justify-center p-4 gap-4">${words.slice(0, 20).map(w => `<span style="font-size:${escapeHTML(0.8 + (w.count/max)*1.5)}rem; font-weight:900; opacity:${escapeHTML(0.4 + (w.count/max)*0.6)}">${escapeHTML(w.word)}</span>`).join('')}</div>`;
    };

    // --- CHART LOGIC ---
    let ratioChart = null;
    let activityChart = null;

    const initRatioChart = (stats) => {
        const ctx = document.getElementById('ratioChart')?.getContext('2d');
        if (!ctx) return;
        if (ratioChart) ratioChart.destroy();
        ratioChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [activeData.my_name, activeData.partner_name],
                datasets: [{
                    data: [stats.messages?.ME || 0, stats.messages?.PARTNER || 0],
                    backgroundColor: ['#000', '#FF4081'],
                    borderWidth: 0
                }]
            },
            options: { cutout: '70%', plugins: { legend: { position: 'bottom' } } }
        });
    };

    const initActivityChart = (weeks) => {
        const ctx = document.getElementById('activityChart')?.getContext('2d');
        if (!ctx) return;
        if (activityChart) activityChart.destroy();
        activityChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: weeks.map(w => w.week_start),
                datasets: [
                    { label: activeData.my_name, data: weeks.map(w => w.me_count), backgroundColor: '#000' },
                    { label: activeData.partner_name, data: weeks.map(w => w.partner_count), backgroundColor: '#FF4081' }
                ]
            },
            options: { scales: { x: { stacked: true }, y: { stacked: true } } }
        });
    };

    window.switchTab = (type, mode) => {
        const btns = event.target.parentElement.querySelectorAll('.tab-btn');
        btns.forEach(b => b.classList.remove('active'));
        event.target.classList.add('active');
        
        if (type === 'ratio') {
            const s = activeData.stats || {};
            const data = {
                messages: [s.messages?.ME || 0, s.messages?.PARTNER || 0],
                words: [s.words?.ME || 0, s.words?.PARTNER || 0],
                chars: [s.chars?.ME || 0, s.chars?.PARTNER || 0]
            };
            if (ratioChart) {
                ratioChart.data.datasets[0].data = data[mode];
                ratioChart.update();
            }
        }
    };

    const autoTriggerAi = () => {
        const provider = localStorage.getItem('llm_provider') || 'cloudflare';
        const hasKey = sessionStorage.getItem('_llm_token');
        if (provider === 'cloudflare' || hasKey) {
            console.log("Auto-triggering AI insights...");
            setTimeout(() => {
                document.getElementById('generateAiBtn')?.click();
            }, 1000);
        }
    };

    // --- COMPARISON SLOTS ---
    if (isCompareMode) {
        const slotA = document.getElementById('comp-slot-a');
        const slotB = document.getElementById('comp-slot-b');
        slotA?.addEventListener('click', () => {
            activeSlot = 'a'; activeData = dataA;
            window.activeData = activeData;
            slotA.classList.add('active'); slotB.classList.remove('active');
            refreshAll();
        });
        slotB?.addEventListener('click', () => {
            activeSlot = 'b'; activeData = dataB;
            window.activeData = activeData;
            slotB.classList.add('active'); slotA.classList.remove('active');
            refreshAll();
        });
    }

    refreshAll();
    autoTriggerAi();

    // --- AI INSIGHTS ---
    const generateBtn = document.getElementById('generateAiBtn');
    generateBtn?.addEventListener('click', async () => {
        const permission = document.getElementById('ai-permission-container');
        const loading = document.getElementById('ai-loading-container');
        const results = document.getElementById('ai-results-container');
        
        permission.classList.add('hidden');
        loading.classList.remove('hidden');

        try {
            const payload = {
                stats: activeData.stats,
                my_name: activeData.my_name,
                partner_name: activeData.partner_name,
                compare_data: isCompareMode ? { a: dataA.stats, b: dataB.stats, nameA: dataA.partner_name, nameB: dataB.partner_name } : null,
                provider: localStorage.getItem('llm_provider') || 'cloudflare',
                api_key: sessionStorage.getItem('_llm_token') ? atob(sessionStorage.getItem('_llm_token')) : ''
            };

            const resp = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await resp.json();
            if (!resp.ok) throw new Error(data.error || "Failed");

            const report = data.report;
            window.llmReport = report; // RESTORED: For Vibe Card
            document.getElementById('ai-insight-title').textContent = report.ai_insight?.dynamic_title || "Analysis Complete";
            document.getElementById('ai-insight-reality').textContent = report.ai_insight?.reality_check;
            document.getElementById('ai-insight-shift').textContent = report.ai_insight?.recent_shift;
            document.getElementById('ai-insight-verdict').textContent = report.ai_insight?.brutal_verdict;
            
            const red = document.getElementById('ai-insight-red-flags');
            const green = document.getElementById('ai-insight-green-flags');
            if (red) red.innerHTML = (report.ai_insight?.red_flags || []).map(f => `<li>${escapeHTML(f)}</li>`).join('');
            if (green) green.innerHTML = (report.ai_insight?.green_flags || []).map(f => `<li>${escapeHTML(f)}</li>`).join('');

            loading.classList.add('hidden');
            results.classList.remove('hidden');
        } catch (e) {
            alert(e.message);
            loading.classList.add('hidden');
            permission.classList.remove('hidden');
        }
    });
});

/**
 * Premium Vibe Card Generation (Vertical Format)
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
        
        const setVal = (id, val) => { 
            const el = document.getElementById(id); 
            if (el) el.textContent = val || '--';
        };

        setVal('share-label', report.ai_insight?.vibe_label || "VIBE STATUS");
        setVal('share-title', report.ai_insight?.dynamic_title || report.relationship_persona);
        setVal('share-me', window.activeData?.my_name || "You");
        setVal('share-partner', window.activeData?.partner_name || "Partner");
        
        // Duration and Total from stats
        const stats = window.activeData?.stats || {};
        setVal('share-total', (stats.messages?.ME + stats.messages?.PARTNER || 0).toLocaleString());
        setVal('share-duration', stats.duration || '--');
        setVal('share-red', report.ai_insight?.red_flags ? report.ai_insight.red_flags[0] : '--');
        setVal('share-green', report.ai_insight?.green_flags ? report.ai_insight.green_flags[0] : '--');
        setVal('share-verdict', report.ai_insight?.brutal_verdict || "The vibe is set.");

        // Update Bars
        const meTotal = (stats.messages?.ME || 0);
        const partnerTotal = (stats.messages?.PARTNER || 0);
        const total = meTotal + partnerTotal;
        const mePct = total > 0 ? (meTotal / total * 100) : 50;
        
        document.getElementById('share-bar-me').style.width = mePct + '%';
        document.getElementById('share-bar-partner').style.width = (100 - mePct) + '%';

        const canvas = await html2canvas(card, {
            scale: 2,
            backgroundColor: "#FFF8F0",
            logging: false,
            useCORS: true,
            allowTaint: true
        });

        const link = document.createElement('a');
        link.download = `TheAlgorithm_Wrapped.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (err) {
        console.error("Download failed:", err);
        alert('Download failed.');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

// Wrap text utility for Canvas API
function wrapText(context, text, x, y, maxWidth, lineHeight) {
    if (!text) return;
    const words = text.split(' ');
    let line = '';

    for(let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = context.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        context.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      }
      else {
        line = testLine;
      }
    }
    context.fillText(line, x, y);
}

function generateShareCard(analysisData) {
    if (!analysisData) {
        console.error("No analysis data provided");
        return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630; // OG image dimensions
    const ctx = canvas.getContext('2d');

    // Dark gradient background
    const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
    gradient.addColorStop(0, '#1a0a2e');
    gradient.addColorStop(1, '#0f0a1e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 630);

    // Logo / branding
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Inter, sans-serif';
    ctx.fillText('The Algorithm', 60, 100);

    // Health score
    ctx.fillStyle = '#a855f7';
    ctx.font = 'bold 120px Inter, sans-serif';
    ctx.fillText(`${analysisData.health_score || '--'}`, 60, 260);
    ctx.fillStyle = '#ffffff80';
    ctx.font = '32px Inter, sans-serif';
    ctx.fillText('relationship health score', 60, 310);

    // Top insight
    ctx.fillStyle = '#ffffff';
    ctx.font = '28px Inter, sans-serif';
    wrapText(ctx, analysisData.top_insight || 'Everything looks solid.', 60, 400, 1080, 40);

    // Footer
    ctx.fillStyle = '#ffffff40';
    ctx.font = '24px Inter, sans-serif';
    ctx.fillText('thealgorithm.rixabh.workers.dev', 60, 590);

    return canvas.toDataURL('image/png');
}

document.addEventListener('DOMContentLoaded', () => {
    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            const data = window.activeData || {};
            const report = window.llmReport || {};
            const insight = report.ai_insight?.brutal_verdict || report.ai_insight?.dynamic_title || report.relationship_persona;

            const imageData = generateShareCard({
                health_score: report.compatibility_score,
                top_insight: insight
            });

            if (imageData) {
                const link = document.createElement('a');
                link.download = 'my-algorithm-results.png';
                link.href = imageData;
                link.click();
            }
        });
    }
});

function generateShareUrl() {
    const btn = document.getElementById('shareUrlBtn');
    if (!btn || !window.activeData) return;

    const originalText = btn.textContent;
    btn.textContent = "COPIED!";

    // Privacy boundary: Only include aggregate, anonymous stats.
    // No message contents or identifiable structures.
    const shareData = {
        my_name: "Person 1",
        partner_name: "Person 2",
        stats: {
            messages: window.activeData.stats?.messages,
            duration: window.activeData.stats?.duration,
            behavioral_traits: window.activeData.stats?.behavioral_traits
        },
        share_report: window.llmReport ? {
            title: window.llmReport.ai_insight?.dynamic_title || "Vibe Checked",
            reality: window.llmReport.ai_insight?.reality_check || "Anonymous share.",
            shift: window.llmReport.ai_insight?.recent_shift || "Stable.",
            verdict: window.llmReport.ai_insight?.brutal_verdict || "It is what it is.",
            red: window.llmReport.ai_insight?.red_flags?.[0],
            green: window.llmReport.ai_insight?.green_flags?.[0]
        } : null
    };

    const encoded = btoa(encodeURIComponent(JSON.stringify(shareData)));
    const shareUrl = `${window.location.origin}/dashboard.html#share=${encoded}`;

    navigator.clipboard.writeText(shareUrl).then(() => {
        setTimeout(() => {
            btn.textContent = originalText;
        }, 2000);
    }).catch(err => {
        console.error("Clipboard write failed", err);
        alert("Failed to copy URL");
        btn.textContent = originalText;
    });
}
