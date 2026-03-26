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

    // --- Form Submission ---
    if (uploadForm) {
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideError();

            const analyzeBtn = document.getElementById('analyzeBtn');
            const originalBtnContent = analyzeBtn.innerHTML;

            if (fileInput.files.length === 0) {
                showError('Please select at least one chat export file.');
                return;
            }

            const apiKey = sessionStorage.getItem('_llm_token') ? atob(sessionStorage.getItem('_llm_token')) : '';
            if (!apiKey) {
                const errorHtml = `
                    <div style="display:flex;flex-direction:column;gap:1rem">
                        <div class="flex items-center gap-3">
                            <span style="font-size:2rem;flex-shrink:0">🔑</span>
                            <div>
                                <p style="font-family:var(--font-heading);font-weight:900;font-size:1rem;margin:0 0 .25rem;text-transform:uppercase">API Key Required</p>
                                <p style="font-size:.85rem;color:var(--gray-600);margin:0">An AI API Key is needed to generate your relationship insights.</p>
                            </div>
                        </div>
                        <div class="flex gap-3">
                            <button type="button" id="configKeyBtn" class="btn btn--purple" style="font-size:.7rem;padding:.4rem 1rem;flex:1">Configure Key</button>
                            <a href="/instructions#api-keys" class="btn btn--yellow" style="font-size:.7rem;padding:.4rem 1rem;flex:1;text-decoration:none;text-align:center">Get Free Key</a>
                        </div>
                    </div>`;
                showError(errorHtml, true);
                const configBtn = document.getElementById('configKeyBtn');
                if (configBtn) configBtn.addEventListener('click', () => {
                    if (settingsBtn) settingsBtn.click();
                });
                return;
            }

            // Disable button, show progress
            analyzeBtn.disabled = true;
            analyzeBtn.classList.add('hidden');

            const progressUI = document.getElementById('progressUI');
            const loadingOverlay = document.getElementById('loading-overlay');
            if (progressUI) { progressUI.classList.remove('hidden'); progressUI.style.display = 'flex'; }
            if (loadingOverlay) { loadingOverlay.classList.remove('hidden'); }

            const formData = new FormData();
            formData.append('my_name', document.getElementById('myName').value);
            formData.append('partner_name', document.getElementById('partnerName').value);
            formData.append('connection_type', document.getElementById('connectionType').value);
            formData.append('output_language', document.getElementById('outputLanguage').value);
            formData.append('user_context', document.getElementById('userContext')?.value || '');

            const analysisTone = document.getElementById('analysisTone')?.value || 'balanced';
            formData.append('analysis_tone', analysisTone);

            formData.append('api_key', apiKey);
            formData.append('llm_provider', localStorage.getItem('llm_provider') || 'openai');
            formData.append('hf_url', localStorage.getItem('hf_url') || '');

            // --- PII Scrubbing ---
            const scrubPII = async (file) => {
                return new Promise((resolve, reject) => {
                    if (!['text/plain', 'text/html', 'application/json'].includes(file.type) && !file.name.endsWith('.txt') && !file.name.endsWith('.html')) {
                        return resolve(file);
                    }
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        let text = ev.target.result;
                        const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
                        const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;

                        if (file.type === 'application/json' || file.name.endsWith('.json')) {
                            try {
                                const jsonObj = JSON.parse(text);
                                const recurse = (obj) => {
                                    if (typeof obj === 'string') return obj.replace(phoneRegex, '[PHONE_REDACTED]').replace(emailRegex, '[EMAIL_REDACTED]');
                                    if (Array.isArray(obj)) return obj.map(recurse);
                                    if (obj !== null && typeof obj === 'object') {
                                        const newObj = {};
                                        for (let key in obj) newObj[key] = recurse(obj[key]);
                                        return newObj;
                                    }
                                    return obj;
                                };
                                text = JSON.stringify(recurse(jsonObj));
                            } catch (err) { console.warn("JSON scrub failed", err); }
                        } else {
                            text = text.replace(phoneRegex, '[PHONE_REDACTED]').replace(emailRegex, '[EMAIL_REDACTED]');
                        }

                        const blob = new Blob([text], { type: file.type || 'text/plain' });
                        resolve(new File([blob], file.name, { type: file.type || 'text/plain', lastModified: Date.now() }));
                    };
                    reader.onerror = reject;
                    reader.readAsText(file);
                });
            };

            try {
                const indicator = document.getElementById('scrubbingIndicator');
                if (fileInput.files.length > 0 && indicator) {
                    indicator.classList.remove('hidden');
                    indicator.style.display = 'flex';
                }
                const scrubbedFiles = await Promise.all(Array.from(fileInput.files).map(f => scrubPII(f)));
                scrubbedFiles.forEach(f => formData.append('chat_files', f));
                if (indicator) setTimeout(() => { indicator.classList.add('hidden'); indicator.style.display = 'none'; }, 1000);
            } catch (err) {
                console.error("Scrub error:", err);
                showError("An error occurred while locally preparing your files.");
                analyzeBtn.classList.remove('hidden'); analyzeBtn.innerHTML = originalBtnContent; analyzeBtn.disabled = false;
                if (progressUI) { progressUI.classList.add('hidden'); progressUI.style.display = 'none'; }
                if (loadingOverlay) loadingOverlay.classList.add('hidden');
                return;
            }

            // --- Progress Steps ---
            const steps = [
                "Uploading files securely...", "Running NLP Extractors...",
                "Initializing NLP Transformers on CPU...", "Scoring Sentiments (Private Local Quantization)...",
                "Calculating Risk Scores & Latency...", "Erasing raw text data...",
                "Requesting LLM Assessment...", "Finalizing Report..."
            ];
            let stepIdx = 0, timeRemaining = 25;
            const statusText = document.getElementById('statusText');
            const progressBar = document.getElementById('progressBar');
            const estimatedTime = document.getElementById('estimatedTime');
            const progressBarContainer = document.getElementById('progressBarContainer');

            const stepInterval = setInterval(() => {
                if (stepIdx < steps.length && statusText) {
                    statusText.textContent = steps[stepIdx];
                    const pct = ((stepIdx + 1) / steps.length) * 100;
                    if (progressBar) progressBar.style.width = `${pct}%`;
                    if (progressBarContainer) progressBarContainer.setAttribute('aria-valuenow', Math.round(pct));
                    stepIdx++;
                }
            }, 2500);

            const timeInterval = setInterval(() => {
                timeRemaining--;
                if (estimatedTime) {
                    estimatedTime.textContent = timeRemaining > 0 ? `Est: ~${timeRemaining}s` : "Almost done...";
                }
            }, 1000);

            try {
                const response = await fetch('/process', { method: 'POST', body: formData });
                clearInterval(stepInterval);
                clearInterval(timeInterval);

                if (response.ok) {
                    if (progressBar) progressBar.style.width = '100%';
                    if (progressBarContainer) progressBarContainer.setAttribute('aria-valuenow', 100);
                    window.location.href = '/dashboard';
                } else {
                    const err = await response.json();
                    showError(`Error: ${err.error}`);
                    analyzeBtn.disabled = false; analyzeBtn.innerHTML = originalBtnContent; analyzeBtn.classList.remove('hidden');
                    if (progressUI) { progressUI.classList.add('hidden'); progressUI.style.display = 'none'; }
                    if (loadingOverlay) loadingOverlay.classList.add('hidden');
                }
            } catch (error) {
                clearInterval(stepInterval);
                clearInterval(timeInterval);
                showError('Network Error. Ensure backend is running.');
                analyzeBtn.disabled = false; analyzeBtn.innerHTML = originalBtnContent; analyzeBtn.classList.remove('hidden');
                if (progressUI) { progressUI.classList.add('hidden'); progressUI.style.display = 'none'; }
                if (loadingOverlay) loadingOverlay.classList.add('hidden');
            }
        });
    }
});
