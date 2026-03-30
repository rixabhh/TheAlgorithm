document.addEventListener('DOMContentLoaded', () => {

    // --- Element References ---
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('chatFile');
    const uploadForm = document.getElementById('uploadForm');
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettings = document.getElementById('closeSettings');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const fileList = document.getElementById('fileList');
    const trustCenterBtn = document.getElementById('trustCenterBtn');
    const trustCenterModal = document.getElementById('trustCenterModal');
    const closeTrustCenter = document.getElementById('closeTrustCenter');
    const understoodBtn = document.getElementById('understoodBtn');

    // --- Tone Selector ---
    const toneDescriptions = {
        playful: 'Fun, witty insights with personality.',
        balanced: 'Clear, helpful insights with context.',
        direct: 'Straight facts, no fluff.'
    };
    const toneSelector = document.getElementById('toneSelector');
    const toneInput = document.getElementById('analysisTone');
    const toneDesc = document.getElementById('toneDesc');
    if (toneSelector) {
        toneSelector.querySelectorAll('.tone-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                toneSelector.querySelectorAll('.tone-btn').forEach(b => {
                    b.style.background = 'transparent';
                    b.style.color = 'var(--black)';
                    b.classList.remove('active');
                });
                btn.style.background = 'var(--black)';
                btn.style.color = 'var(--white)';
                btn.classList.add('active');
                const tone = btn.dataset.tone;
                if (toneInput) toneInput.value = tone;
                if (toneDesc) toneDesc.textContent = toneDescriptions[tone] || '';
            });
        });
    }

    // --- Custom Select Dropdowns ---
    document.querySelectorAll('.custom-select').forEach(wrapper => {
        const trigger = wrapper.querySelector('.custom-select-trigger');
        const label = wrapper.querySelector('.custom-select-label');
        const options = wrapper.querySelectorAll('.custom-select-option');
        const targetId = wrapper.dataset.target;
        const hiddenSelect = document.getElementById(targetId);

        trigger?.addEventListener('click', (e) => {
            e.preventDefault();
            const isOpen = wrapper.classList.contains('open');
            document.querySelectorAll('.custom-select.open').forEach(s => s.classList.remove('open'));
            if (!isOpen) wrapper.classList.add('open');
            trigger.setAttribute('aria-expanded', !isOpen);
        });

        options.forEach(opt => {
            opt.addEventListener('click', () => {
                options.forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
                label.textContent = opt.textContent;
                if (hiddenSelect) hiddenSelect.value = opt.dataset.value;
                wrapper.classList.remove('open');
                trigger.setAttribute('aria-expanded', 'false');
            });
        });
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-select')) {
            document.querySelectorAll('.custom-select.open').forEach(s => {
                s.classList.remove('open');
                s.querySelector('.custom-select-trigger')?.setAttribute('aria-expanded', 'false');
            });
        }
    });

    // --- API Key Status ---
    const updateApiKeyUI = () => {
        const icon = document.getElementById('apiKeyStatusIcon');
        const text = document.getElementById('apiKeyStatusText');
        if (!icon || !text) return;
        const key = sessionStorage.getItem('_llm_token');
        if (key && key.trim() !== "" && key !== btoa("")) {
            icon.textContent = '✅';
            text.textContent = 'API Key Configured';
        } else {
            icon.textContent = '🔑';
            text.textContent = 'API Key Required';
        }
    };
    updateApiKeyUI();

    // --- Modal Helpers ---
    const showModal = (modal) => {
        if (!modal) return;
        modal.classList.add('active');
        modal.classList.remove('hidden');
    };
    const hideModal = (modal, focusEl) => {
        if (!modal) return;
        modal.classList.remove('active');
        setTimeout(() => {
            modal.classList.add('hidden');
            if (focusEl) focusEl.focus();
        }, 250);
    };

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            [trustCenterModal, settingsModal, document.getElementById('compareModal')].forEach(m => {
                if (m && m.classList.contains('active')) hideModal(m);
            });
        }
    });

    [trustCenterModal, settingsModal, document.getElementById('compareModal')].forEach(modal => {
        if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) hideModal(modal); });
    });

    if (trustCenterBtn && trustCenterModal) {
        trustCenterBtn.addEventListener('click', () => showModal(trustCenterModal));
        closeTrustCenter?.addEventListener('click', () => hideModal(trustCenterModal));
        understoodBtn?.addEventListener('click', () => hideModal(trustCenterModal));
    }

    if (settingsBtn && settingsModal) {
        settingsBtn.addEventListener('click', () => {
            showModal(settingsModal);
            document.getElementById('llmProvider')?.focus();
        });
        closeSettings?.addEventListener('click', () => hideModal(settingsModal));

        const apiKeyEl = document.getElementById('apiKey');
        const hfUrlEl = document.getElementById('hfUrl');
        const llmProviderEl = document.getElementById('llmProvider');

        if (apiKeyEl) apiKeyEl.value = sessionStorage.getItem('_llm_token') ? atob(sessionStorage.getItem('_llm_token')) : '';
        if (hfUrlEl) hfUrlEl.value = localStorage.getItem('hf_url') || '';
        const savedProvider = localStorage.getItem('llm_provider') || 'cloudflare';
        if (llmProviderEl) {
            llmProviderEl.value = savedProvider;
            updateProviderHint(savedProvider);
        }
        llmProviderEl?.addEventListener('change', (e) => updateProviderHint(e.target.value));

        saveSettingsBtn?.addEventListener('click', () => {
            const key = apiKeyEl ? apiKeyEl.value.trim() : '';
            sessionStorage.setItem('_llm_token', btoa(key));
            localStorage.setItem('hf_url', hfUrlEl ? hfUrlEl.value.trim() : '');
            localStorage.setItem('llm_provider', llmProviderEl ? llmProviderEl.value : 'cloudflare');
            updateApiKeyUI();
            hideModal(settingsModal);
        });
    }

    // --- UI Utilities ---
    const toggleBtn = document.getElementById('toggleApiKey');
    const apiKeyInput = document.getElementById('apiKey');
    toggleBtn?.addEventListener('click', () => {
        const isPassword = apiKeyInput.type === 'password';
        apiKeyInput.type = isPassword ? 'text' : 'password';
    });

    if (dropZone) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => dropZone.addEventListener(evt, (e) => { e.preventDefault(); e.stopPropagation(); }));
        dropZone.addEventListener('drop', (e) => { fileInput.files = e.dataTransfer.files; updateFileList(); });
    }
    fileInput?.addEventListener('change', updateFileList);

    function updateFileList() {
        if (fileList && fileInput.files.length > 0) {
            fileList.classList.remove('hidden');
            fileList.textContent = `✅ Selected: ${Array.from(fileInput.files).map(f => f.name).join(', ')}`;
        }
    }

    function updateProviderHint(provider) {
        const hintEl = document.getElementById('providerHint');
        const hfContainer = document.getElementById('hfUrlContainer');
        if (!hintEl) return;
        const hints = { 'cloudflare': 'Free Tier (2 reports/hr)', 'openai': 'sk-proj-...', 'anthropic': 'sk-ant-...', 'gemini': 'Google API Key' };
        hintEl.textContent = hints[provider] || '';
        if (hfContainer) hfContainer.classList.toggle('hidden', provider !== 'huggingface');
    }

    const showError = (message) => {
        const container = document.getElementById('errorContainer');
        if (container) {
            container.innerHTML = `<p>${message}</p>`;
            container.classList.remove('hidden');
        } else alert(message);
    };
    const hideError = () => document.getElementById('errorContainer')?.classList.add('hidden');

    // --- ═══ DASHBOARD & HISTORY LOGIC ═══ ---
    
    class HistoryManager {
        constructor() { this.STORAGE_KEY = 'algo_history'; }
        save(data) {
            let history = this.getAll();
            const entry = {
                id: Date.now().toString(),
                my_name: data.my_name,
                partner_name: data.partner_name,
                msg_count: data.msg_count || 0,
                date: new Date().toLocaleDateString(),
                timestamp: Date.now(),
                platform: data.platform || 'WhatsApp',
                stats: data.stats,
                highlights: data.highlights,
                flashbacks: data.flashbacks,
                connection_type: data.connection_type
            };
            history.unshift(entry);
            if (history.length > 5) history.pop();
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
            return entry;
        }
        getAll() { const raw = localStorage.getItem(this.STORAGE_KEY); return raw ? JSON.parse(raw) : []; }
        delete(id) {
            let history = this.getAll().filter(item => item.id !== id);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
            renderHistory();
        }
        clear() { localStorage.removeItem(this.STORAGE_KEY); renderHistory(); }
    }

    const historyManager = new HistoryManager();

    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => { c.classList.add('hidden'); c.classList.remove('active'); });
            btn.classList.add('active');
            const target = document.getElementById(`tab-${btn.dataset.tab}`);
            if (target) { target.classList.remove('hidden'); target.classList.add('active'); }
        });
    });

    const renderHistory = () => {
        const history = historyManager.getAll();
        const list = document.getElementById('history-list');
        const counter = document.getElementById('stats-chats-count');
        
        // Setup local counter display, overriding with global when available
        if (counter && history.length > 0 && counter.innerText === "0") {
            counter.textContent = history.length;
        }

        // Fetch global stats from the newly created backend endpoint
        if (counter) {
            fetch('/api/stats')
                .then(res => res.json())
                .then(data => {
                    if (data && data.count !== undefined && data.count > 0) {
                        counter.textContent = data.count.toLocaleString();
                    }
                }).catch(err => console.error("Failed to fetch global stats:", err));
        }

        if (!list) return;
        list.innerHTML = '';
        document.getElementById('history-empty-state')?.classList.toggle('hidden', history.length > 0);
        history.forEach(item => {
            const card = document.createElement('div');
            card.className = 'history-card';
            card.innerHTML = `
                <div class="history-card__info">
                    <h4 class="m-0">${item.my_name} & ${item.partner_name}</h4>
                    <div class="history-card__meta mt-1">
                        <span class="pill-label pill-label--white" style="font-size:0.6rem; padding: 2px 6px">${item.platform}</span>
                        <span>${item.msg_count.toLocaleString()} msgs</span>
                        <span>•</span>
                        <span>${item.date}</span>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button class="btn btn--pink btn--sm open-history-btn" data-id="${item.id}">Open</button>
                    <button class="btn btn--white btn--sm delete-history-btn" data-id="${item.id}" style="padding: 0.5rem">×</button>
                </div>
            `;
            list.appendChild(card);
        });
        list.querySelectorAll('.open-history-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const item = history.find(h => h.id === btn.dataset.id);
                if (item) { sessionStorage.setItem('dashboard_data', JSON.stringify(item)); window.location.href = '/dashboard.html'; }
            });
        });
        list.querySelectorAll('.delete-history-btn').forEach(btn => {
            btn.addEventListener('click', () => historyManager.delete(btn.dataset.id));
        });
    };
    renderHistory();

    // --- Compare Controller ---
    const compareModal = document.getElementById('compareModal');
    const compareTriggers = document.querySelectorAll('.compare-trigger'); 
    let compareSelection = { a: null, b: null, activeSlot: 'a' };

    const updateCompareUI = () => {
        const history = historyManager.getAll();
        const picker = document.getElementById('compare-history-picker');
        if (!picker) return;
        document.getElementById('picker-status').textContent = `Picking for Chat ${compareSelection.activeSlot.toUpperCase()}`;
        document.getElementById('slot-a').classList.toggle('active', compareSelection.activeSlot === 'a');
        document.getElementById('slot-b').classList.toggle('active', compareSelection.activeSlot === 'b');
        document.getElementById('slot-a-name').textContent = compareSelection.a ? `${compareSelection.a.my_name} & ${compareSelection.a.partner_name}` : 'Click to pick';
        document.getElementById('slot-b-name').textContent = compareSelection.b ? `${compareSelection.b.my_name} & ${compareSelection.b.partner_name}` : 'Click to pick';
        
        picker.innerHTML = '';
        history.forEach(item => {
            const el = document.createElement('div');
            el.className = `picker-item ${ (compareSelection.a?.id === item.id || compareSelection.b?.id === item.id) ? 'selected' : '' }`;
            el.innerHTML = `<div style="font-weight:900">${item.my_name} & ${item.partner_name}</div><div style="font-size:0.65rem">${item.date}</div>`;
            el.addEventListener('click', () => {
                if (compareSelection.activeSlot === 'a') { compareSelection.a = item; compareSelection.activeSlot = 'b'; }
                else compareSelection.b = item;
                updateCompareUI();
            });
            picker.appendChild(el);
        });
        document.getElementById('executeCompareBtn').disabled = !(compareSelection.a && compareSelection.b);
    };

    compareTriggers.forEach(btn => btn.addEventListener('click', () => { showModal(compareModal); compareSelection = { a: null, b: null, activeSlot: 'a' }; updateCompareUI(); }));
    document.getElementById('closeCompare')?.addEventListener('click', () => hideModal(compareModal));
    document.getElementById('cancelCompareBtn')?.addEventListener('click', () => hideModal(compareModal));
    document.getElementById('executeCompareBtn')?.addEventListener('click', () => {
        sessionStorage.setItem('compare_a', JSON.stringify(compareSelection.a));
        sessionStorage.setItem('compare_b', JSON.stringify(compareSelection.b));
        window.location.href = '/dashboard.html?mode=compare';
    });

    // --- Form Submission ---
    if (uploadForm) {
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideError();
            if (!fileInput.files.length) { showError('Select a file.'); return; }
            
            const loadingOverlay = document.getElementById('loading-overlay');
            if (loadingOverlay) loadingOverlay.classList.remove('hidden');

            const parser = new ChatParser();
            const analytics = new AnalyticsEngine();

            try {
                const file = fileInput.files[0];
                const content = await file.text();
                let rawMessages = file.name.endsWith('.html') ? parser.parseTelegram(content) : (file.name.endsWith('.json') ? parser.parseInstagram(content) : parser.parseWhatsApp(content));
                if (!rawMessages.length) throw new Error("No messages found.");

                const myName = document.getElementById('myName').value;
                const partnerName = document.getElementById('partnerName').value;
                const filteredMessages = parser.standardizeEntities(rawMessages, myName, partnerName);
                if (!filteredMessages.length) throw new Error("Names not found.");

                const connectionType = document.getElementById('connectionType').value;
                const analyticsResult = analytics.runPipeline(filteredMessages, connectionType);

                const dashboardData = {
                    stats: analyticsResult,
                    my_name: myName,
                    partner_name: partnerName,
                    highlights: [], flashbacks: {},
                    connection_type: connectionType,
                    msg_count: filteredMessages.length,
                    platform: file.name.endsWith('.html') ? 'Telegram' : (file.name.endsWith('.json') ? 'Instagram' : 'WhatsApp')
                };

                historyManager.save(dashboardData);
                sessionStorage.setItem('dashboard_data', JSON.stringify(dashboardData));
                window.location.href = '/dashboard.html';

            } catch (err) {
                showError(err.message);
                if (loadingOverlay) loadingOverlay.classList.add('hidden');
            }
        });
    }
});
