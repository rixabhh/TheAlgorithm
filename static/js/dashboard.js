/**
 * The Algorithm - Dashboard Controller (V10.0 Premium Comparison)
 */

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const isCompareMode = urlParams.get('mode') === 'compare';
    
    let dataA = null;
    let dataB = null;
    let activeData = null;
    let activeSlot = 'a';

    // 1. DATA LOADING
    if (isCompareMode) {
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
        renderHumor(stats);
        renderGhosting(stats);
        
        if (window.Chart) {
            initRatioChart(stats);
            initActivityChart(stats.weekly_data || []);
            initMoodChart(stats.weekly_data || []);
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
            if (pills) pills.innerHTML = (data.highlights || []).map(h => `<span class="pill-label pill-label--pink" style="font-size:0.6rem">${h.label}: ${h.count}</span>`).join('');
            const summary = document.getElementById(`traits-summary-${suffix}`);
            if (summary) summary.innerHTML = (data.summary || []).map(s => `<li>${s}</li>`).join('');
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
        el.innerHTML = `
            <div class="flex justify-between"><span>Chat Starter</span><span class="pill-label pill-label--purple">${init.me_initiations > init.partner_initiations ? activeData.my_name : activeData.partner_name}</span></div>
            <div class="flex justify-between"><span>Mirroring</span><span class="font-black">${stats.mirroring || 0}%</span></div>
            <div class="flex justify-between"><span>Max Inactivity</span><span class="font-black">${stats.max_inactivity || "N/A"} days</span></div>
            <div class="flex justify-between"><span>Avg Response (${activeData.my_name})</span><span class="font-black">${formatTime(init.me_latency_avg)}</span></div>
            <div class="flex justify-between"><span>Avg Response (${activeData.partner_name})</span><span class="font-black">${formatTime(init.partner_latency_avg)}</span></div>
        `;
    };

    const renderEmoji = (stats) => {
        const container = document.getElementById('emoji-container');
        if (!container) return;
        const emojis = [...(stats.emoji_frequency?.ME || []), ...(stats.emoji_frequency?.PARTNER || [])].sort((a,b)=>b.count-a.count).slice(0, 8);
        container.innerHTML = emojis.map(e => `<div class="flex align-center gap-3"><span>${e.emoji}</span><div class="flex-1 h-2 bg-cream rounded-full overflow-hidden"><div class="h-full bg-pink" style="width:${(e.count / emojis[0].count * 100)}%"></div></div></div>`).join('');
    };

    const renderStreaks = (stats) => {
        const container = document.getElementById('streaks-container');
        if (!container) return;
        const s = stats.streaks || { longest: 0, current: 0 };
        container.innerHTML = `
            <div class="card p-4 bg-cream text-center"><p class="text-xs uppercase op-50">Longest Streak</p><p class="text-xl font-black">${s.longest} days</p></div>
            <div class="card p-4 bg-cream text-center"><p class="text-xs uppercase op-50">Current Streak</p><p class="text-xl font-black">${s.current} days</p></div>
        `;
    };

    const renderHumor = (stats) => {
        const container = document.getElementById('humor-container');
        if (!container) return;
        const h = stats.humor || { ME: 0, PARTNER: 0, total: 0 };
        if (h.total === 0) {
            container.innerHTML = '<p class="op-30">No laughs detected.</p>';
            return;
        }
        container.innerHTML = `
            <div class="flex justify-between mb-2"><span>${activeData.my_name} Laughs</span><span class="font-black">${h.ME}</span></div>
            <div class="flex justify-between mb-4"><span>${activeData.partner_name} Laughs</span><span class="font-black">${h.PARTNER}</span></div>
            <div style="height: 8px; display: flex; border-radius: 4px; overflow: hidden; border: 1px solid var(--black)">
                <div style="width: ${(h.ME / h.total) * 100}%; background: var(--black)"></div>
                <div style="width: ${(h.PARTNER / h.total) * 100}%; background: var(--pink)"></div>
            </div>
        `;
    };

    const renderGhosting = (stats) => {
        const container = document.getElementById('ghosting-container');
        if (!container) return;
        const g = stats.ghosting || { count: 0, longest_days: 0, breakers: { ME: 0, PARTNER: 0 } };
        container.innerHTML = `
            <div class="flex justify-between mb-2"><span>Total Ghosting Periods (>24h)</span><span class="font-black">${g.count}</span></div>
            <div class="flex justify-between mb-4"><span>Longest Silence</span><span class="font-black">${g.longest_days} days</span></div>
            <div class="text-xs uppercase op-50 mb-1">Silence Breakers</div>
            <div class="flex justify-between mb-1"><span>${activeData.my_name} broke silence</span><span class="font-black">${g.breakers.ME} times</span></div>
            <div class="flex justify-between"><span>${activeData.partner_name} broke silence</span><span class="font-black">${g.breakers.PARTNER} times</span></div>
        `;
    };

    const renderWordCloud = (stats) => {
        const container = document.getElementById('wordcloud-container');
        if (!container) return;
        const words = stats.top_words || [];
        if (!words.length) { container.innerHTML = '<p class="op-30">No data</p>'; return; }
        const max = words[0].count;
        container.innerHTML = `<div class="flex flex-wrap justify-center p-4 gap-4">${words.slice(0, 20).map(w => `<span style="font-size:${0.8 + (w.count/max)*1.5}rem; font-weight:900; opacity:${0.4 + (w.count/max)*0.6}">${w.word}</span>`).join('')}</div>`;
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

    let moodChart = null;
    const initMoodChart = (weeks) => {
        const ctx = document.getElementById('moodChart')?.getContext('2d');
        if (!ctx) return;
        if (moodChart) moodChart.destroy();
        
        const labels = weeks.map(w => w.week_start);
        const data = weeks.map(w => w.mean_sentiment);
        
        moodChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Sentiment Score',
                    data: data,
                    fill: true,
                    borderColor: '#222',
                    tension: 0.4,
                    segment: {
                        borderColor: ctx => ctx.p0.parsed.y >= 0 ? '#10B981' : '#EF4444',
                        backgroundColor: ctx => ctx.p0.parsed.y >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'
                    }
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: { display: false }
                    },
                    y: {
                        min: -1,
                        max: 1,
                        ticks: {
                            callback: function(value) {
                                if (value === 1) return 'Positive Mode';
                                if (value === 0) return 'Neutral';
                                if (value === -1) return 'Tension';
                                return '';
                            }
                        }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
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
                connection_type: activeData.connection_type || 'romantic',
                language: activeData.language || 'english',
                context: activeData.context || '',
                tone: activeData.tone || 'balanced',
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
            document.getElementById('ai-insight-patterns').textContent = report.ai_insight?.communication_patterns;
            document.getElementById('ai-insight-verdict').textContent = report.ai_insight?.brutal_verdict;
            
            const red = document.getElementById('ai-insight-red-flags');
            const green = document.getElementById('ai-insight-green-flags');
            if (red) red.innerHTML = (report.ai_insight?.red_flags || []).map(f => `<li>${f}</li>`).join('');
            if (green) green.innerHTML = (report.ai_insight?.green_flags || []).map(f => `<li>${f}</li>`).join('');

            loading.classList.add('hidden');
            results.classList.remove('hidden');

            // Reset Chat History on new generation
            window.coachingChatHistory = [];
            const chatHistoryEl = document.getElementById('coaching-chat-history');
            if (chatHistoryEl) {
                chatHistoryEl.innerHTML = `
                <div class="chat-message ai text-sm" style="align-self: flex-start; background: var(--white); border: 2px solid var(--black); box-shadow: 2px 2px 0 0 var(--black); padding: 0.5rem 1rem; border-radius: 12px 12px 12px 0; max-width: 85%;">
                    <strong>Coach:</strong> Based on the data, what do you want me to expand on? I can break down response times, shift in vibe, or give advice.
                </div>`;
            }

        } catch (e) {
            if (e.message && e.message.includes('Free tier limit')) {
                alert("Cloudflare free tier limit reached (2 requests per hour). Please try again later or configure your own API key in the settings to generate immediately.");
            } else {
                alert("Analysis Error: " + e.message);
            }
            loading.classList.add('hidden');
            permission.classList.remove('hidden');
        }
    });

    // --- COACHING CHAT LOGIC ---
    const chatForm = document.getElementById('coaching-chat-form');
    chatForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const inputEl = document.getElementById('coaching-chat-input');
        const submitBtn = document.getElementById('coaching-chat-submit');
        const historyEl = document.getElementById('coaching-chat-history');
        
        const text = inputEl.value.trim();
        if (!text) return;

        // Append User Message
        const userMsg = document.createElement('div');
        userMsg.className = 'chat-message user text-sm';
        userMsg.style.cssText = 'align-self: flex-end; background: var(--pink); border: 2px solid var(--black); box-shadow: 2px 2px 0 0 var(--black); padding: 0.5rem 1rem; border-radius: 12px 12px 0 12px; max-width: 85%; font-weight: 500;';
        userMsg.innerHTML = `<strong>You:</strong> ${text}`;
        historyEl.appendChild(userMsg);
        
        inputEl.value = '';
        inputEl.disabled = true;
        submitBtn.disabled = true;
        submitBtn.textContent = '...';

        // Append Loading
        const loadMsg = document.createElement('div');
        loadMsg.className = 'chat-message ai text-sm loading-msg';
        loadMsg.style.cssText = 'align-self: flex-start; background: var(--white); border: 2px solid var(--black); padding: 0.5rem 1rem; border-radius: 12px 12px 12px 0; max-width: 85%; opacity: 0.6;';
        loadMsg.innerHTML = `<em>Coach is typing...</em>`;
        historyEl.appendChild(loadMsg);
        historyEl.scrollTop = historyEl.scrollHeight;

        try {
            const provider = localStorage.getItem('llm_provider') || 'cloudflare';
            const payload = {
                stats: activeData.stats,
                llmReport: window.llmReport,
                chat_history: window.coachingChatHistory || [],
                message: text,
                provider: provider,
                api_key: sessionStorage.getItem('_llm_token') ? atob(sessionStorage.getItem('_llm_token')) : ''
            };

            const resp = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await resp.json();
            
            if (!window.coachingChatHistory) window.coachingChatHistory = [];
            window.coachingChatHistory.push({ role: 'user', content: text });

            loadMsg.remove();

            if (!resp.ok) throw new Error(data.error || "Failed context");

            // Format linebreaks correctly for HTML display
            const formattedText = data.text.replace(/\n/g, '<br>');

            // Append Coach Message
            const coachMsg = document.createElement('div');
            coachMsg.className = 'chat-message ai text-sm';
            coachMsg.style.cssText = 'align-self: flex-start; background: var(--white); border: 2px solid var(--black); box-shadow: 2px 2px 0 0 var(--black); padding: 0.5rem 1rem; border-radius: 12px 12px 12px 0; max-width: 85%; line-height: 1.5; font-weight: 500;';
            coachMsg.innerHTML = `<strong>Coach:</strong> ${formattedText}`;
            historyEl.appendChild(coachMsg);
            
            window.coachingChatHistory.push({ role: 'assistant', content: data.text });
        } catch (err) {
            loadMsg.remove();
            const errMsg = document.createElement('div');
            errMsg.className = 'chat-message error text-sm';
            errMsg.style.cssText = 'align-self: center; background: #ffcc00; border: 2px solid #000; padding: 0.5rem 1rem; font-weight: 700;';
            errMsg.innerHTML = `Error: ${err.message}`;
            historyEl.appendChild(errMsg);
        } finally {
            inputEl.disabled = false;
            submitBtn.disabled = false;
            submitBtn.textContent = 'Ask';
            inputEl.focus();
            historyEl.scrollTop = historyEl.scrollHeight;
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

