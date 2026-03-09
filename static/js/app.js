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

    // --- Trust Center Logic ---
    const trustCenterBtn = document.getElementById('trustCenterBtn');
    const trustCenterModal = document.getElementById('trustCenterModal');
    const closeTrustCenter = document.getElementById('closeTrustCenter');
    const understoodBtn = document.getElementById('understoodBtn');

    if (trustCenterBtn && trustCenterModal) {
        trustCenterBtn.addEventListener('click', () => {
            trustCenterModal.classList.remove('hidden');
            trustCenterModal.classList.add('flex');
            setTimeout(() => {
                trustCenterModal.classList.remove('opacity-0');
                document.getElementById('trustCenterContent').classList.remove('scale-95');
            }, 10);
        });

        const hideTrustCenter = () => {
            trustCenterModal.classList.add('opacity-0');
            document.getElementById('trustCenterContent').classList.add('scale-95');
            setTimeout(() => {
                trustCenterModal.classList.add('hidden');
                trustCenterModal.classList.remove('flex');
            }, 300);
        };
        closeTrustCenter.addEventListener('click', hideTrustCenter);
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
            }, 10);
        });

        const hideSettings = () => {
            settingsModal.classList.add('opacity-0');
            document.getElementById('settingsContent').classList.add('scale-95');
            setTimeout(() => {
                settingsModal.classList.add('hidden');
                settingsModal.classList.remove('flex');
            }, 300);
        };
        closeSettings.addEventListener('click', hideSettings);

        // Load config
        const apiKeyEl = document.getElementById('apiKey');
        const hfUrlEl = document.getElementById('hfUrl');
        const llmProviderEl = document.getElementById('llmProvider');

        if (apiKeyEl) apiKeyEl.value = localStorage.getItem('api_key') || '';
        if (hfUrlEl) hfUrlEl.value = localStorage.getItem('hf_url') || '';
        const savedProvider = localStorage.getItem('llm_provider');
        if (savedProvider && llmProviderEl) llmProviderEl.value = savedProvider;

        // Save config
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => {
                const key = apiKeyEl ? apiKeyEl.value.trim() : '';
                const hfUrl = hfUrlEl ? hfUrlEl.value.trim() : '';
                const provider = llmProviderEl ? llmProviderEl.value : 'openai';
                localStorage.setItem('api_key', key);
                localStorage.setItem('hf_url', hfUrl);
                localStorage.setItem('llm_provider', provider);
                hideSettings();
            });
        }

        // Drag & Drop
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('border-brand-500', 'bg-white/[0.05]'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('border-brand-500', 'bg-white/[0.05]'), false);
        });

        dropZone.addEventListener('drop', handleDrop, false);

        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            fileInput.files = files;
            updateFileList();
        }

        fileInput.addEventListener('change', updateFileList);

        function updateFileList() {
            if (fileInput.files.length > 0) {
                fileList.classList.remove('hidden');
                const names = Array.from(fileInput.files).map(f => f.name).join(', ');
                fileList.textContent = `Selected: ${names}`;
            } else {
                fileList.classList.add('hidden');
            }
        }

        // Form Submission
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (fileInput.files.length === 0) {
                alert('Please select at least one chat export file.');
                return;
            }

            const apiKey = localStorage.getItem('api_key') || '';
            if (!apiKey) {
                alert('An AI API Key is required to run the analysis. Please click the Settings gear icon ⚙️ in the top right to configure your API key first. (e.g. Google Gemini 2.5 Flash is quick to set up!)');
                return;
            }

            const formData = new FormData();
            formData.append('my_name', document.getElementById('myName').value);
            formData.append('partner_name', document.getElementById('partnerName').value);
            formData.append('connection_type', document.getElementById('connectionType').value);
            formData.append('output_language', document.getElementById('outputLanguage').value);
            formData.append('user_context', document.getElementById('userContext')?.value || '');

            const isSensitive = document.getElementById('sensitiveMode')?.checked || false;
            localStorage.setItem('sensitiveMode', isSensitive);

            formData.append('api_key', localStorage.getItem('api_key') || '');
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

                        text = text.replace(phoneRegex, '[PHONE_REDACTED]');
                        text = text.replace(emailRegex, '[EMAIL_REDACTED]');

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
                alert("An error occurred while locally preparing your files for upload.");
                document.getElementById('analyzeBtn').classList.remove('hidden');
                document.getElementById('progressUI').classList.add('hidden');
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

            const stepInterval = setInterval(() => {
                if (stepIdx < steps.length) {
                    statusText.textContent = steps[stepIdx];
                    progressBar.style.width = `${((stepIdx + 1) / steps.length) * 100}%`;
                    stepIdx++;
                }
            }, 2500); // 2.5s per step visual

            const timeInterval = setInterval(() => {
                timeRemaining--;
                if (timeRemaining > 0) {
                    estimatedTimeEl.textContent = `Est: ~${timeRemaining}s`;
                } else {
                    estimatedTimeEl.textContent = "Almost done...";
                }
            }, 1000);

            try {
                const response = await fetch('/process', {
                    method: 'POST',
                    body: formData
                });

                clearInterval(stepInterval);
                clearInterval(timeInterval);
                progressBar.style.width = '100%';

                if (response.ok) {
                    window.location.href = '/dashboard';
                } else {
                    const err = await response.json();
                    alert(`Error: ${err.error}`);
                    document.getElementById('analyzeBtn').classList.remove('hidden');
                    document.getElementById('progressUI').classList.add('hidden');
                }
            } catch (error) {
                clearInterval(stepInterval);
                clearInterval(timeInterval);
                alert('Network Error. Ensure backend is running.');
                document.getElementById('analyzeBtn').classList.remove('hidden');
                document.getElementById('progressUI').classList.add('hidden');
            }
        });
    }
});
