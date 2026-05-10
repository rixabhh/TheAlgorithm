/**
 * The Algorithm - Dashboard Controller (V10.0 Premium Comparison)
 * Note: escapeHTML is provided by dashboard_utils.js (loaded first)
 */

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const isCompareMode = urlParams.get('mode') === 'compare';
    const parseSharedData = () => {
        if (!window.location.hash || window.location.hash.length <= 10) return null;
        try {
            const hashData = window.location.hash.substring(1);
            const decodedStr = decodeURIComponent(atob(hashData));
            const sharedData = JSON.parse(decodedStr);
            return {
                ...sharedData,
                platform: sharedData.platform || 'Shared Report',
                connection_type: sharedData.connection_type || 'shared'
            };
        } catch (e) {
            console.warn('Failed to parse shared report data', e);
            return null;
        }
    };
    
    let dataA = null;
    let dataB = null;
    let activeData = null;
    let isSharedMode = false;
    const providerHints = {
        cloudflare: 'Uses the configured Cloudflare Workers AI binding when available.',
        openrouter: 'Use an OpenRouter key. Recommended model is openai/gpt-4o-mini.',
        openai: 'OpenAI keys usually start with sk-.',
        anthropic: 'Anthropic keys usually start with sk-ant-.',
        gemini: 'Paste a Google AI Studio API key.',
        grok: 'Paste an xAI API key.',
        groq: 'Paste a Groq API key.',
        mistral: 'Paste a Mistral API key.',
        cohere: 'Paste a Cohere API key.'
    };
    const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
    const totalMessages = (stats) => number(stats.messages?.ME) + number(stats.messages?.PARTNER);
    const scoreText = (value, options = {}) => formatHeuristicScore(value, options);
    const scoreValue = (value, min = 5, max = 95) => clampHeuristicScore(value, min, max);
    const barWidth = (value) => `${clampVisualPercent(value)}%`;
    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };
    const persistActiveReport = () => {
        if (!activeData?.id) return;
        try {
            const key = 'algo_history';
            const history = JSON.parse(localStorage.getItem(key) || '[]');
            const next = history.map(item => item.id === activeData.id ? {
                ...item,
                ...activeData,
                llmReport: window.llmReport || item.llmReport || null,
                raw_excerpt_pack: undefined
            } : item);
            localStorage.setItem(key, JSON.stringify(next));
        } catch (err) {
            console.warn('Could not update report history', err);
        }
    };

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
        const sharedData = parseSharedData();
        const stored = sessionStorage.getItem('dashboard_data');
        if (sharedData) {
            activeData = sharedData;
            window.llmReport = sharedData.llmReport || {};
            isSharedMode = true;
        } else if (stored) {
            activeData = JSON.parse(stored);
            if (activeData.llmReport) window.llmReport = activeData.llmReport;
        } else {
            window.location.href = '/';
            return;
        }
        window.activeData = activeData; // Added
    }

    // --- NAVIGATION ---
    const setupNavigation = () => {
        const navLinks = document.querySelectorAll('.sidebar-nav a');
        const sections = document.querySelectorAll('main section');
        const updateActiveLink = () => {
            let current = '';
            sections.forEach(s => { if (window.scrollY >= s.offsetTop - 170) current = s.getAttribute('id'); });
            navLinks.forEach(l => {
                l.classList.remove('active');
                if (l.getAttribute('href').substring(1) === current) l.classList.add('active');
            });
        };
        window.addEventListener('scroll', updateActiveLink, { passive: true });
        updateActiveLink();

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

        setText('profile-name', `${meName} & ${partnerName}`);
        setText('traits-name-me', meName);
        setText('traits-name-partner', partnerName);
        setText('report-headline', isCompareMode ? 'Comparative Analysis' : `${meName} & ${partnerName}`);
        const pulse = document.getElementById('report-pulse');
        if (pulse) pulse.textContent = `${totalMessages(stats).toLocaleString()} messages - ${stats.duration || '--'} - ${activeData.platform || 'Unknown'}`;
        const historyCount = (() => {
            try { return JSON.parse(localStorage.getItem('algo_history') || '[]').length; } catch (_) { return 0; }
        })();
        setText('stats-chats-count', String(historyCount || 1));
        renderOverviewStats(stats);
        renderSourceQuality(activeData.source_quality, activeData.input_mode);
        renderPatternSignals(activeData.evidence_pack);

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
        const hasAiReport = Boolean(window.llmReport);
        const reportForSlots = window.llmReport || makeLocalEvidenceReport();
        renderAiReport(reportForSlots, { localOnly: !hasAiReport });
        document.getElementById('ai-permission-container')?.classList.add('hidden');
        document.getElementById('ai-loading-container')?.classList.add('hidden');
        document.getElementById('ai-results-container')?.classList.remove('hidden');
        if (hasAiReport) persistActiveReport();
        document.querySelectorAll('.is-loading').forEach(el => el.classList.remove('is-loading'));
    };

    const renderOverviewStats = (stats) => {
        const init = stats.initiator_ratio || {};
        const replyValues = [number(init.me_latency_avg, -1), number(init.partner_latency_avg, -1)].filter(v => v >= 0);
        const avgReply = replyValues.length ? replyValues.reduce((a, b) => a + b, 0) / replyValues.length : 0;
        setText('stat-total-messages', totalMessages(stats).toLocaleString());
        setText('stat-duration', stats.duration || '--');
        setText('stat-reply-speed', avgReply ? formatTime(avgReply) : '--');
        setText('stat-symmetry', stats.symmetry?.score !== undefined ? scoreText(stats.symmetry.score) : '--');
    };

    const renderSourceQuality = (quality = {}, inputMode = 'export') => {
        const label = {
            export: 'Export File',
            paste: 'Pasted Chat',
            screenshots: 'Screenshots',
            transcript: 'Transcript'
        }[inputMode] || activeData.platform || 'Conversation';
        setText('source-quality-title', `${label} - ${quality.parsed_count || totalMessages(activeData.stats || {})} parsed messages`);
        setText('source-quality-score', quality.score !== undefined ? scoreText(quality.score) : '--');
        const warnings = quality.warnings || [];
        const privacy = activeData.privacy_mode === 'opt_in_raw'
            ? 'Deep AI raw evidence was enabled for this report.'
            : 'Stats-only AI mode: raw content stays local.';
        setText('source-quality-warnings', [privacy, ...warnings].filter(Boolean).join(' '));
    };

    const renderPatternSignals = (evidencePack = {}) => {
        const container = document.getElementById('pattern-signal-container');
        if (!container) return;
        const counts = evidencePack.pattern_counts || {};
        const items = [
            ['Unanswered Questions', counts.unanswered_questions || 0, 'Questions that got short answers, deflections, or topic switches.'],
            ['Conflict Delays', counts.delayed_after_conflict || 0, 'Tense messages followed by long silence or delayed replies.'],
            ['Pressure Language', counts.boundary_pressure || 0, 'Blame, pressure, or always/never framing.'],
            ['Repair Attempts', counts.repair_attempts || 0, 'Apology, repair, or reconnection language.']
        ];
        container.innerHTML = items.map(([label, value, desc], index) => `
            <div class="card p-4" style="background:${index % 2 ? 'var(--white)' : 'var(--cream)'};border-width:3px">
                <span class="pill-label ${value > 3 ? 'pill-label--pink' : 'pill-label--purple'}" style="font-size:.58rem">${value > 3 ? 'watch' : 'signal'}</span>
                <div style="font-family:var(--font-heading);font-size:2.4rem;font-weight:900;line-height:1;margin:.65rem 0;color:var(--purple)">${escapeHTML(String(value))}</div>
                <h3 style="font-size:1rem;margin:0 0 .35rem">${escapeHTML(label)}</h3>
                <p class="text-xs color-gray-500" style="margin:0">${escapeHTML(desc)}</p>
            </div>
        `).join('');
    };

    const renderSocialDynamics = (stats) => {
        const traits = stats.behavioral_traits || { ME: {}, PARTNER: {} };
        const update = (suffix, data) => {
            data = data || {};
            const scores = data.scores || {};
            ['curiosity', 'politeness', 'warmth', 'intimacy'].forEach(t => {
                const val = scoreValue(scores[t] || 0);
                const el = document.getElementById(`trait-val-${t}-${suffix}`);
                if (el) el.textContent = scoreText(val);
                const bar = document.getElementById(`trait-bar-${t}-${suffix}`);
                if (bar) bar.style.width = barWidth(val);
            });
            const pills = document.getElementById(`traits-pills-${suffix}`);
            if (pills) pills.innerHTML = (data.highlights || []).map(h => `<span class="pill-label pill-label--pink" style="font-size:0.6rem">${escapeHTML(h.label)}: ${escapeHTML(String(h.count))}</span>`).join('');
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
        const init = {
            me_initiations: 0,
            partner_initiations: 0,
            me_latency_avg: 0,
            partner_latency_avg: 0,
            ...(stats.initiator_ratio || {})
        };
        const starter = init.me_initiations === init.partner_initiations
            ? 'Balanced'
            : (init.me_initiations > init.partner_initiations ? activeData.my_name : activeData.partner_name);
        el.innerHTML = `
            <div class="flex justify-between"><span>Chat Starter</span><span class="pill-label pill-label--purple">${escapeHTML(starter)}</span></div>
            <div class="flex justify-between"><span>Threads Started</span><span class="font-black">${init.me_initiations} / ${init.partner_initiations}</span></div>
            <div class="flex justify-between"><span>Mirroring</span><span class="font-black">${scoreText(stats.mirroring || 0)}</span></div>
            <div class="flex justify-between"><span>Symmetry</span><span class="font-black">${escapeHTML(stats.symmetry?.label || 'Unknown')} (${stats.symmetry?.score !== undefined ? scoreText(stats.symmetry.score) : '--'})</span></div>
            <div class="flex justify-between"><span>Max Inactivity</span><span class="font-black">${stats.max_inactivity || "N/A"} days</span></div>
            <div class="flex justify-between"><span>Avg Response (${escapeHTML(activeData.my_name)})</span><span class="font-black">${formatTime(init.me_latency_avg)}</span></div>
            <div class="flex justify-between"><span>Avg Response (${escapeHTML(activeData.partner_name)})</span><span class="font-black">${formatTime(init.partner_latency_avg)}</span></div>
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
        container.innerHTML = emojis.map(e => `<div class="flex align-center gap-3"><span>${escapeHTML(e.emoji)}</span><div class="flex-1 h-2 bg-cream rounded-full overflow-hidden"><div class="h-full bg-pink" style="width:${barWidth(e.count / max * 100)}"></div></div></div>`).join('');
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
            <div class="card p-4 bg-cream text-center"><p class="text-xs uppercase op-50">Ending Streak</p><p class="text-xl font-black">${s.current} days</p></div>
            <div class="card p-4 bg-cream text-center"><p class="text-xs uppercase op-50">Active Days</p><p class="text-xl font-black">${formatDeterministicShare(s.active_pct ?? 0, s.days_active || 0)}</p></div>
        `;
    };

    const renderWordCloud = (stats) => {
        const container = document.getElementById('wordcloud-container');
        if (!container) return;
        const words = stats.top_words || [];
        if (!words.length) { container.innerHTML = '<p class="op-30">No data</p>'; return; }
        const max = words[0].count;
        container.innerHTML = `<div class="flex flex-wrap justify-center p-4 gap-4">${words.slice(0, 20).map(w => `<span style="font-size:${0.8 + (w.count/max)*1.5}rem; font-weight:900; opacity:${0.4 + (w.count/max)*0.6}">${escapeHTML(w.word)}</span>`).join('')}</div>`;
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
        const values = [stats.messages?.ME || 0, stats.messages?.PARTNER || 0];
        if (!values[0] && !values[1]) {
            document.getElementById('ratio-chart-container').innerHTML = '<div class="chart-empty">No ratio data available.</div>';
            return;
        }
        if (ratioChart) ratioChart.destroy();
        ratioChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [activeData.my_name, activeData.partner_name],
                datasets: [{
                    data: values,
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
        if (!weeks.length) {
            document.getElementById('activity-chart-container').innerHTML = '<div class="chart-empty">No weekly activity data available.</div>';
            return;
        }
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
        if (!weeks.length) {
            document.getElementById('mood-chart-container').innerHTML = '<div class="chart-empty">No mood timeline data available.</div>';
            return;
        }
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

    const setupProviderSettings = () => {
        const settingsBtn = document.getElementById('settingsBtn');
        const modal = document.getElementById('settingsModal');
        const closeBtn = document.getElementById('closeSettings');
        const saveBtn = document.getElementById('saveSettingsBtn');
        const providerEl = document.getElementById('llmProvider');
        const apiKeyEl = document.getElementById('apiKey');
        const hintEl = document.getElementById('providerHint');
        const apiKeyContainer = document.getElementById('apiKeyContainer');
        const rawConsentEl = document.getElementById('dashboardRawConsent');
        if (!settingsBtn || !modal || !providerEl || !apiKeyEl) return;

        const refreshHint = () => {
            const provider = providerEl.value || 'cloudflare';
            if (hintEl) hintEl.textContent = providerHints[provider] || '';
            apiKeyContainer?.classList.toggle('hidden', provider === 'cloudflare');
        };
        const showModal = () => {
            providerEl.value = localStorage.getItem('llm_provider') || 'cloudflare';
            const storedToken = sessionStorage.getItem('_llm_token');
            apiKeyEl.value = (storedToken && storedToken !== btoa('')) ? decodeURIComponent(escape(atob(storedToken))) : '';
            if (rawConsentEl) rawConsentEl.checked = activeData.privacy_mode === 'opt_in_raw';
            refreshHint();
            modal.classList.add('active');
        };
        const hideModal = () => modal.classList.remove('active');

        settingsBtn.addEventListener('click', showModal);
        closeBtn?.addEventListener('click', hideModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) hideModal(); });
        providerEl.addEventListener('change', refreshHint);
        saveBtn?.addEventListener('click', () => {
            const provider = providerEl.value || 'cloudflare';
            const key = apiKeyEl.value.trim();
            localStorage.setItem('llm_provider', provider);
            sessionStorage.setItem('_llm_token', btoa(unescape(encodeURIComponent(key))));
            if (rawConsentEl) {
                activeData.privacy_mode = rawConsentEl.checked ? 'opt_in_raw' : 'stats_only';
                window.activeData = activeData;
                sessionStorage.setItem('dashboard_data', JSON.stringify(activeData));
                renderSourceQuality(activeData.source_quality, activeData.input_mode);
            }
            hideModal();
        });
    };
    setupProviderSettings();

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
                <a href="/" style="color:white;text-decoration:underline">Start over â†’</a>
             </div>`
        );
    }

    // --- AI INSIGHTS ---
    function makeLocalEvidenceReport() {
        const stats = activeData?.stats || {};
        const evidence = activeData?.evidence_pack || {};
        const source = activeData?.source_quality || {};
        const predictive = evidence.predictive_outlook || {};
        const receipts = Array.isArray(evidence.receipts) && evidence.receipts.length ? evidence.receipts : [];
        const topReceipt = receipts[0] || {};
        const total = totalMessages(stats);
        const symmetry = stats.symmetry || {};
        const risk = Number(predictive.drop_off_risk || (100 - Number(symmetry.score || 70)));
        const headline = topReceipt.claim || (symmetry.label ? `${symmetry.label} effort pattern` : 'Conversation pattern ready');
        const nextMove = predictive.next_action || topReceipt.action || 'Pick the strongest repeated pattern and ask for one clear change.';
        return {
            relationship_persona: topReceipt.pattern ? `${String(topReceipt.pattern).replace(/_/g, ' ')} pattern` : 'Pattern read',
            compatibility_score: source.score || symmetry.score || 70,
            overall_health_score: symmetry.score || source.score || 70,
            communication_style: {
                dominant_pattern: symmetry.label || 'Pattern detected',
                tone: 'Based on local chat signals',
                balance_score: symmetry.score || source.score || 70
            },
            attachment_style: {
                person_1: 'not enough signal',
                person_2: 'not enough signal',
                compatibility_note: 'Attachment labels need AI context. Local evidence is focused on effort, timing, and repeated patterns.'
            },
            key_insights: [
                `${total.toLocaleString()} messages were analysed from ${activeData.input_mode || 'chat'} input.`,
                topReceipt.evidence || `Balance reads as ${symmetry.label || 'unclear'} from message and word-share patterns.`,
                source.warnings?.[0] || 'Confidence depends on message count, timestamps, and source quality.'
            ].filter(Boolean),
            strengths: receipts.filter(r => r.pattern === 'repair_attempts').map(r => r.claim).slice(0, 2),
            growth_areas: receipts.filter(r => r.pattern !== 'repair_attempts').map(r => r.claim).slice(0, 3),
            coaching_advice: nextMove,
            fun_fact: stats.streaks?.longest ? `Longest active streak: ${stats.streaks.longest} days.` : 'The clearest read comes from repeated behavior, not one dramatic message.',
            verdict_summary: {
                headline,
                risk_level: risk >= 65 ? 'high' : risk >= 40 ? 'medium' : 'low',
                confidence: source.score !== undefined ? scoreText(source.score) : scoreText(predictive.confidence || 60),
                best_next_move: nextMove
            },
            receipts: receipts.length ? receipts : [{
                claim: 'Local pattern map is ready',
                evidence: 'The report has enough aggregate chat data to show balance, timing, and source quality.',
                pattern: 'local_stats',
                confidence: 'medium',
                action: nextMove
            }],
            predictive_outlook: {
                stability: predictive.stability ?? (symmetry.score || 65),
                reciprocity_trend: predictive.reciprocity_trend || symmetry.label || 'unclear',
                repair_likelihood: predictive.repair_likelihood || 'unclear',
                drop_off_risk: predictive.drop_off_risk ?? Math.max(5, Math.min(95, risk)),
                conflict_recurrence_risk: predictive.conflict_recurrence_risk || 'needs AI context',
                confidence: predictive.confidence || source.score || 60,
                next_action: nextMove
            },
            ai_insight: {
                vibe_label: 'LOCAL READ',
                health_score: symmetry.score || source.score || 70,
                dynamic_title: headline.split(' ').slice(0, 4).join(' '),
                reality_check: topReceipt.evidence || 'This is the local evidence read. Generate AI for a deeper emotional interpretation.',
                recent_shift: predictive.trend ? `Recent trend appears ${predictive.trend}.` : 'Recent shift uses weekly volume, sentiment, and reply timing when timestamps are available.',
                red_flags: receipts.filter(r => r.confidence === 'high' && r.pattern !== 'repair_attempts').map(r => r.claim).slice(0, 3),
                green_flags: receipts.filter(r => r.pattern === 'repair_attempts').map(r => r.claim).slice(0, 3),
                brutal_verdict: nextMove
            }
        };
    }

    function renderAiReport(report, options = {}) {
        if (options.localOnly) window.localEvidenceReport = report || {};
        else window.llmReport = report || {};
        const ai = report?.ai_insight || {};
        const healthScore = scoreValue(Number(ai.health_score) || Number(report?.overall_health_score) || 0);
        const compatScore = scoreValue(Number(report?.compatibility_score) || 0);
        const verdict = report?.verdict_summary || {};
        const predictive = report?.predictive_outlook || activeData.evidence_pack?.predictive_outlook || {};
        const receipts = Array.isArray(report?.receipts) && report.receipts.length
            ? report.receipts
            : (activeData.evidence_pack?.receipts || []);

        setText('verdict-headline', verdict.headline || ai.dynamic_title || 'Pattern read complete');
        setText('verdict-risk', verdict.risk_level || (Number(predictive.drop_off_risk) >= 65 ? 'High' : Number(predictive.drop_off_risk) >= 40 ? 'Medium' : 'Low'));
        setText('verdict-confidence', verdict.confidence ? escapeHTML(String(verdict.confidence)).replace(/\b100%/g, '95+%') : (predictive.confidence ? scoreText(predictive.confidence) : scoreText(activeData.source_quality?.score || 60)));
        setText('verdict-next-move', verdict.best_next_move || predictive.next_action || report?.coaching_advice || '');

        const receiptEl = document.getElementById('receipt-cards');
        if (receiptEl) {
            receiptEl.innerHTML = receipts.slice(0, 6).map((r, index) => `
                <article class="receipt-card">
                    <span class="pill-label ${r.confidence === 'high' ? 'pill-label--pink' : r.confidence === 'medium' ? 'pill-label--yellow' : 'pill-label--purple'}" style="font-size:.58rem">${escapeHTML(r.confidence || 'signal')}</span>
                    <h3 class="receipt-card__claim">${escapeHTML(r.claim || `Receipt ${index + 1}`)}</h3>
                    <p class="text-sm color-gray-600">${escapeHTML(r.evidence || '')}</p>
                    <p class="text-xs font-bold uppercase color-gray-500">${escapeHTML(r.pattern || 'pattern')}</p>
                    <p class="text-sm font-bold" style="margin-bottom:0">${escapeHTML(r.action || '')}</p>
                </article>
            `).join('');
        }

        // Hero section
        setText('ai-insight-label', ai.vibe_label || `HEALTH ${healthScore}`);
        setText('ai-insight-title', ai.dynamic_title || "Analysis Complete");
        setText('ai-persona', report?.relationship_persona ? `"${report.relationship_persona}"` : '');

        // Health Score Ring (animated)
        const ring = document.getElementById('health-ring');
        const scoreNum = document.getElementById('health-score-num');
        if (ring) {
            setTimeout(() => { ring.style.setProperty('--score', String(healthScore)); }, 100);
        }
        if (scoreNum) scoreNum.textContent = healthScore ? scoreText(healthScore, { suffix: "", plusAtMax: true }) : '--';

        // Compatibility Score
        setText('compatibility-score', compatScore ? scoreText(compatScore, { suffix: "", plusAtMax: true }) : '--');

        // Reality Check + Recent Shift
        setText('ai-insight-reality', ai.reality_check || '');
        setText('ai-insight-shift', ai.recent_shift || '');
        setText('ai-insight-verdict', ai.brutal_verdict || '');
        setText('ai-insight-timestamp', `Generated ${new Date().toLocaleString()}`);

        // Communication Style
        const comm = report?.communication_style || {};
        setText('ai-comm-pattern', comm.dominant_pattern || '--');
        setText('ai-comm-tone', comm.tone ? `Tone: ${comm.tone}` : '');
        const commBalance = scoreValue(Number(comm.balance_score) || 0);
        setText('ai-comm-balance', commBalance ? scoreText(commBalance) : '--');
        const commBar = document.getElementById('ai-comm-bar');
        if (commBar) setTimeout(() => { commBar.style.width = barWidth(commBalance); }, 200);

        // Attachment Styles
        const attach = report?.attachment_style || {};
        setText('ai-attach-1', attach.person_1 || '--');
        setText('ai-attach-2', attach.person_2 || '--');
        setText('ai-attach-note', attach.compatibility_note || '');
        setText('attach-name-1', activeData.my_name || 'You');
        setText('attach-name-2', activeData.partner_name || 'Partner');

        // Key Insights
        const insightsEl = document.getElementById('ai-key-insights');
        if (insightsEl) {
            const insights = report?.key_insights || [];
            insightsEl.innerHTML = insights.map((item, i) => `
                <div class="flex gap-3 align-center p-3 rounded" style="background:var(--cream);border:1px solid var(--gray-200);margin-bottom:0.5rem">
                    <span style="font-family:var(--font-heading);font-weight:900;font-size:1.1rem;color:var(--purple);flex-shrink:0">${i + 1}</span>
                    <span class="text-sm">${escapeHTML(item)}</span>
                </div>
            `).join('');
        }

        // Red/Green Flags
        const red = document.getElementById('ai-insight-red-flags');
        const green = document.getElementById('ai-insight-green-flags');
        if (red) red.innerHTML = (ai.red_flags || []).map(f => `<li>${escapeHTML(f)}</li>`).join('');
        if (green) green.innerHTML = (ai.green_flags || []).map(f => `<li>${escapeHTML(f)}</li>`).join('');

        // Strengths + Growth Areas
        const strengthsEl = document.getElementById('ai-strengths');
        const growthEl = document.getElementById('ai-growth-areas');
        if (strengthsEl) strengthsEl.innerHTML = (report?.strengths || []).map(s => `<li style="padding-left:1.25rem;position:relative"><span style="position:absolute;left:0">âœ…</span>${escapeHTML(s)}</li>`).join('');
        if (growthEl) growthEl.innerHTML = (report?.growth_areas || []).map(g => `<li style="padding-left:1.25rem;position:relative"><span style="position:absolute;left:0">ðŸŽ¯</span>${escapeHTML(g)}</li>`).join('');

        // Coaching Advice
        setText('ai-coaching-advice', report?.coaching_advice || '');

        // Fun Fact
        setText('ai-fun-fact', report?.fun_fact || '');

        // Predictive Outlook (derive from available data)
        const weeks = activeData.stats?.weekly_data || [];
        if (weeks.length >= 2) {
            const recentSentiments = weeks.slice(-3).map(w => w.mean_sentiment || 0);
            const earlierSentiments = weeks.slice(0, Math.max(1, weeks.length - 3)).map(w => w.mean_sentiment || 0);
            const recentAvg = recentSentiments.reduce((a, b) => a + b, 0) / recentSentiments.length;
            const earlierAvg = earlierSentiments.reduce((a, b) => a + b, 0) / earlierSentiments.length;
            const diff = recentAvg - earlierAvg;

            const trendArrow = document.getElementById('trend-arrow');
            const trendLabel = document.getElementById('trend-label');
            if (trendArrow && trendLabel) {
                if (diff > 0.1) {
                    trendArrow.className = 'trend-arrow trend-arrow--up';
                    trendArrow.textContent = 'â†—';
                    trendLabel.textContent = 'Improving';
                } else if (diff < -0.1) {
                    trendArrow.className = 'trend-arrow trend-arrow--down';
                    trendArrow.textContent = 'â†˜';
                    trendLabel.textContent = 'Needs Attention';
                } else {
                    trendArrow.className = 'trend-arrow trend-arrow--stable';
                    trendArrow.textContent = 'â†’';
                    trendLabel.textContent = 'Stable';
                }
            }

            const forecastEl = document.getElementById('ai-forecast');
            if (forecastEl) {
                forecastEl.textContent = ai.recent_shift || `Based on ${weeks.length} weeks of data, the emotional trajectory is ${diff > 0.1 ? 'trending positively' : diff < -0.1 ? 'showing signs of decline' : 'holding steady'}.`;
            }
        }

        const predictiveMetrics = document.getElementById('predictive-metrics');
        if (predictiveMetrics) {
            const metric = (label, value) => `
                <div class="prediction-metric">
                    <span class="text-xs uppercase font-bold color-gray-500">${escapeHTML(label)}</span>
                    <strong>${escapeHTML(value || '--')}</strong>
                </div>`;
            predictiveMetrics.innerHTML = [
                metric('Stability', predictive.stability !== undefined ? scoreText(predictive.stability) : '--'),
                metric('Drop-off risk', predictive.drop_off_risk !== undefined ? scoreText(predictive.drop_off_risk) : '--'),
                metric('Repair likelihood', predictive.repair_likelihood || '--'),
                metric('Conflict risk', predictive.conflict_recurrence_risk || '--'),
                metric('Reciprocity', predictive.reciprocity_trend || '--'),
                metric('Confidence', predictive.confidence !== undefined ? scoreText(predictive.confidence) : '--')
            ].join('');
        }

        const forecastEl = document.getElementById('ai-forecast');
        if (forecastEl && predictive.next_action) {
            forecastEl.textContent = `${ai.recent_shift || ''} ${predictive.next_action}`.trim();
        }

        // Action Items
        const actionItemsEl = document.getElementById('ai-action-items');
        if (actionItemsEl) {
            const actions = [];
            if (predictive.next_action) actions.push({ action: predictive.next_action, impact: Number(predictive.drop_off_risk || 0) >= 65 ? 'high' : 'medium' });
            receipts.slice(0, 2).forEach(r => actions.push({ action: r.action, impact: r.confidence === 'high' ? 'high' : 'medium' }));
            if (report?.coaching_advice) actions.push({ action: report.coaching_advice, impact: 'high' });
            (report?.growth_areas || []).forEach(g => actions.push({ action: g, impact: 'medium' }));
            actionItemsEl.innerHTML = actions.slice(0, 3).map(item => `
                <div class="action-item-card">
                    <span class="impact-badge impact-badge--${item.impact}">${item.impact}</span>
                    <span class="text-sm">${escapeHTML(item.action)}</span>
                </div>
            `).join('');
        }
    }

    const resetCoachingChat = () => {
        window.coachingChatHistory = [];
        const chatHistoryEl = document.getElementById('coaching-chat-history');
        if (chatHistoryEl) {
            chatHistoryEl.innerHTML = `
            <div class="chat-message ai">
                <strong>Coach:</strong> Based on the data, what do you want me to expand on? I can break down response times, shift in vibe, or give advice.
            </div>`;
        }
    };

    const generateAiInsights = async () => {
        const permission = document.getElementById('ai-permission-container');
        const loading = document.getElementById('ai-loading-container');
        const results = document.getElementById('ai-results-container');
        const progress = document.getElementById('ai-loading-progress');
        
        permission?.classList.add('hidden');
        results?.classList.add('hidden');
        loading?.classList.remove('hidden');

        // U-05: Rotating status messages during AI loading
        const statusMessages = [
            { text: 'Packaging anonymous stats...', pct: 24 },
            { text: 'Reading participation balance...', pct: 42 },
            { text: 'Checking timeline and response patterns...', pct: 61 },
            { text: 'Writing the relationship read...', pct: 78 },
            { text: 'Polishing the final verdict...', pct: 90 }
        ];
        let statusIdx = 0;
        const statusEl = document.getElementById('ai-loading-status');
        if (statusEl) statusEl.textContent = 'Packaging anonymous stats...';
        if (progress) progress.style.width = '12%';
        const statusInterval = setInterval(() => {
            const step = statusMessages[statusIdx++ % statusMessages.length];
            if (statusEl) statusEl.textContent = step.text;
            if (progress) progress.style.width = `${step.pct}%`;
        }, 2500);

        try {
            const payload = {
                stats: activeData.stats,
                my_name: activeData.my_name,
                partner_name: activeData.partner_name,
                connection_type: activeData.connection_type || 'romantic',
                language: activeData.language || 'english',
                context: activeData.context || '',
                tone: activeData.tone || 'balanced',
                privacy_mode: activeData.privacy_mode || 'stats_only',
                source_quality: activeData.source_quality || null,
                evidence_pack: activeData.evidence_pack || null,
                raw_excerpt_pack: activeData.privacy_mode === 'opt_in_raw' ? (activeData.raw_excerpt_pack || null) : null,
                compare_data: isCompareMode ? { a: dataA.stats, b: dataB.stats, nameA: dataA.partner_name, nameB: dataB.partner_name } : null,
                provider: localStorage.getItem('llm_provider') || 'cloudflare',
                api_key: sessionStorage.getItem('_llm_token') ? decodeURIComponent(escape(atob(sessionStorage.getItem('_llm_token')))) : ''
            };

            const resp = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await resp.json();
            if (!resp.ok) throw new Error(data.error || "Failed");

            const report = data.report;
            if (progress) progress.style.width = '100%';
            renderAiReport(report);
            activeData.llmReport = report;
            window.activeData = activeData;
            sessionStorage.setItem('dashboard_data', JSON.stringify(activeData));
            persistActiveReport();

            clearInterval(statusInterval);
            loading?.classList.add('hidden');
            results?.classList.remove('hidden');

            // Reset Chat History on new generation
            resetCoachingChat();

        } catch (e) {
            clearInterval(statusInterval);
            loading?.classList.add('hidden');
            // M-02: Inline error recovery instead of alert()
            const errorMsg = e.message && e.message.includes('Free tier limit')
                ? 'Cloudflare free tier limit reached (2 requests per hour). Configure your own API key for unlimited access.'
                : `Analysis failed: ${escapeHTML(e.message)}`;
            if (permission) permission.innerHTML = `
                <div class="text-center p-8">
                    <div style="font-size:3rem;margin-bottom:1rem">âš ï¸</div>
                    <h3 style="font-size:1.5rem;margin-bottom:1rem;color:var(--red)">Something went wrong</h3>
                    <p style="max-width:500px;margin:0 auto 2rem;color:var(--gray-600);line-height:1.6">${errorMsg}</p>
                    <div class="flex justify-center gap-3">
                        <button id="retryAiBtn" class="btn btn--pink">âœ¨ Try Again</button>
                        <button onclick="document.getElementById('settingsBtn')?.click()" class="btn btn--white">âš™ Settings</button>
                    </div>
                </div>
            `;
            permission?.classList.remove('hidden');
            document.getElementById('retryAiBtn')?.addEventListener('click', () => {
                permission.innerHTML = `
                    <div class="text-center p-12" style="background:var(--white);border-width:4px">
                        <div style="font-size:3rem;margin-bottom:1rem">ðŸ§ </div>
                        <h3 style="font-size:1.75rem;margin-bottom:1rem">Unlock AI-Powered Vibe Analytics</h3>
                        <div><button id="generateAiBtn" class="btn btn--pink btn--lg px-12">âœ¨ GENERATE INSIGHTS</button></div>
                    </div>
                `;
                generateAiInsights();
            });
        }
    };

    const generateBtn = document.getElementById('generateAiBtn');
    generateBtn?.addEventListener('click', generateAiInsights);

    // Wire regenerate button (C-03)
    document.getElementById('regenerateBtn')?.addEventListener('click', () => {
        document.getElementById('ai-results-container')?.classList.add('hidden');
        document.getElementById('ai-permission-container')?.classList.remove('hidden');
        generateAiInsights();
    });

    // Auto-trigger AI â€” MUST be after generateBtn listener is wired (C-04)
    if (isSharedMode && window.llmReport && Object.keys(window.llmReport).length > 0) {
        renderAiReport(window.llmReport);
        document.getElementById('ai-permission-container')?.classList.add('hidden');
        document.getElementById('ai-results-container')?.classList.remove('hidden');
        resetCoachingChat();
    } else {
        autoTriggerAi();
    }

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
            errMsg.className = 'chat-message error';
            errMsg.textContent = 'Session limit reached (50 messages). Refresh the page to continue.';
            historyEl.appendChild(errMsg);
            return;
        }
        sessionStorage.setItem('_chat_count', String(chatCount + 1));

        // Append User Message
        const userMsg = document.createElement('div');
        userMsg.className = 'chat-message user';
        userMsg.innerHTML = `<strong>You:</strong> ${escapeHTML(text)}`;
        historyEl.appendChild(userMsg);
        
        inputEl.value = '';
        inputEl.disabled = true;
        submitBtn.disabled = true;
        submitBtn.textContent = '...';

        // Append Loading
        const loadMsg = document.createElement('div');
        loadMsg.className = 'chat-message ai';
        loadMsg.style.opacity = '0.6';
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
                api_key: sessionStorage.getItem('_llm_token') ? decodeURIComponent(escape(atob(sessionStorage.getItem('_llm_token')))) : ''
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
            const formattedText = escapeHTML(data.text).replace(/\n/g, '<br>');

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
            errMsg.className = 'chat-message error';
            errMsg.textContent = `Error: ${err.message}`;
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
async function downloadWrappedCard(btnId = 'downloadVibeBtn') {
    // Determine which button triggered this (can be header or footer button)
    let btn = document.getElementById(btnId);
    if (!btn || btn.disabled) {
        // Fallback to check the other if default is not found/disabled but event happened
        if (btnId === 'downloadVibeBtnHeader') btn = document.getElementById('downloadVibeBtn');
        else btn = document.getElementById('downloadVibeBtnHeader');
    }

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
        const meBarPct = clampVisualPercent(mePct, { min: 0, max: 100 });
        
        document.getElementById('share-bar-me').style.width = meBarPct + '%';
        document.getElementById('share-bar-partner').style.width = (100 - meBarPct) + '%';

        // Provide a stats object based solely on anonymous statistics
        const statsPayload = {
            health_score: formatHeuristicScore(report.ai_insight?.health_score || report.overall_health_score || 0, { suffix: "", plusAtMax: true }),
            top_insight: report.ai_insight?.brutal_verdict || "Your chat data has been decoded."
        };
        const imageData = generateShareCard(statsPayload);

        // Try Web Share API first
        if (navigator.share) {
            try {
                // Convert data URL to Blob
                const res = await fetch(imageData);
                const blob = await res.blob();
                const file = new File([blob], 'my-algorithm-results.png', { type: 'image/png' });

                await navigator.share({
                    title: 'My Algorithm Results',
                    text: 'Check out my chat vibe read from The Algorithm!',
                    files: [file]
                });
                return; // Shared successfully
            } catch (shareErr) {
                // Ignore AbortError (user cancelled)
                if (shareErr.name !== 'AbortError') {
                    console.warn('Web Share failed, falling back to download', shareErr);
                } else {
                    return; // User cancelled, don't download
                }
            }
        }

        // Fallback to direct download
        const link = document.createElement('a');
        link.download = 'my-algorithm-results.png';
        link.href = imageData;
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
    btn.textContent = "â³ Generating...";

    try {
        if (!window.activeData) throw new Error("No data to share");

        // Strip out any raw messages or content - ONLY anonymous stats
        const shareData = {
            my_name: "Person A",
            partner_name: "Person B",
            stats: {
                messages: window.activeData.stats?.messages,
                duration: window.activeData.stats?.duration,
                mirroring: window.activeData.stats?.mirroring,
                symmetry: window.activeData.stats?.symmetry,
                attachment_style: window.activeData.stats?.attachment_style,
                streaks: window.activeData.stats?.streaks,
            },
            evidence_pack: {
                receipts: (window.activeData.evidence_pack?.receipts || []).slice(0, 3),
                predictive_outlook: window.activeData.evidence_pack?.predictive_outlook || null
            },
            source_quality: window.activeData.source_quality || null
        };

        // Ensure no raw chat content accidentally slips through
        delete shareData.stats.raw_messages;
        delete shareData.raw_excerpt_pack;

        const base64Data = btoa(encodeURIComponent(JSON.stringify(shareData)));
        const shareUrl = `${window.location.origin}/share#${base64Data}`;

        await navigator.clipboard.writeText(shareUrl);

        btn.textContent = "âœ… Link Copied!";
        setTimeout(() => { btn.textContent = originalText; }, 2000);
    } catch (err) {
        btn.textContent = "âŒ Failed";
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
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');
  const active = window.activeData || {};
  const stats = active.stats || {};
  const report = window.llmReport || {};
  const ai = report.ai_insight || {};
  const messages = stats.messages || {};
  const meTotal = messages.ME || 0;
  const partnerTotal = messages.PARTNER || 0;
  const total = meTotal + partnerTotal;
  const mePct = total ? Math.round(meTotal / total * 100) : 50;
  const partnerPct = 100 - mePct;
  const healthScore = formatHeuristicScore(ai.health_score || report.overall_health_score || analysisData.health_score || 0, { suffix: "", plusAtMax: true });
  const dropOffRisk = predictive.drop_off_risk !== undefined ? formatHeuristicScore(predictive.drop_off_risk) : null;
  const init = stats.initiator_ratio || {};
  const avgReply = [init.me_latency_avg, init.partner_latency_avg]
    .filter(v => Number.isFinite(Number(v)) && Number(v) >= 0)
    .reduce((acc, v, _, arr) => acc + Number(v) / arr.length, 0);
  const replyText = avgReply ? formatShareTime(avgReply) : '--';
  const redFlag = ai.red_flags?.[0] || report.growth_areas?.[0] || 'No major red flag detected.';
  const topReceipt = report.receipts?.[0] || active.evidence_pack?.receipts?.[0];
  const predictive = report.predictive_outlook || active.evidence_pack?.predictive_outlook || {};
  const greenFlag = topReceipt?.claim || ai.green_flags?.[0] || report.strengths?.[0] || 'There is enough signal to read the vibe.';
  const title = ai.dynamic_title || report.relationship_persona || 'Vibe Check';
  const finalWord = ai.brutal_verdict || analysisData.top_insight || 'The chat has spoken.';

  const gradient = ctx.createLinearGradient(0, 0, 1080, 1920);
  gradient.addColorStop(0, '#fff4d8');
  gradient.addColorStop(0.52, '#ff4d8d');
  gradient.addColorStop(1, '#1a0a00');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1080, 1920);

  ctx.fillStyle = '#1a0a00';
  ctx.fillRect(54, 54, 972, 1812);
  ctx.fillStyle = '#fff8f0';
  ctx.fillRect(72, 72, 936, 1776);

  drawPill(ctx, 'THE ALGORITHM', 112, 120, '#1a0a00', '#ffd600', 32);
  drawPill(ctx, ai.vibe_label || 'VIBE CHECK', 112, 205, '#ff4d8d', '#fff', 28);

  ctx.fillStyle = '#1a0a00';
  ctx.font = '900 96px Inter, Arial, sans-serif';
  wrapText(ctx, title.toUpperCase(), 112, 345, 830, 104);

  ctx.fillStyle = '#7b2fbe';
  ctx.font = '900 188px Inter, Arial, sans-serif';
  ctx.fillText(`${healthScore || '--'}`, 112, 690);
  ctx.fillStyle = '#1a0a00';
  ctx.font = '900 34px Inter, Arial, sans-serif';
  ctx.fillText('signal score', 435, 665);

  drawMetric(ctx, 'Messages', total.toLocaleString(), 112, 785);
  drawMetric(ctx, 'Duration', stats.duration || '--', 560, 785);
  drawMetric(ctx, 'Reply speed', replyText, 112, 980);
  drawMetric(ctx, 'Balance', stats.symmetry?.label || `${mePct}/${partnerPct}`, 560, 980);

  ctx.fillStyle = '#1a0a00';
  ctx.font = '900 30px Inter, Arial, sans-serif';
  ctx.fillText(`${active.my_name || 'You'} ${mePct}% of ${total.toLocaleString()}`, 112, 1215);
  ctx.fillText(`${active.partner_name || 'Them'} ${partnerPct}% of ${total.toLocaleString()}`, 112, 1260);
  ctx.fillStyle = '#e9ddc8';
  ctx.fillRect(112, 1288, 856, 44);
  ctx.fillStyle = '#1a0a00';
  ctx.fillRect(112, 1288, 856 * mePct / 100, 44);
  ctx.fillStyle = '#ff4d8d';
  ctx.fillRect(112 + 856 * mePct / 100, 1288, 856 * partnerPct / 100, 44);

  drawInsightBox(ctx, 'RED FLAG', redFlag, 112, 1395, '#ffe1e6');
  drawInsightBox(ctx, 'TOP RECEIPT', greenFlag, 112, 1545, '#e6ffe9');

  ctx.fillStyle = '#1a0a00';
  ctx.font = '900 30px Inter, Arial, sans-serif';
  ctx.fillText(`PREDICTION: ${dropOffRisk ? dropOffRisk + ' DROP-OFF RISK' : 'WATCH THE TREND'}`, 112, 1728);
  ctx.font = '800 38px Inter, Arial, sans-serif';
  wrapText(ctx, finalWord, 112, 1790, 856, 48);

  return canvas.toDataURL('image/png');
}

function drawPill(ctx, text, x, y, bg, fg, size) {
    ctx.fillStyle = bg;
    ctx.fillRect(x, y, Math.min(856, 34 + text.length * size * 0.62), size + 28);
    ctx.fillStyle = fg;
    ctx.font = `900 ${size}px Inter, Arial, sans-serif`;
    ctx.fillText(text, x + 18, y + size + 9);
}

function drawMetric(ctx, label, value, x, y) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y, 390, 140);
    ctx.strokeStyle = '#1a0a00';
    ctx.lineWidth = 5;
    ctx.strokeRect(x, y, 390, 140);
    ctx.fillStyle = '#78716c';
    ctx.font = '900 24px Inter, Arial, sans-serif';
    ctx.fillText(label.toUpperCase(), x + 28, y + 42);
    ctx.fillStyle = '#1a0a00';
    ctx.font = '900 46px Inter, Arial, sans-serif';
    wrapText(ctx, String(value), x + 28, y + 102, 330, 48);
}

function drawInsightBox(ctx, label, text, x, y, bg) {
    ctx.fillStyle = bg;
    ctx.fillRect(x, y, 856, 118);
    ctx.strokeStyle = '#1a0a00';
    ctx.lineWidth = 5;
    ctx.strokeRect(x, y, 856, 118);
    ctx.fillStyle = '#1a0a00';
    ctx.font = '900 24px Inter, Arial, sans-serif';
    ctx.fillText(label, x + 26, y + 38);
    ctx.font = '800 30px Inter, Arial, sans-serif';
    wrapText(ctx, text, x + 26, y + 82, 800, 36);
}

function formatShareTime(seconds) {
    if (!seconds || seconds < 0) return '--';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
}

