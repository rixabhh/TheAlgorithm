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

    const turboBtn = document.getElementById('turboBtn');
    const turboModal = document.getElementById('turboModal');
    const closeTurbo = document.getElementById('closeTurbo');

    if (uploadForm) {

        // Settings Modal
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
        document.getElementById('apiKey').value = localStorage.getItem('api_key') || '';
        document.getElementById('hfUrl').value = localStorage.getItem('hf_url') || '';
        const savedProvider = localStorage.getItem('llm_provider');
        if (savedProvider) document.getElementById('llmProvider').value = savedProvider;

        // Save config
        saveSettingsBtn.addEventListener('click', () => {
            const key = document.getElementById('apiKey').value.trim();
            const hfUrl = document.getElementById('hfUrl').value.trim();
            const provider = document.getElementById('llmProvider').value;
            localStorage.setItem('api_key', key);
            localStorage.setItem('hf_url', hfUrl);
            localStorage.setItem('llm_provider', provider);
            hideSettings();
        });

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

            Array.from(fileInput.files).forEach(file => {
                formData.append('chat_files', file);
            });

            // UI feedback
            document.getElementById('analyzeBtn').classList.add('hidden');
            document.getElementById('progressUI').classList.remove('hidden');
            const statusText = document.getElementById('statusText');
            const progressBar = document.getElementById('progressBar');
            const estimatedTimeEl = document.getElementById('estimatedTime');

            // Poll text and progress
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
