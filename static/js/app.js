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

        // Toggle open/close
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            const isOpen = wrapper.classList.contains('open');
            // Close all others first
            document.querySelectorAll('.custom-select.open').forEach(s => s.classList.remove('open'));
            if (!isOpen) wrapper.classList.add('open');
            trigger.setAttribute('aria-expanded', !isOpen);
        });

        // Option click
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

        // Keyboard support
        trigger.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                trigger.click();
            }
        });
    });

    // Close dropdowns on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-select')) {
            document.querySelectorAll('.custom-select.open').forEach(s => {
                s.classList.remove('open');
                s.querySelector('.custom-select-trigger')?.setAttribute('aria-expanded', 'false');
            });
        }
    });

    // --- API Key Status UI ---
    const updateApiKeyUI = () => {
        const icon = document.getElementById('apiKeyStatusIcon');
        const text = document.getElementById('apiKeyStatusText');
        if (!icon || !text) return;
        const key = sessionStorage.getItem('_llm_token');
        if (key && key.trim() !== "" && key !== btoa("")) {
            icon.textContent = '✅';
            icon.classList.remove('animate-pulse');
            text.textContent = 'API Key Configured';
            text.style.color = 'var(--black)';
        } else {
            icon.textContent = '🔑';
            icon.classList.add('animate-pulse');
            text.textContent = 'API Key Required';
            text.style.color = '';
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

    // Close on Escape / backdrop click
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (trustCenterModal && trustCenterModal.classList.contains('active')) hideModal(trustCenterModal, trustCenterBtn);
            if (settingsModal && settingsModal.classList.contains('active')) hideModal(settingsModal, settingsBtn);
        }
    });
    [trustCenterModal, settingsModal].forEach(modal => {
        if (modal) modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                if (modal === trustCenterModal) hideModal(trustCenterModal, trustCenterBtn);
                if (modal === settingsModal) hideModal(settingsModal, settingsBtn);
            }
        });
    });

    // --- Trust Center ---
    if (trustCenterBtn && trustCenterModal) {
        trustCenterBtn.addEventListener('click', () => showModal(trustCenterModal));
        if (closeTrustCenter) closeTrustCenter.addEventListener('click', () => hideModal(trustCenterModal, trustCenterBtn));
        if (understoodBtn) understoodBtn.addEventListener('click', () => hideModal(trustCenterModal, trustCenterBtn));
    }

    // --- Settings Modal ---
    if (settingsBtn && settingsModal) {
        settingsBtn.addEventListener('click', () => {
            showModal(settingsModal);
            const provider = document.getElementById('llmProvider');
            if (provider) setTimeout(() => provider.focus(), 100);
        });
        if (closeSettings) closeSettings.addEventListener('click', () => hideModal(settingsModal, settingsBtn));

        const apiKeyEl = document.getElementById('apiKey');
        const hfUrlEl = document.getElementById('hfUrl');
        const llmProviderEl = document.getElementById('llmProvider');

        // Enter to save
        [apiKeyEl, hfUrlEl].forEach(el => {
            if (el) el.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') { e.preventDefault(); if (saveSettingsBtn) saveSettingsBtn.click(); }
            });
        });

        // Load saved values
        if (apiKeyEl) apiKeyEl.value = sessionStorage.getItem('_llm_token') ? atob(sessionStorage.getItem('_llm_token')) : '';
        if (hfUrlEl) hfUrlEl.value = localStorage.getItem('hf_url') || '';
        const savedProvider = localStorage.getItem('llm_provider');
        if (savedProvider && llmProviderEl) {
            llmProviderEl.value = savedProvider;
            updateProviderHint(savedProvider);
        }
        if (llmProviderEl) llmProviderEl.addEventListener('change', (e) => updateProviderHint(e.target.value));

        // Save config
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => {
                const key = apiKeyEl ? apiKeyEl.value.trim() : '';
                const hfUrl = hfUrlEl ? hfUrlEl.value.trim() : '';
                const provider = llmProviderEl ? llmProviderEl.value : 'openai';
                sessionStorage.setItem('_llm_token', btoa(key));
                localStorage.setItem('hf_url', hfUrl);
                localStorage.setItem('llm_provider', provider);
                updateApiKeyUI();
                hideModal(settingsModal, settingsBtn);
            });
        }
    }

    // --- API Key Visibility Toggle ---
    const toggleBtn = document.getElementById('toggleApiKey');
    const eyeIcon = document.getElementById('eyeIcon');
    const apiKeyInput = document.getElementById('apiKey');
    if (toggleBtn && apiKeyInput && eyeIcon) {
        toggleBtn.addEventListener('click', () => {
            const isPassword = apiKeyInput.type === 'password';
            apiKeyInput.type = isPassword ? 'text' : 'password';
            toggleBtn.setAttribute('aria-label', isPassword ? 'Hide API Key' : 'Show API Key');
            eyeIcon.innerHTML = isPassword
                ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />'
                : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />';
        });
    }

    // --- Drag & Drop ---
    if (dropZone) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt =>
            dropZone.addEventListener(evt, (e) => { e.preventDefault(); e.stopPropagation(); }, false)
        );
        ['dragenter', 'dragover'].forEach(evt =>
            dropZone.addEventListener(evt, () => dropZone.classList.add('drag-over'), false)
        );
        ['dragleave', 'drop'].forEach(evt =>
            dropZone.addEventListener(evt, () => dropZone.classList.remove('drag-over'), false)
        );
        dropZone.addEventListener('drop', (e) => {
            fileInput.files = e.dataTransfer.files;
            updateFileList();
        }, false);
    }

    if (fileInput) fileInput.addEventListener('change', updateFileList);

    // --- User Context Character Count ---
    const userContextEl = document.getElementById('userContext');
    const charCountEl = document.getElementById('userContextCharCount');
    if (userContextEl && charCountEl) {
        userContextEl.addEventListener('input', () => {
            userContextEl.style.height = 'auto';
            userContextEl.style.height = userContextEl.scrollHeight + 'px';
            const len = userContextEl.value.length;
            charCountEl.textContent = `${len} / 2000`;
            charCountEl.style.color = len >= 1900 ? 'var(--pink)' : '';
        });
    }

    // --- FAQ Accordion ---
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const btn = item.querySelector('.faq-question');
        if (btn) {
            btn.addEventListener('click', () => {
                const isOpen = item.classList.contains('open');
                // Close all others
                faqItems.forEach(i => i.classList.remove('open'));
                if (!isOpen) item.classList.add('open');
            });
        }
    });

    // --- Provider Hint ---
    function updateProviderHint(provider) {
        const hintEl = document.getElementById('providerHint');
        const hfContainer = document.getElementById('hfUrlContainer');
        if (!hintEl) return;
        const hints = {
            'openai': 'Starts with "sk-proj-..."',
            'anthropic': 'Starts with "sk-ant-..."',
            'gemini': 'Usually a 39-character string',
            'grok': 'xAI API key',
            'huggingface': 'Starts with "hf_..."'
        };
        hintEl.textContent = hints[provider] || '';
        if (hfContainer) {
            if (provider === 'huggingface') hfContainer.classList.remove('hidden');
            else hfContainer.classList.add('hidden');
        }
    }

    // --- File List Update ---
    function updateFileList() {
        if (fileInput && fileInput.files.length > 0) {
            if (fileList) {
                fileList.classList.remove('hidden');
                const names = Array.from(fileInput.files).map(f => f.name).join(', ');
                fileList.textContent = `✅ Selected: ${names}`;
            }
            if (dropZone) {
                dropZone.style.borderStyle = 'solid';
                dropZone.style.background = 'var(--yellow)';
            }
        } else {
            if (fileList) fileList.classList.add('hidden');
            if (dropZone) {
                dropZone.style.borderStyle = '';
                dropZone.style.background = '';
            }
        }
    }

    // --- Error Helpers ---
    const showError = (message, isHTML = false) => {
        const errorContainer = document.getElementById('errorContainer');
        if (!errorContainer) { alert(message); return; }
        if (isHTML) {
            errorContainer.innerHTML = message;
        } else {
            errorContainer.innerHTML = `
                <div class="flex items-center gap-3">
                    <span style="font-size:1.5rem;flex-shrink:0">⚠️</span>
                    <p style="font-weight:700;margin:0">${message}</p>
                </div>`;
        }
        errorContainer.classList.remove('hidden');
        errorContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const hideError = () => {
        const errorContainer = document.getElementById('errorContainer');
        if (errorContainer) { errorContainer.classList.add('hidden'); errorContainer.textContent = ''; }
    };

    // --- Form Submission (Edge Migration V1.0) ---
    if (uploadForm) {
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideError();

            const analyzeBtn = document.getElementById('analyzeBtn');
            const originalBtnContent = analyzeBtn.innerHTML;

            if (!fileInput.files.length) {
                showError('Please select at least one chat export file.');
                return;
            }

            // Disable button, show progress
            analyzeBtn.disabled = true;
            analyzeBtn.classList.add('hidden');

            const progressUI = document.getElementById('progressUI');
            const loadingOverlay = document.getElementById('loading-overlay');
            const statusText = document.getElementById('statusText');
            const progressBar = document.getElementById('progressBar');

            if (progressUI) { progressUI.classList.remove('hidden'); progressUI.style.display = 'flex'; }
            if (loadingOverlay) loadingOverlay.classList.remove('hidden');

            const parser = new ChatParser();
            const analytics = new AnalyticsEngine();

            try {
                // 1. READ & PARSE (Locally)
                statusText.textContent = "Accessing files...";
                if (progressBar) progressBar.style.width = '10%';
                
                const file = fileInput.files[0];
                const content = await file.text();
                
                statusText.textContent = "Parsing & Scrubbing PII...";
                if (progressBar) progressBar.style.width = '30%';

                let rawMessages = [];
                if (file.name.endsWith('.html')) rawMessages = parser.parseTelegram(content);
                else if (file.name.endsWith('.json')) rawMessages = parser.parseInstagram(content);
                else rawMessages = parser.parseWhatsApp(content);

                if (!rawMessages.length) throw new Error("Could not extract messages. Check file format.");

                // 2. STANDARDIZE
                statusText.textContent = "Mapping personalities...";
                if (progressBar) progressBar.style.width = '50%';
                
                const myName = document.getElementById('myName').value;
                const partnerName = document.getElementById('partnerName').value;
                const filteredMessages = parser.standardizeEntities(rawMessages, myName, partnerName);
                
                if (!filteredMessages.length) {
                    throw new Error(`Name mismatch! '${myName}' or '${partnerName}' not found in chat.`);
                }

                // 3. ANALYZE
                statusText.textContent = "Calculating emotional patterns...";
                if (progressBar) progressBar.style.width = '70%';
                
                const connectionType = document.getElementById('connectionType').value;
                const analyticsResult = analytics.runPipeline(filteredMessages, connectionType);

                // 4. GENERATE REPORT (Worker Proxy)
                statusText.textContent = "AI Verdict Generation...";
                if (progressBar) progressBar.style.width = '90%';

                const payload = {
                    stats: analyticsResult,
                    my_name: myName,
                    partner_name: partnerName,
                    connection_type: connectionType,
                    tone: document.getElementById('analysisTone').value,
                    context: document.getElementById('userContext')?.value || '',
                    api_key: sessionStorage.getItem('_llm_token') ? atob(sessionStorage.getItem('_llm_token')) : '',
                    provider: localStorage.getItem('llm_provider') || 'openai'
                };

                const response = await fetch('/api/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.error || "AI generation failed.");
                }

                const result = await response.json();
                
                // Store result for dashboard
                sessionStorage.setItem('dashboard_data', JSON.stringify({
                    stats: analyticsResult,
                    report: result.report
                }));

                if (progressBar) progressBar.style.width = '100%';
                window.location.href = '/dashboard';

            } catch (err) {
                showError(err.message);
                analyzeBtn.disabled = false;
                analyzeBtn.classList.remove('hidden');
                if (progressUI) { progressUI.classList.add('hidden'); progressUI.style.display = 'none'; }
                if (loadingOverlay) loadingOverlay.classList.add('hidden');
            }
        });
    }
});
