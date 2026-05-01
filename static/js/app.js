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

    const analyzeBtn = document.getElementById('analyzeBtn');
    let activeAbortController = null; // C-05: Track in-flight requests

    const updateSubmitState = () => {
        if (!analyzeBtn) return;
        const hasFile = fileInput && fileInput.files.length > 0;
        const provider = localStorage.getItem('llm_provider') || 'cloudflare';
        const keyRaw = sessionStorage.getItem('_llm_token');
        const hasValidKey = (provider === 'cloudflare') || (keyRaw && keyRaw.trim() !== '' && keyRaw !== btoa(''));
        
        analyzeBtn.disabled = !(hasFile && hasValidKey);
        
        if (!hasValidKey) {
            analyzeBtn.textContent = 'Configure API Key First →';
            analyzeBtn.style.opacity = '0.5';
        } else if (!hasFile) {
            analyzeBtn.textContent = 'Upload File to Decode →';
            analyzeBtn.style.opacity = '0.5';
        } else {
            analyzeBtn.textContent = 'Decode My Chat →';
            analyzeBtn.style.opacity = '1';
        }
    };

    // --- API Key Status ---
    const updateApiKeyUI = () => {
        const icon = document.getElementById('apiKeyStatusIcon');
        const text = document.getElementById('apiKeyStatusText');
        const provider = localStorage.getItem('llm_provider') || 'cloudflare';
        if (!icon || !text) return;
        const key = sessionStorage.getItem('_llm_token');
        if (provider === 'cloudflare') {
            icon.textContent = '☁️';
            text.textContent = 'Free Tier (2/hr limit)';
        } else if (key && key.trim() !== "" && key !== btoa("")) {
            icon.textContent = '✅';
            text.textContent = 'API Key Configured';
        } else {
            icon.textContent = '🔑';
            text.textContent = 'API Key Required';
        }
        updateSubmitState();
    };
    updateApiKeyUI();
    const apiKeyInput = document.getElementById('apiKey');

    if (apiKeyInput) {
        apiKeyInput.addEventListener('input', () => {
            const val = apiKeyInput.value.trim();
            if (val === '') {
                apiKeyInput.style.borderColor = '';
            } else if (val.startsWith('sk-') || val.length > 20) {
                apiKeyInput.style.borderColor = 'var(--green)';
            } else {
                apiKeyInput.style.borderColor = 'var(--red)';
            }
        });
    }

    updateSubmitState(); // C-02: Disable button on page load if no file

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

    // C-06: Register trust center handlers independently to avoid one null element blocking others
    if (trustCenterBtn && trustCenterModal) {
        trustCenterBtn.addEventListener('click', () => showModal(trustCenterModal));
    }
    if (closeTrustCenter && trustCenterModal) {
        closeTrustCenter.addEventListener('click', () => hideModal(trustCenterModal));
    }
    if (understoodBtn && trustCenterModal) {
        understoodBtn.addEventListener('click', () => hideModal(trustCenterModal));
    }

    if (settingsBtn && settingsModal) {
        const apiKeyEl = document.getElementById('apiKey');
        const hfUrlEl = document.getElementById('hfUrl');
        const llmProviderEl = document.getElementById('llmProvider');

        // C-01: Populate modal from storage on open, not just once on load
        settingsBtn.addEventListener('click', () => {
            // Re-read stored values every time modal opens
            const savedProvider = localStorage.getItem('llm_provider') || 'cloudflare';
            if (llmProviderEl) llmProviderEl.value = savedProvider;
            if (apiKeyEl) {
                const storedToken = sessionStorage.getItem('_llm_token');
                apiKeyEl.value = (storedToken && storedToken !== btoa('')) ? atob(storedToken) : '';
            }
            if (hfUrlEl) hfUrlEl.value = localStorage.getItem('hf_url') || '';
            updateProviderHint(savedProvider);
            showModal(settingsModal);
            if (llmProviderEl) llmProviderEl.focus();
        });
        closeSettings?.addEventListener('click', () => hideModal(settingsModal));

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
    // apiKeyInput is already defined above
    toggleBtn?.addEventListener('click', () => {
        if (!apiKeyInput) return;
        const isPassword = apiKeyInput.type === 'password';
        apiKeyInput.type = isPassword ? 'text' : 'password';
    });

    const handleFileSelection = async () => {
        if (!fileInput || fileInput.files.length === 0) return;
        const file = fileInput.files[0];
        const fileName = file.name;
        const fileSize = (file.size / 1024).toFixed(1);

        // Hide old list
        if (fileList) fileList.classList.add('hidden');

        const detectionCard = document.getElementById('detectionCard');
        if (detectionCard) {
            // Show loading state first
            detectionCard.innerHTML = `
                <div class="flex items-center gap-3 p-4 bg-white/10 rounded-lg border border-white/20">
                    <span class="text-2xl animate-spin">⟳</span>
                    <div>
                        <p class="font-medium text-white">Analyzing file...</p>
                    </div>
                </div>
            `;
            detectionCard.classList.remove('hidden');

            try {
                // Read a small chunk for detection to be fast
                const chunk = file.slice(0, 500000);
                const content = await chunk.text();
                const parser = new ChatParser();
                const platform = parser.detect(content, fileName);

                // Estimate message count roughly (newlines for txt, divs for html)
                let messageCountStr = '...';
                const ratio = file.size > 500000 ? (file.size / 500000) : 1;

                if (fileName.toLowerCase().endsWith('.txt')) {
                    const lines = content.split('\n').length;
                    messageCountStr = `~${Math.floor(lines / 2 * ratio || lines)} messages`;
                } else if (fileName.toLowerCase().endsWith('.html')) {
                    const divs = (content.match(/<div class="message /g) || []).length;
                    messageCountStr = `~${Math.floor(divs * ratio || divs)} messages`;
                } else {
                    messageCountStr = `${fileSize} KB`;
                }

                const PLATFORM_ICONS = {
                    'WhatsApp': '💬',
                    'Telegram': '✈️',
                    'Signal': '🔒',
                    'Instagram': '📷',
                    'Discord': '🎮',
                    'JSON': '📄'
                };

                detectionCard.innerHTML = `
                    <div class="flex items-center gap-3 p-4 bg-white/10 rounded-lg border border-white/20">
                        <span class="text-2xl">${PLATFORM_ICONS[platform] || '📄'}</span>
                        <div>
                            <p class="font-medium text-white">Detected: ${platform}</p>
                            <p class="text-sm text-white/60">${fileName} • ${messageCountStr}</p>
                        </div>
                    </div>
                `;
            } catch (err) {
                 detectionCard.innerHTML = `
                    <div class="flex items-center gap-3 p-4 bg-white/10 rounded-lg border border-white/20">
                        <span class="text-2xl">📄</span>
                        <div>
                            <p class="font-medium text-white">${fileName}</p>
                            <p class="text-sm text-white/60">${fileSize} KB</p>
                        </div>
                    </div>
                `;
            }
        }

        // C-03: Show/hide JSON platform selector based on file type
        const jsonSelector = document.getElementById('jsonPlatformSelector');
        if (jsonSelector) {
            if (fileName.toLowerCase().endsWith('.json')) {
                jsonSelector.classList.remove('hidden');
            } else {
                jsonSelector.classList.add('hidden');
            }
        }
        updateSubmitState();
    };

    // H-01: Add drag/drop visual feedback
    if (dropZone) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => dropZone.addEventListener(evt, (e) => { e.preventDefault(); e.stopPropagation(); }));
        dropZone.addEventListener('dragenter', () => { dropZone.classList.add('drag-over'); });
        dropZone.addEventListener('dragover', () => { dropZone.classList.add('drag-over'); });
        dropZone.addEventListener('dragleave', () => { dropZone.classList.remove('drag-over'); });
        dropZone.addEventListener('drop', (e) => {
            dropZone.classList.remove('drag-over');
            fileInput.files = e.dataTransfer.files;
            handleFileSelection();
        });
    }
    fileInput?.addEventListener('change', async (e) => {
        await handleFileSelection();
    });

    function updateFileList() {
        // Kept for backward compatibility if needed by other parts,
        // but main logic moved to async event listener above
        if (fileList && fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const fileName = file.name;
            const fileSize = (file.size / 1024).toFixed(1);
            fileList.classList.remove('hidden');
            fileList.textContent = `✅ ${fileName} (${fileSize} KB)`;
        }
        updateSubmitState();
    }

    function updateProviderHint(provider) {
        const hintEl = document.getElementById('providerHint');
        const hfContainer = document.getElementById('hfUrlContainer');
        const apiKeyContainer = document.getElementById('apiKeyContainer');
        if (!hintEl) return;
        const hints = { 'cloudflare': 'Free Tier (2 reports/hr)', 'openai': 'sk-proj-...', 'anthropic': 'sk-ant-...', 'gemini': 'Google API Key' };
        hintEl.textContent = hints[provider] || '';
        
        if (hfContainer) hfContainer.classList.toggle('hidden', provider !== 'huggingface');
        if (apiKeyContainer) apiKeyContainer.classList.toggle('hidden', provider === 'cloudflare');
        updateSubmitState();
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
                }).catch(err => { /* fail silently for stats */ });
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

    // C-04: Fix compare UI to populate picker from localStorage
    const updateCompareUI = () => {
        const history = historyManager.getAll();
        const picker = document.getElementById('compare-history-picker');
        if (!picker) return;
        
        const pickerStatus = document.getElementById('picker-status');
        const pickerCount = document.getElementById('picker-count');
        if (pickerStatus) pickerStatus.textContent = `Picking for Chat ${compareSelection.activeSlot.toUpperCase()}`;
        if (pickerCount) pickerCount.textContent = `${history.length} available`;
        
        const slotA = document.getElementById('slot-a');
        const slotB = document.getElementById('slot-b');
        const slotAName = document.getElementById('slot-a-name');
        const slotBName = document.getElementById('slot-b-name');
        
        if (slotA) slotA.classList.toggle('active', compareSelection.activeSlot === 'a');
        if (slotB) slotB.classList.toggle('active', compareSelection.activeSlot === 'b');
        if (slotAName) slotAName.textContent = compareSelection.a ? `${compareSelection.a.my_name} & ${compareSelection.a.partner_name}` : 'Click to pick';
        if (slotBName) slotBName.textContent = compareSelection.b ? `${compareSelection.b.my_name} & ${compareSelection.b.partner_name}` : 'Click to pick';
        
        picker.innerHTML = '';
        if (history.length === 0) {
            picker.innerHTML = '<div style="text-align:center;padding:1.5rem;color:var(--gray-500);font-weight:500">No analyses found. Analyse a chat first.</div>';
        }
        history.forEach(item => {
            const el = document.createElement('div');
            el.className = `picker-item ${ (compareSelection.a?.id === item.id || compareSelection.b?.id === item.id) ? 'selected' : '' }`;
            el.innerHTML = `<div style="font-weight:900">${item.my_name} & ${item.partner_name}</div><div style="font-size:0.65rem">${item.date} • ${item.platform || 'Unknown'}</div>`;
            el.addEventListener('click', () => {
                if (compareSelection.activeSlot === 'a') { compareSelection.a = item; compareSelection.activeSlot = 'b'; }
                else compareSelection.b = item;
                updateCompareUI();
            });
            picker.appendChild(el);
        });
        const execBtn = document.getElementById('executeCompareBtn');
        if (execBtn) execBtn.disabled = !(compareSelection.a && compareSelection.b);
    };

    compareTriggers.forEach(btn => btn.addEventListener('click', () => { showModal(compareModal); compareSelection = { a: null, b: null, activeSlot: 'a' }; updateCompareUI(); }));
    document.getElementById('closeCompare')?.addEventListener('click', () => hideModal(compareModal));
    document.getElementById('cancelCompareBtn')?.addEventListener('click', () => hideModal(compareModal));
    document.getElementById('executeCompareBtn')?.addEventListener('click', () => {
        sessionStorage.setItem('compare_a', JSON.stringify(compareSelection.a));
        sessionStorage.setItem('compare_b', JSON.stringify(compareSelection.b));
        window.location.href = '/dashboard.html?mode=compare';
    });

    // C-05: Reset form state helper
    const resetFormState = () => {
        if (activeAbortController) {
            activeAbortController.abort();
            activeAbortController = null;
        }
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) loadingOverlay.classList.add('hidden');
        if (analyzeBtn) {
            analyzeBtn.disabled = false;
            analyzeBtn.textContent = 'Decode My Chat →';
            analyzeBtn.style.opacity = '1';
        }
        updateSubmitState();
    };

    // C-05: Wire loading overlay dismiss button
    const loadingOverlayDismiss = document.getElementById('loading-overlay-close');
    if (loadingOverlayDismiss) {
        loadingOverlayDismiss.addEventListener('click', () => {
            resetFormState();
        });
    }

    // M-02: Context textarea character counter
    const userContextEl = document.getElementById('userContext');
    const userContextCount = document.getElementById('userContextCharCount');
    if (userContextEl && userContextCount) {
        userContextEl.addEventListener('input', () => {
            userContextCount.textContent = `${userContextEl.value.length} / 2000`;
        });
    }

    let progressInterval = null;

    // --- Form Submission ---
    if (uploadForm) {
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideError();
            
            // C-02: Validate file BEFORE showing loading overlay
            if (!fileInput || !fileInput.files.length) {
                showError('Please upload a chat export first.');
                return;
            }
            
            // M-05: Validate connection type is selected
            const connectionTypeVal = document.getElementById('connectionType')?.value;
            if (!connectionTypeVal) {
                showError('Please select a relationship type before analysing.');
                return;
            }
            
            const provider = localStorage.getItem('llm_provider') || 'cloudflare';
            const apiKeyB64 = sessionStorage.getItem('_llm_token');
            if (provider !== 'cloudflare' && (!apiKeyB64 || apiKeyB64.trim() === '' || apiKeyB64 === btoa(''))) {
                showError(`An API Key is required for ${document.querySelector('#llmProvider option:checked')?.text || provider}. Configure it first.`);
                if (analyzeBtn) {
                    analyzeBtn.disabled = false;
                    analyzeBtn.textContent = 'Configure API Key First →';
                }
                return;
            }
            
            // C-05: Create abort controller for this request
            activeAbortController = new AbortController();
            
            const loadingOverlay = document.getElementById('loading-overlay');
            const progressText = document.getElementById('progress-text');
            if (loadingOverlay) {
                loadingOverlay.classList.remove('hidden');
                if (progressText) {
                    const steps = ['Parsing messages...', 'Calculating statistics...', 'Extracting insights...'];
                    let stepIndex = 0;
                    progressText.textContent = steps[stepIndex++];
                    progressInterval = setInterval(() => {
                        if (stepIndex < steps.length) {
                            progressText.textContent = steps[stepIndex++];
                        }
                    }, 2500);
                }
            }

            const parser = new ChatParser();
            const analytics = new AnalyticsEngine();

            if (analyzeBtn) {
                analyzeBtn.disabled = true;
                analyzeBtn.setAttribute('aria-busy', 'true');
                analyzeBtn.innerHTML = '<span class="animate-spin inline-block mr-2">⟳</span> Analyzing...';
            }

            try {
                // Check if aborted
                if (activeAbortController?.signal.aborted) throw new Error('Analysis cancelled.');
                
                const file = fileInput.files[0];
                const content = await file.text();
                
                // C-03: Read platform from the hidden select (synced by custom dropdown)
                let jsonPlat = document.getElementById('jsonPlatform') ? document.getElementById('jsonPlatform').value : 'Instagram';

                // Detect platform
                let detectedPlatform = parser.detect(content, file.name);
                if (detectedPlatform === 'JSON') detectedPlatform = jsonPlat;

                let rawMessages;
                if (detectedPlatform === 'Telegram') {
                    rawMessages = parser.parseTelegram(content);
                } else if (detectedPlatform === 'Discord') {
                    rawMessages = parser.parseDiscord(content);
                } else if (detectedPlatform === 'Instagram') {
                    rawMessages = parser.parseInstagram(content);
                } else if (detectedPlatform === 'Signal') {
                    rawMessages = parser.parseSignal(content);
                } else {
                    rawMessages = parser.parseWhatsApp(content);
                }
                
                if (!rawMessages || !rawMessages.length) throw new Error("No readable messages found in the file.");
                if (activeAbortController?.signal.aborted) throw new Error('Analysis cancelled.');

                const myName = document.getElementById('myName').value;
                const partnerName = document.getElementById('partnerName').value;
                const filteredMessages = parser.standardizeEntities(rawMessages, myName, partnerName);
                if (!filteredMessages.length) throw new Error("Sender names not mapped correctly.");

                const connectionType = document.getElementById('connectionType').value;
                const outputLanguage = document.getElementById('outputLanguage') ? document.getElementById('outputLanguage').value : 'english';
                const userContext = document.getElementById('userContext') ? document.getElementById('userContext').value.trim() : '';
                const analysisTone = document.getElementById('analysisTone') ? document.getElementById('analysisTone').value : 'balanced';

                const analyticsResult = analytics.runPipeline(filteredMessages, connectionType);
                if (activeAbortController?.signal.aborted) throw new Error('Analysis cancelled.');

                const dashboardData = {
                    stats: analyticsResult,
                    my_name: myName,
                    partner_name: partnerName,
                    highlights: [], flashbacks: {},
                    connection_type: connectionType,
                    language: outputLanguage,
                    context: userContext,
                    tone: analysisTone,
                    msg_count: filteredMessages.length,
                    platform: detectedPlatform
                };

                historyManager.save(dashboardData);
                sessionStorage.setItem('dashboard_data', JSON.stringify(dashboardData));
                
                // M-01: Success toast/feedback before redirect
                const loadingOverlay = document.getElementById('loading-overlay');
                if (loadingOverlay) {
                    loadingOverlay.innerHTML = `<div style="font-size:4rem;margin-bottom:1rem;animation:pulse 1.5s infinite">✅</div><h2 style="color:var(--green);text-shadow:2px 2px 0 var(--black)">Analysis Complete!</h2><p style="font-weight:700">Opening your personalized report...</p>`;
                }
                
                setTimeout(() => {
                    window.location.href = '/dashboard.html';
                }, 1200);

            } catch (err) {
                showError(err.message);
                resetFormState();
            } finally {
                if (progressInterval) {
                    clearInterval(progressInterval);
                    progressInterval = null;
                }
                if (analyzeBtn) {
                    analyzeBtn.removeAttribute('aria-busy');
                }
            }
        });
    }
});
