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
        
        const stats = window.activeData?.stats || {};
        const meTotal = (stats.messages?.ME || 0);
        const partnerTotal = (stats.messages?.PARTNER || 0);
        const mePct = Math.round((meTotal / (meTotal + partnerTotal || 1)) * 100);

        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1920;
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = '#FFF8F0';
        ctx.fillRect(0, 0, 1080, 1920);

        // Border
        ctx.lineWidth = 20;
        ctx.strokeStyle = '#000000';
        ctx.strokeRect(10, 10, 1060, 1900);

        // Header
        ctx.fillStyle = '#000000';
        ctx.fillRect(60, 60, 960, 100);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 40px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.letterSpacing = "0.2em";
        ctx.fillText('THE ALGORITHM', 540, 110);

        // Title box
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(60, 200, 960, 300);
        ctx.lineWidth = 12;
        ctx.strokeStyle = '#000000';
        ctx.strokeRect(60, 200, 960, 300);
        // Box shadow effect
        ctx.fillStyle = '#000000';
        ctx.fillRect(80, 500, 960, 20);
        ctx.fillRect(1020, 220, 20, 300);

        // Label inside title box
        ctx.fillStyle = '#000000';
        ctx.fillRect(100, 240, 200, 50);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 24px sans-serif';
        ctx.letterSpacing = "0px";
        ctx.textAlign = 'left';
        ctx.fillText(report.ai_insight?.vibe_label || "VIBE STATUS", 120, 265);

        // Title text
        ctx.fillStyle = '#000000';
        ctx.font = '900 80px sans-serif';
        ctx.fillText(report.ai_insight?.dynamic_title || report.relationship_persona || "Analysis", 100, 370);

        ctx.fillStyle = '#666666';
        ctx.font = '32px sans-serif';
        ctx.fillText(`Between Person 1 & Person 2`, 100, 440);

        // Stats grid
        const drawStatBox = (x, y, w, h, label, labelColor, value) => {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(x, y, w, h);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 12;
            ctx.strokeRect(x, y, w, h);
            ctx.fillStyle = '#000000';
            ctx.fillRect(x + 20, y + h, w, 20);
            ctx.fillRect(x + w, y + 20, 20, h);

            ctx.fillStyle = labelColor;
            ctx.font = '900 24px sans-serif';
            ctx.fillText(label.toUpperCase(), x + 40, y + 60);
            ctx.fillStyle = '#000000';
            ctx.font = '900 70px sans-serif';
            ctx.fillText(value, x + 40, y + 140);
        };

        drawStatBox(60, 560, 460, 200, 'Total Messages', '#FF4081', (meTotal + partnerTotal).toLocaleString());
        drawStatBox(560, 560, 460, 200, 'Duration', '#7C4DFF', stats.duration || '--');

        // Message Share
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(60, 820, 960, 200);
        ctx.strokeRect(60, 820, 960, 200);
        ctx.fillStyle = '#000000';
        ctx.fillRect(80, 1020, 960, 20);
        ctx.fillRect(1020, 840, 20, 200);

        ctx.font = '900 24px sans-serif';
        ctx.fillText('MESSAGE SHARE', 100, 880);
        
        // Bar
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 8;
        ctx.strokeRect(100, 920, 880, 60);
        ctx.fillStyle = '#000000';
        ctx.fillRect(100, 920, 880 * (mePct / 100), 60);
        ctx.fillStyle = '#FF4081';
        ctx.fillRect(100 + 880 * (mePct / 100), 920, 880 * ((100 - mePct) / 100), 60);

        // Flags grid
        const drawFlagBox = (x, y, w, h, bg, label, value) => {
            ctx.fillStyle = bg;
            ctx.fillRect(x, y, w, h);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 12;
            ctx.strokeRect(x, y, w, h);
            ctx.fillStyle = '#000000';
            ctx.fillRect(x + 20, y + h, w, 20);
            ctx.fillRect(x + w, y + 20, 20, h);

            ctx.fillStyle = '#000000';
            ctx.font = '900 24px sans-serif';
            ctx.fillText(label, x + 40, y + 60);

            // Text wrap
            ctx.font = '700 28px sans-serif';
            const words = value.split(' ');
            let line = '';
            let ly = y + 110;
            for(let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + ' ';
                const metrics = ctx.measureText(testLine);
                if (metrics.width > w - 80 && n > 0) {
                    ctx.fillText(line, x + 40, ly);
                    line = words[n] + ' ';
                    ly += 35;
                } else {
                    line = testLine;
                }
            }
            ctx.fillText(line, x + 40, ly);
        };

        drawFlagBox(60, 1080, 460, 240, '#ffcccc', '🚩 RED FLAG', report.ai_insight?.red_flags ? report.ai_insight.red_flags[0] : '--');
        drawFlagBox(560, 1080, 460, 240, '#ccffcc', '✅ GREEN FLAG', report.ai_insight?.green_flags ? report.ai_insight.green_flags[0] : '--');

        // Final Word
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.roundRect(60, 1380, 960, 340, 20);
        ctx.fill();
        
        ctx.fillStyle = '#FFD600';
        ctx.font = '900 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('THE FINAL WORD', 540, 1440);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 40px sans-serif';
        const verdict = report.ai_insight?.brutal_verdict || "The vibe is set.";
        const vWords = verdict.split(' ');
        let vLine = '';
        let vLy = 1520;
        for(let n = 0; n < vWords.length; n++) {
            const testLine = vLine + vWords[n] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > 800 && n > 0) {
                ctx.fillText(vLine, 540, vLy);
                vLine = vWords[n] + ' ';
                vLy += 50;
            } else {
                vLine = testLine;
            }
        }
        ctx.fillText(`"${vLine.trim()}"`, 540, vLy);

        // Footer
        ctx.fillStyle = '#000000';
        ctx.font = '900 28px sans-serif';
        ctx.letterSpacing = "0.1em";
        ctx.fillText('WWW.THEALGORITHM.RIXABH.WORKERS.DEV', 540, 1820);

        // Dashed line
        ctx.beginPath();
        ctx.setLineDash([10, 10]);
        ctx.moveTo(60, 1750);
        ctx.lineTo(1020, 1750);
        ctx.lineWidth = 4;
        ctx.stroke();

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

/**
 * Generate Base64 Shareable URL
 */
function copyShareUrl() {
    try {
        const stats = window.activeData?.stats || {};
        const report = window.llmReport || {};

        const shareData = {
            score: report.compatibility_score || 0,
            style: report.attachment_style || "Unknown",
            title: report.ai_insight?.dynamic_title || report.relationship_persona || "Analysis",
            verdict: report.ai_insight?.brutal_verdict || "The vibe is set.",
            duration: stats.duration || '--',
            total_messages: (stats.messages?.ME || 0) + (stats.messages?.PARTNER || 0),
            me_pct: Math.round(((stats.messages?.ME || 0) / ((stats.messages?.ME || 0) + (stats.messages?.PARTNER || 0) || 1)) * 100),
            red_flag: report.ai_insight?.red_flags ? report.ai_insight.red_flags[0] : '--',
            green_flag: report.ai_insight?.green_flags ? report.ai_insight.green_flags[0] : '--',
            my_name: "Person 1",
            partner_name: "Person 2"
        };

        const shareUrl = `${window.location.origin}/share#${btoa(encodeURIComponent(JSON.stringify(shareData)))}`;

        navigator.clipboard.writeText(shareUrl).then(() => {
            alert('Share URL copied to clipboard! (Privacy note: It contains only anonymous statistics, no raw chat content)');
        });
    } catch(err) {
        console.error('Failed to generate share URL', err);
        alert('Failed to generate share URL.');
    }
}
