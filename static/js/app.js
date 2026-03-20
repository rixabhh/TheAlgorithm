document.addEventListener('DOMContentLoaded', () => {

    // --- index.html Logic ---
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('chatFile');
    const uploadForm = document.getElementById('uploadForm');
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettings = document.getElementById('closeSettings');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const fileList = document.getElementById('fileList');

    // API Key UI Status
    const updateApiKeyUI = () => {
        const icon = document.getElementById('apiKeyStatusIcon');
        const text = document.getElementById('apiKeyStatusText');
        if (!icon || !text) return;

        const key = sessionStorage.getItem('_llm_token');
        if (key && key.trim() !== "" && key !== btoa("")) {
            icon.classList.remove('text-brand-400');
            icon.classList.add('text-emerald-400');
            text.textContent = 'API Key Configured';
            text.classList.remove('text-gray-300');
            text.classList.add('text-emerald-400');
        } else {
            icon.classList.add('text-brand-400');
            icon.classList.remove('text-emerald-400');
            text.textContent = 'API Key Required';
            text.classList.add('text-gray-300');
            text.classList.remove('text-emerald-400');
        }
    };
    updateApiKeyUI();

    // --- Trust Center Logic ---
    const trustCenterBtn = document.getElementById('trustCenterBtn');
    const trustCenterModal = document.getElementById('trustCenterModal');
    const closeTrustCenter = document.getElementById('closeTrustCenter');
    const understoodBtn = document.getElementById('understoodBtn');

    // Shared modal helpers
    const hideTrustCenter = () => {
        trustCenterModal.classList.add('opacity-0');
        document.getElementById('trustCenterContent').classList.add('scale-95');
        setTimeout(() => {
            trustCenterModal.classList.add('hidden');
            trustCenterModal.classList.remove('flex');
            if (trustCenterBtn) trustCenterBtn.focus();
        }, 300);
    };

    const hideSettings = () => {
        settingsModal.classList.add('opacity-0');
        document.getElementById('settingsContent').classList.add('scale-95');
        setTimeout(() => {
            settingsModal.classList.add('hidden');
            settingsModal.classList.remove('flex');
            if (settingsBtn) settingsBtn.focus();
        }, 300);
    };

    // Close modals on Escape key or outside click
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (trustCenterModal && !trustCenterModal.classList.contains('hidden')) hideTrustCenter();
            if (settingsModal && !settingsModal.classList.contains('hidden')) hideSettings();
        }
    });

    [trustCenterModal, settingsModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    if (modal === trustCenterModal) hideTrustCenter();
                    if (modal === settingsModal) hideSettings();
                }
            });
        }
    });

    if (trustCenterBtn && trustCenterModal) {
        trustCenterBtn.addEventListener('click', () => {
            trustCenterModal.classList.remove('hidden');
            trustCenterModal.classList.add('flex');
            setTimeout(() => {
                trustCenterModal.classList.remove('opacity-0');
                document.getElementById('trustCenterContent').classList.remove('scale-95');
                const firstBtn = trustCenterModal.querySelector('button');
                if (firstBtn) firstBtn.focus();
            }, 10);
        });

        closeTrustCenter.addEventListener('click', hideTrustCenter);
        understoodBtn.addEventListener('click', hideTrustCenter);
    }

    // Settings Modal
    if (settingsBtn && settingsModal) {
        settingsBtn.addEventListener('click', () => {
            settingsModal.classList.remove('hidden');
            settingsModal.classList.add('flex');
            setTimeout(() => {
                settingsModal.classList.remove('opacity-0');
                document.getElementById('settingsContent').classList.remove('scale-95');
                const provider = document.getElementById('llmProvider');
                if (provider) provider.focus();
            }, 10);
        });

        closeSettings.addEventListener('click', hideSettings);

        // Load config
        const apiKeyEl = document.getElementById('apiKey');
        const hfUrlEl = document.getElementById('hfUrl');
        const llmProviderEl = document.getElementById('llmProvider');

        // Allow Save with Enter key
        [apiKeyEl, hfUrlEl].forEach(el => {
            if (el) {
                el.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        if (saveSettingsBtn) saveSettingsBtn.click();
                    }
                });
            }
        });

        if (apiKeyEl) apiKeyEl.value = sessionStorage.getItem('_llm_token') ? atob(sessionStorage.getItem('_llm_token')) : '';

        // API Key visibility toggle
        const toggleBtn = document.getElementById('toggleApiKey');
        const eyeIcon = document.getElementById('eyeIcon');
        if (toggleBtn && apiKeyEl && eyeIcon) {
            toggleBtn.addEventListener('click', () => {
                const isPassword = apiKeyEl.type === 'password';
                apiKeyEl.type = isPassword ? 'text' : 'password';
                toggleBtn.setAttribute('aria-label', isPassword ? 'Hide API Key' : 'Show API Key');

                // Update SVG to show/hide slash for hidden state
                if (isPassword) {
                    eyeIcon.innerHTML = `
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    `;
                } else {
                    eyeIcon.innerHTML = `
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    `;
                }
            });
        }

        if (hfUrlEl) hfUrlEl.value = localStorage.getItem('hf_url') || '';
        const savedProvider = localStorage.getItem('llm_provider');
        if (savedProvider && llmProviderEl) llmProviderEl.value = savedProvider;

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
                hideSettings();
            });
        }
    }

    // Drag & Drop
    if (dropZone) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('dropzone-active'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('dropzone-active'), false);
        });

        dropZone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            fileInput.files = files;
            updateFileList();
        }, false);
    }

    if (fileInput) {
        fileInput.addEventListener('change', updateFileList);
    }

    // Auto-expand User Context textarea and update character count
    const userContextEl = document.getElementById('userContext');
    const charCountEl = document.getElementById('userContextCharCount');

    if (userContextEl && charCountEl) {
        userContextEl.addEventListener('input', () => {
            userContextEl.style.height = 'auto';
            userContextEl.style.height = (userContextEl.scrollHeight) + 'px';
            const len = userContextEl.value.length;
            charCountEl.textContent = `${len} / 2000`;
            charCountEl.className = `text-[10px] text-right mt-1 ${len >= 1900 ? 'text-brand-400' : 'text-gray-500'}`;
        });
    }

    function updateFileList() {
        if (fileInput && fileInput.files.length > 0) {
            fileList.classList.remove('hidden');
            const names = Array.from(fileInput.files).map(f => f.name).join(', ');
            fileList.textContent = `Selected: ${names}`;
            if (dropZone) dropZone.classList.add('dropzone-success');
        } else if (fileList) {
            fileList.classList.add('hidden');
            if (dropZone) dropZone.classList.remove('dropzone-success');
        }
    }

    // --- Error Handling Helper ---
    const showError = (message) => {
        const errorContainer = document.getElementById('errorContainer');
        if (errorContainer) {
            errorContainer.textContent = message;
            errorContainer.classList.remove('hidden');
            errorContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            alert(message);
        }
    };

    const hideError = () => {
        const errorContainer = document.getElementById('errorContainer');
        if (errorContainer) {
            errorContainer.classList.add('hidden');
            errorContainer.textContent = '';
        }
    };

    // Form Submission
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
                showError('An AI API Key is required to run the analysis. Please click the Settings gear icon ⚙️ in the top right to configure your API key first. (e.g. Google Gemini 2.5 Flash is quick to set up!)');
                return;
            }

            // Disable button and show loading state
            analyzeBtn.disabled = true;
            analyzeBtn.classList.add('hidden');

            const progressUI = document.getElementById('progressUI');
            progressUI.classList.remove('hidden');
            progressUI.classList.add('flex');

            const formData = new FormData();
            formData.append('my_name', document.getElementById('myName').value);
            formData.append('partner_name', document.getElementById('partnerName').value);
            formData.append('connection_type', document.getElementById('connectionType').value);
            formData.append('output_language', document.getElementById('outputLanguage').value);
            formData.append('user_context', document.getElementById('userContext')?.value || '');

            const isSensitive = document.getElementById('sensitiveMode')?.checked || false;
            localStorage.setItem('sensitiveMode', isSensitive);

            formData.append('api_key', apiKey);
            formData.append('llm_provider', localStorage.getItem('llm_provider') || 'openai');
            formData.append('hf_url', localStorage.getItem('hf_url') || '');

            // PII Scrubbing Function
            const scrubPII = async (file) => {
                return new Promise((resolve, reject) => {
                    // Only scrub text-based files (txt, html, json)
                    if (!['text/plain', 'text/html', 'application/json'].includes(file.type) && !file.name.endsWith('.txt') && !file.name.endsWith('.html')) {
                        return resolve(file); // Return original if not text
                    }

                    const reader = new FileReader();
                    reader.onload = (e) => {
                        let text = e.target.result;

                        // Regex for Phone Numbers (International and US formats)
                        const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
                        // Regex for Email Addresses
                        const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;

                        if (file.type === 'application/json' || file.name.endsWith('.json')) {
                            try {
                                const jsonObj = JSON.parse(text);
                                const recurse = (obj) => {
                                    if (typeof obj === 'string') {
                                        return obj.replace(phoneRegex, '[PHONE_REDACTED]').replace(emailRegex, '[EMAIL_REDACTED]');
                                    } else if (Array.isArray(obj)) {
                                        return obj.map(recurse);
                                    } else if (obj !== null && typeof obj === 'object') {
                                        const newObj = {};
                                        for (let key in obj) {
                                            newObj[key] = recurse(obj[key]);
                                        }
                                        return newObj;
                                    }
                                    return obj;
                                };
                                text = JSON.stringify(recurse(jsonObj));
                            } catch (e) {
                                console.warn("JSON scrub failed, preserving formatting to prevent data loss.", e);
                            }
                        } else {
                            text = text.replace(phoneRegex, '[PHONE_REDACTED]');
                            text = text.replace(emailRegex, '[EMAIL_REDACTED]');
                        }

                        // Create new file from scrubbed text
                        const blob = new Blob([text], { type: file.type || 'text/plain' });
                        // Create a new File object retaining the original name
                        const scrubbedFile = new File([blob], file.name, { type: file.type || 'text/plain', lastModified: new Date().getTime() });
                        resolve(scrubbedFile);
                    };
                    reader.onerror = (err) => reject(err);
                    reader.readAsText(file);
                });
            };

            // Process all files with the scrubber before sending
            try {
                // Determine if we need to show the scrubbing indicator
                const indicator = document.getElementById('scrubbingIndicator');
                if (fileInput.files.length > 0 && indicator) {
                    indicator.classList.remove('hidden');
                    indicator.classList.add('flex');
                }

                // Process files concurrently
                const filePromises = Array.from(fileInput.files).map(file => scrubPII(file));
                const scrubbedFiles = await Promise.all(filePromises);

                scrubbedFiles.forEach(file => {
                    formData.append('chat_files', file);
                });

                // Hide indicator if parsing is extremely fast
                if (indicator) {
                    setTimeout(() => {
                        indicator.classList.add('hidden');
                        indicator.classList.remove('flex');
                    }, 1000);
                }

            } catch (err) {
                console.error("Error scrubbing files:", err);
                showError("An error occurred while locally preparing your files for upload.");
                analyzeBtn.classList.remove('hidden');
                analyzeBtn.innerHTML = originalBtnContent;
                analyzeBtn.disabled = false;
                progressUI.classList.add('hidden');
                progressUI.classList.remove('flex');
                return;
            }

            // Polling and fetch call
            const steps = [
                "Uploading files securely...",
                "Running NLP Extractors...",
                "Initializing NLP Transformers on CPU...",
                "Scoring Sentiments (Private Local Quantization)...",
                "Calculating Risk Scores & Latency...",
                "Erasing raw text data...",
                "Requesting LLM Assessment...",
                "Finalizing Report..."
            ];
            let stepIdx = 0;
            let timeRemaining = 25; // Rough estimate for an average chat

            const statusText = document.getElementById('statusText');
            const progressBar = document.getElementById('progressBar');
            const estimatedTime = document.getElementById('estimatedTime');
            const progressBarContainer = document.getElementById('progressBarContainer');

            const stepInterval = setInterval(() => {
                if (stepIdx < steps.length && statusText) {
                    statusText.textContent = steps[stepIdx];
                    const percent = ((stepIdx + 1) / steps.length) * 100;
                    if (progressBar) progressBar.style.width = `${percent}%`;
                    if (progressBarContainer) progressBarContainer.setAttribute('aria-valuenow', Math.round(percent));
                    stepIdx++;
                }
            }, 2500); // 2.5s per step visual

            const timeInterval = setInterval(() => {
                timeRemaining--;
                if (estimatedTime) {
                    if (timeRemaining > 0) {
                        estimatedTime.textContent = `Est: ~${timeRemaining}s`;
                    } else {
                        estimatedTime.textContent = "Almost done...";
                    }
                }
            }, 1000);

            try {
                const response = await fetch('/process', {
                    method: 'POST',
                    body: formData
                });

                clearInterval(stepInterval);
                clearInterval(timeInterval);

                if (response.ok) {
                    if (progressBar) progressBar.style.width = '100%';
                    if (progressBarContainer) progressBarContainer.setAttribute('aria-valuenow', 100);
                    window.location.href = '/dashboard';
                } else {
                    const err = await response.json();
                    showError(`Error: ${err.error}`);
                    analyzeBtn.disabled = false;
                    analyzeBtn.innerHTML = originalBtnContent;
                    analyzeBtn.classList.remove('opacity-80', 'cursor-not-allowed', 'hidden');
                    document.getElementById('progressUI').classList.add('hidden');
                }
            } catch (error) {
                clearInterval(stepInterval);
                clearInterval(timeInterval);
                showError('Network Error. Ensure backend is running.');
                analyzeBtn.disabled = false;
                analyzeBtn.innerHTML = originalBtnContent;
                analyzeBtn.classList.remove('opacity-80', 'cursor-not-allowed', 'hidden');
                document.getElementById('progressUI').classList.add('hidden');
            }
        });
    }
});
