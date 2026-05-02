/**
 * The Algorithm - Dashboard Controller (V10.0 Premium Comparison)
 * Note: escapeHTML is provided by dashboard_utils.js (loaded first)
 */

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const isCompareMode = urlParams.get('mode') === 'compare';
    
    let dataA = null;
    let dataB = null;
    let activeData = null;

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

        // Progressive Loading
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.card, .stat-card, .insight-card, .flag-box').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            observer.observe(el);
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
        document.getElementById('report-headline').textContent = isCompareMode ? 'Comparative Analysis' : `${meName} & ${partnerName}`;
        const pulse = document.getElementById('report-pulse');
        if (pulse) pulse.textContent = `${((stats.messages?.ME || 0) + (stats.messages?.PARTNER || 0)).toLocaleString()} messages · ${stats.duration || '--'} · ${activeData.platform || 'Unknown'}`;

        renderSocialDynamics(stats);
        renderEngagement(stats);
        renderStreaks(stats);
        renderWordCloud(stats);
        renderEmoji(stats);
        renderHumorAndEnergy(stats);
        renderSilenceBreakers(stats);
        renderLinks(stats);

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
        if (!emojis.length) {
            container.innerHTML = '<p class="op-30 text-xs">No emojis found</p>';
            return;
        }
        const max = emojis[0].count;
        container.innerHTML = emojis.map(e => `<div class="flex align-center gap-3"><span>${e.emoji}</span><div class="flex-1 h-2 bg-cream rounded-full overflow-hidden"><div class="h-full bg-pink" style="width:${(e.count / max * 100)}%"></div></div></div>`).join('');
    };

    const renderHumorAndEnergy = (stats) => {
        const container = document.getElementById('humor-container');
        if (!container) return;
        const laughter = stats.laughter || { ME: 0, PARTNER: 0 };
        const caps = stats.caps_lock || { ME: 0, PARTNER: 0 };

        const myName = escapeHTML(activeData.my_name);
        const partnerName = escapeHTML(activeData.partner_name);

        container.innerHTML = `
            <div class="flex justify-between"><span>Laughter (${myName})</span><span class="font-black">${escapeHTML(String(laughter.ME))}</span></div>
            <div class="flex justify-between"><span>Laughter (${partnerName})</span><span class="font-black">${escapeHTML(String(laughter.PARTNER))}</span></div>
            <div class="flex justify-between mt-2"><span>Caps Lock Energy (${myName})</span><span class="font-black">${escapeHTML(String(caps.ME))}</span></div>
            <div class="flex justify-between"><span>Caps Lock Energy (${partnerName})</span><span class="font-black">${escapeHTML(String(caps.PARTNER))}</span></div>
        `;
    };

    const renderSilenceBreakers = (stats) => {
        const container = document.getElementById('silence-container');
        if (!container) return;
        const breakers = stats.silence_breakers || { ME: 0, PARTNER: 0 };

        const myName = escapeHTML(activeData.my_name);
        const partnerName = escapeHTML(activeData.partner_name);

        container.innerHTML = `
            <div class="flex justify-between"><span>Ice Broken by ${myName}</span><span class="font-black">${escapeHTML(String(breakers.ME))} times</span></div>
            <div class="flex justify-between"><span>Ice Broken by ${partnerName}</span><span class="font-black">${escapeHTML(String(breakers.PARTNER))} times</span></div>
        `;
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

    const renderWordCloud = (stats) => {
        const container = document.getElementById('wordcloud-container');
        if (!container) return;
        const words = stats.top_words || [];
        if (!words.length) { container.innerHTML = '<p class="op-30">No data</p>'; return; }
        const max = words[0].count;
        container.innerHTML = `<div class="flex flex-wrap justify-center p-4 gap-4">${words.slice(0, 20).map(w => `<span style="font-size:${0.8 + (w.count/max)*1.5}rem; font-weight:900; opacity:${0.4 + (w.count/max)*0.6}">${w.word}</span>`).join('')}</div>`;
    };

    const renderLinks = (stats) => {
        const container = document.getElementById('links-container');
        if (!container) return;
        const links = stats.links || { total: 0, top: [] };
        if (!links.total) {
            container.innerHTML = '<p class="op-30 text-xs">No links shared</p>';
            return;
        }
        container.innerHTML = `
            <p class="text-xs font-black mb-2">${links.total} links shared</p>
            ${links.top.map(l => `
                <div class="flex justify-between text-xs">
                    <span class="truncate">${escapeHTML(l.domain)}</span>
                    <span class="font-black ml-2">${l.count}</span>
                </div>
            `).join('')}
        `;
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

    window.switchTab = (e, type, mode) => {
        const btns = e.target.parentElement.querySelectorAll('.tab-btn');
        btns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
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
            activeData = dataA;
            window.activeData = activeData;
            slotA.classList.add('active'); slotB.classList.remove('active');
            refreshAll();
        });
        slotB?.addEventListener('click', () => {
            activeData = dataB;
            window.activeData = activeData;
            slotB.classList.add('active'); slotA.classList.remove('active');
            refreshAll();
        });
    }

    try {
        refreshAll();
    } catch (err) {
        console.error('Dashboard render failed:', err);
        document.querySelector('main')?.insertAdjacentHTML('afterbegin',
            `<div class="card p-6 mb-8" style="background:var(--red);color:var(--white)">
                <strong>Render error:</strong> ${escapeHTML(err.message)}.
                <a href="/" style="color:white;text-decoration:underline">Start over →</a>
             </div>`
        );
    }

    // --- AI INSIGHTS ---
    const generateBtn = document.getElementById('generateAiBtn');
    generateBtn?.addEventListener('click', async () => {
        const permission = document.getElementById('ai-permission-container');
        const loading = document.getElementById('ai-loading-container');
        const results = document.getElementById('ai-results-container');
        
        permission.classList.add('hidden');
        loading.classList.remove('hidden');

        // U-05: Rotating status messages during AI loading
        const statusMessages = ['Calculating dynamics...', 'Reading between the lines...', 'Running the algorithm...', 'Almost there...'];
        let statusIdx = 0;
        const statusEl = document.getElementById('ai-loading-status');
        const statusInterval = setInterval(() => {
            if (statusEl) statusEl.textContent = statusMessages[statusIdx++ % statusMessages.length];
        }, 3000);

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
            document.getElementById('ai-insight-verdict').textContent = report.ai_insight?.brutal_verdict;
            
            const red = document.getElementById('ai-insight-red-flags');
            const green = document.getElementById('ai-insight-green-flags');
            if (red) red.innerHTML = (report.ai_insight?.red_flags || []).map(f => `<li>${f}</li>`).join('');
            if (green) green.innerHTML = (report.ai_insight?.green_flags || []).map(f => `<li>${f}</li>`).join('');

            clearInterval(statusInterval);
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
            clearInterval(statusInterval);
            loading.classList.add('hidden');
            // M-02: Inline error recovery instead of alert()
            const errorMsg = e.message && e.message.includes('Free tier limit')
                ? 'Cloudflare free tier limit reached (2 requests per hour). Configure your own API key for unlimited access.'
                : `Analysis failed: ${escapeHTML(e.message)}`;
            permission.innerHTML = `
                <div class="text-center p-8">
                    <div style="font-size:3rem;margin-bottom:1rem">⚠️</div>
                    <h3 style="font-size:1.5rem;margin-bottom:1rem;color:var(--red)">Something went wrong</h3>
                    <p style="max-width:500px;margin:0 auto 2rem;color:var(--gray-600);line-height:1.6">${errorMsg}</p>
                    <div class="flex justify-center gap-3">
                        <button id="retryAiBtn" class="btn btn--pink">✨ Try Again</button>
                        <button onclick="document.getElementById('settingsBtn')?.click()" class="btn btn--white">⚙ Settings</button>
                    </div>
                </div>
            `;
            permission.classList.remove('hidden');
            document.getElementById('retryAiBtn')?.addEventListener('click', () => {
                permission.innerHTML = `
                    <div class="text-center p-12" style="background:var(--white);border-width:4px">
                        <div style="font-size:3rem;margin-bottom:1rem">🧠</div>
                        <h3 style="font-size:1.75rem;margin-bottom:1rem">Unlock AI-Powered Vibe Analytics</h3>
                        <div><button id="generateAiBtn" class="btn btn--pink btn--lg px-12">✨ GENERATE INSIGHTS</button></div>
                    </div>
                `;
                document.getElementById('generateAiBtn')?.click();
            });
        }
    });

    // Wire regenerate button (C-03)
    document.getElementById('regenerateBtn')?.addEventListener('click', () => {
        document.getElementById('ai-results-container')?.classList.add('hidden');
        document.getElementById('ai-permission-container')?.classList.remove('hidden');
        document.getElementById('generateAiBtn')?.click();
    });

    // Auto-trigger AI — MUST be after generateBtn listener is wired (C-04)
    autoTriggerAi();

    // --- COACHING CHAT LOGIC ---
    const chatForm = document.getElementById('coaching-chat-form');
    chatForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const inputEl = document.getElementById('coaching-chat-input');
        const submitBtn = document.getElementById('coaching-chat-submit');
        const historyEl = document.getElementById('coaching-chat-history');
        
        const text = inputEl.value.trim();
        if (!text) return;

        // S-03: Client-side soft rate limit for BYOK users
        const chatCount = parseInt(sessionStorage.getItem('_chat_count') || '0', 10);
        if (chatCount >= 50) {
            const errMsg = document.createElement('div');
            errMsg.className = 'chat-message error text-sm';
            errMsg.style.cssText = 'align-self: center; background: #ffcc00; border: 2px solid #000; padding: 0.5rem 1rem; font-weight: 700;';
            errMsg.textContent = 'Session limit reached (50 messages). Refresh the page to continue.';
            historyEl.appendChild(errMsg);
            return;
        }
        sessionStorage.setItem('_chat_count', String(chatCount + 1));

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
// eslint-disable-next-line no-unused-vars
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
        alert('Download failed.');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}



/**
 * Generates and copies a shareable URL containing anonymous statistics.
 */
document.getElementById('shareLinkBtn')?.addEventListener('click', async () => {
    const btn = document.getElementById('shareLinkBtn');
    const originalText = btn.textContent;
    btn.textContent = "⏳ Generating...";

    try {
        if (!window.activeData) throw new Error("No data to share");

        // Strip out any raw messages or content - ONLY anonymous stats
        const shareData = {
            llmReport: window.llmReport || {},
            my_name: "Person A",
            partner_name: "Person B",
            stats: {
                messages: window.activeData.stats?.messages,
                duration: window.activeData.stats?.duration,
                mirroring: window.activeData.stats?.mirroring,
                symmetry: window.activeData.stats?.symmetry,
                attachment_style: window.activeData.stats?.attachment_style,
                streaks: window.activeData.stats?.streaks,
            }
        };

        // Ensure no raw chat content accidentally slips through
        delete shareData.stats.raw_messages;

        const base64Data = btoa(encodeURIComponent(JSON.stringify(shareData)));
        const shareUrl = `${window.location.origin}/share#${base64Data}`;

        await navigator.clipboard.writeText(shareUrl);

        btn.textContent = "✅ Link Copied!";
        setTimeout(() => { btn.textContent = originalText; }, 2000);
    } catch (err) {
        btn.textContent = "❌ Failed";
        setTimeout(() => { btn.textContent = originalText; }, 2000);
    }
});

// Check if we arrived via a share link
window.addEventListener('DOMContentLoaded', () => {
    if (window.location.hash && window.location.hash.length > 10) {
        try {
            const hashData = window.location.hash.substring(1);
            const decodedStr = decodeURIComponent(atob(hashData));
            const sharedData = JSON.parse(decodedStr);

            // Override active data and hide elements that don't apply to shared view
            window.activeData = sharedData;
            window.llmReport = sharedData.llmReport;

            // Re-trigger render logic
            if (typeof refreshAll === 'function') {
                refreshAll();
            }
        } catch (e) {
            // failed to parse
        }
    }
});



/**
 * Share Card Generation
 */
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    if (!text) return;
    const words = text.split(' ');
    let line = '';

    for(let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      }
      else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);
}

function generateShareCard(analysisData) {
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
  // We use score or 0 if not present
  const score = analysisData.llmReport?.ai_insight?.health_score || '--';
  ctx.fillText(`${score}`, 60, 260);
  ctx.fillStyle = '#ffffff80';
  ctx.font = '32px Inter, sans-serif';
  ctx.fillText('relationship health score', 60, 310);

  // Top insight
  ctx.fillStyle = '#ffffff';
  ctx.font = '28px Inter, sans-serif';
  const insight = analysisData.llmReport?.ai_insight?.brutal_verdict || "Your chat data has been decoded.";
  wrapText(ctx, insight, 60, 400, 1080, 40);

  // Footer
  ctx.fillStyle = '#ffffff40';
  ctx.font = '24px Inter, sans-serif';
  ctx.fillText('thealgorithm.rixabh.workers.dev', 60, 590);

  return canvas.toDataURL('image/png');
}

// Add download image button logic (if requested by UI, assuming standard layout from prompt)
document.addEventListener('DOMContentLoaded', () => {
    // Check if we need to add a share button
    const shareImageBtn = document.getElementById('share-btn');
    if (shareImageBtn) {
        shareImageBtn.addEventListener('click', () => {
            const imageData = generateShareCard(window.activeData);
            const link = document.createElement('a');
            link.download = 'my-algorithm-results.png';
            link.href = imageData;
            link.click();
        });
    }
});
