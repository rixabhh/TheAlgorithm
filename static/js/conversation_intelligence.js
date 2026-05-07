/**
 * Source-agnostic conversation normalization and evidence extraction.
 * Runs in the browser so raw conversation content stays local by default.
 */
class ConversationIntelligence {
    constructor() {
        this.parser = new ChatParser();
    }

    getInputModeLabel(mode) {
        return {
            export: 'Export File',
            paste: 'Pasted Chat',
            screenshots: 'Screenshots',
            transcript: 'Transcript'
        }[mode] || 'Conversation';
    }

    parsePaste(text, platformHint = 'Paste') {
        const trimmed = (text || '').trim();
        if (!trimmed) return [];
        const detected = this.parser.detect(trimmed, `${platformHint}.txt`);
        let parsed = [];
        if (detected === 'WhatsApp') parsed = this.parser.parseWhatsApp(trimmed);
        if (detected === 'Signal') parsed = this.parser.parseSignal(trimmed);
        if (!parsed.length) parsed = this.parseLooseLines(trimmed, 'paste');
        return parsed;
    }

    parseTranscript(text) {
        const cleaned = (text || '')
            .replace(/WEBVTT/gi, '')
            .replace(/^\d+\s*$/gm, '')
            .replace(/\d{2}:\d{2}:\d{2}[,.]\d{3}\s+-->\s+\d{2}:\d{2}:\d{2}[,.]\d{3}/g, '')
            .replace(/\[[^\]]*(music|applause|silence)[^\]]*\]/gi, '')
            .trim();
        return this.parseLooseLines(cleaned, 'transcript');
    }

    parseLooseLines(text, sourceType) {
        const lines = (text || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        const messages = [];
        let syntheticTime = Date.now() - (lines.length * 60000);
        let lastSender = null;

        const withDate = /^\[?(?<date>\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2})[,\s]+(?<time>\d{1,2}:\d{2}(?::\d{2})?(?:\s*[aApP]\.?[mM]\.?)?)\]?\s*(?:[-–]\s*)?(?<sender>[^:]{1,80}):\s*(?<text>.*)$/;
        const speakerLine = /^(?<sender>[A-Za-z0-9 ._'()+-]{1,80}):\s*(?<text>.+)$/;

        for (const line of lines) {
            let match = line.match(withDate);
            if (match?.groups) {
                const timestamp = this.parser.parseDateTime(`${match.groups.date} ${match.groups.time}`) || new Date(syntheticTime);
                messages.push({
                    timestamp,
                    sender: match.groups.sender.trim(),
                    text: match.groups.text.trim(),
                    source_type: sourceType,
                    confidence: 0.86
                });
                syntheticTime = timestamp.getTime() + 60000;
                lastSender = match.groups.sender.trim();
                continue;
            }

            match = line.match(speakerLine);
            if (match?.groups) {
                messages.push({
                    timestamp: new Date(syntheticTime),
                    sender: match.groups.sender.trim(),
                    text: match.groups.text.trim(),
                    source_type: sourceType,
                    confidence: sourceType === 'transcript' ? 0.72 : 0.68
                });
                syntheticTime += 60000;
                lastSender = match.groups.sender.trim();
                continue;
            }

            if (messages.length && lastSender) {
                messages[messages.length - 1].text += ` ${line}`;
                messages[messages.length - 1].confidence = Math.min(messages[messages.length - 1].confidence || 0.6, 0.62);
            }
        }

        return messages;
    }

    async readScreenshots(files, onProgress) {
        const imageFiles = Array.from(files || []).filter(file => /^image\//.test(file.type));
        if (!imageFiles.length) return { text: '', confidence: 0, warnings: ['No screenshot images selected.'] };
        await this.ensureTesseract();

        let combinedText = '';
        let confidenceTotal = 0;
        let completed = 0;

        for (const file of imageFiles) {
            onProgress?.(`Reading screenshot ${completed + 1}/${imageFiles.length}...`, Math.round((completed / imageFiles.length) * 80));
            const result = await window.Tesseract.recognize(file, 'eng');
            combinedText += `\n${result?.data?.text || ''}`;
            confidenceTotal += Number(result?.data?.confidence || 0);
            completed += 1;
        }

        const confidence = imageFiles.length ? Math.round(confidenceTotal / imageFiles.length) : 0;
        const warnings = [];
        if (confidence < 65) warnings.push('OCR confidence is low. Review and correct the extracted text before analysing.');
        return { text: combinedText.trim(), confidence, warnings };
    }

    ensureTesseract() {
        if (window.Tesseract) return Promise.resolve();
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('OCR engine could not be loaded. Paste the screenshot text manually to continue.'));
            document.head.appendChild(script);
        });
    }

    standardize(rawMessages, myName, partnerName, sourceType, platform, confidence = 0.9) {
        const enriched = (rawMessages || [])
            .map((m, index) => ({
                ...m,
                text: String(m.text || '').trim(),
                timestamp: m.timestamp instanceof Date ? m.timestamp : new Date(m.timestamp),
                source_type: m.source_type || sourceType,
                source_platform: platform,
                confidence: Number.isFinite(Number(m.confidence)) ? Number(m.confidence) : confidence,
                evidence_ref: `${sourceType}-${index + 1}`
            }))
            .filter(m => m.text && !Number.isNaN(m.timestamp.getTime()));

        const mapped = this.parser.standardizeEntities(enriched, myName, partnerName);
        return mapped.map((m, index) => ({
            ...m,
            evidence_ref: m.evidence_ref || `${sourceType}-${index + 1}`
        }));
    }

    assessSourceQuality(messages, inputMode, extra = {}) {
        const warnings = [...(extra.warnings || [])];
        const parsedCount = messages.length;
        const lowConfidenceCount = messages.filter(m => Number(m.confidence || 0) < 0.7).length;
        const missingTimestampPenalty = inputMode === 'paste' || inputMode === 'transcript' ? 10 : 0;
        const confidenceAvg = parsedCount
            ? messages.reduce((sum, m) => sum + Number(m.confidence || 0.7), 0) / parsedCount
            : 0;
        let score = Math.round(confidenceAvg * 100) - missingTimestampPenalty;
        if (parsedCount < 30) {
            score -= 15;
            warnings.push('Small sample size. Prediction confidence is reduced.');
        }
        if (lowConfidenceCount > Math.max(3, parsedCount * 0.25)) {
            score -= 10;
            warnings.push('Several messages were parsed with low confidence.');
        }
        if (inputMode === 'paste' || inputMode === 'transcript') {
            warnings.push('Some timestamps may be synthetic, so timing-based predictions are less certain.');
        }
        score = Math.max(0, Math.min(100, score));
        return {
            score,
            warnings: Array.from(new Set(warnings)),
            parsed_count: parsedCount,
            low_confidence_count: lowConfidenceCount,
            input_mode: inputMode,
            ocr_confidence: extra.ocr_confidence || null
        };
    }

    buildEvidencePack(messages, stats, sourceQuality) {
        const receipts = [];
        const bySender = { ME: [], PARTNER: [] };
        messages.forEach(m => { if (bySender[m.sender]) bySender[m.sender].push(m); });

        const countPattern = (sender, regex) => bySender[sender].filter(m => regex.test(m.text || '')).length;
        const unansweredQuestions = this.findUnansweredQuestions(messages);
        const delayedAfterConflict = this.findDelayedAfterConflict(messages);
        const boundaryPressure = countPattern('PARTNER', /\b(you always|you never|if you cared|prove|your fault|because of you|stop overreacting)\b/i)
            + countPattern('ME', /\b(you always|you never|if you cared|prove|your fault|because of you|stop overreacting)\b/i);
        const repairAttempts = countPattern('ME', /\b(sorry|my bad|let's talk|can we fix|i understand|i hear you)\b/i)
            + countPattern('PARTNER', /\b(sorry|my bad|let's talk|can we fix|i understand|i hear you)\b/i);

        const init = stats?.initiator_ratio || {};
        const meLatency = Number(init.me_latency_avg || 0);
        const partnerLatency = Number(init.partner_latency_avg || 0);
        if (meLatency && partnerLatency) {
            const slower = partnerLatency > meLatency ? 'Partner' : 'You';
            const ratio = Math.max(meLatency, partnerLatency) / Math.max(1, Math.min(meLatency, partnerLatency));
            if (ratio >= 1.8) {
                receipts.push(this.receipt(
                    'Reply-speed imbalance',
                    `${slower} replies about ${ratio.toFixed(1)}x slower on average.`,
                    'response_delay',
                    ratio > 2.5 ? 'high' : 'medium',
                    'Use the timing pattern as a signal, not a verdict. Ask for the response rhythm you need.'
                ));
            }
        }

        if (unansweredQuestions.count >= 3) {
            receipts.push(this.receipt(
                'Unanswered question loop',
                `${unansweredQuestions.count} questions appear to go unanswered or get topic-switched.`,
                'avoidance_or_topic_switch',
                unansweredQuestions.count >= 8 ? 'high' : 'medium',
                'Ask one direct question at a time and watch whether the answer gets addressed.'
            ));
        }

        if (delayedAfterConflict.count >= 2) {
            receipts.push(this.receipt(
                'Conflict creates distance',
                `${delayedAfterConflict.count} tense moments were followed by a long delay or silence.`,
                'conflict_delay',
                delayedAfterConflict.count >= 5 ? 'high' : 'medium',
                'Separate the topic from the timing: ask to resolve the issue before the next long gap.'
            ));
        }

        const support = stats?.support_gap || {};
        if (support.ME?.stress_count || support.PARTNER?.stress_count) {
            const meSupportRate = support.ME.stress_count ? support.ME.support_received / support.ME.stress_count : 1;
            const partnerSupportRate = support.PARTNER.stress_count ? support.PARTNER.support_received / support.PARTNER.stress_count : 1;
            if (Math.abs(meSupportRate - partnerSupportRate) > 0.35) {
                receipts.push(this.receipt(
                    'Support gap',
                    'One side gets noticeably more emotional support after stress signals.',
                    'emotional_labor_imbalance',
                    'medium',
                    'Name the exact support you need instead of hoping the pattern changes silently.'
                ));
            }
        }

        if (boundaryPressure >= 2) {
            receipts.push(this.receipt(
                'Pressure language detected',
                `${boundaryPressure} messages contain blame, pressure, or overgeneralized language.`,
                'boundary_pressure',
                boundaryPressure >= 5 ? 'high' : 'medium',
                'Do not argue with the label. Ask for the specific behavior and boundary.'
            ));
        }

        if (repairAttempts >= 3) {
            receipts.push(this.receipt(
                'Repair attempts are present',
                `${repairAttempts} messages include apology, repair, or reconnection language.`,
                'repair_attempts',
                'low',
                'Build on the repair moments. They are the highest-signal places to improve the dynamic.'
            ));
        }

        if (!receipts.length) {
            receipts.push(this.receipt(
                'Balanced signal set',
                'No single negative pattern dominates the local evidence.',
                'stable_or_low_signal',
                'low',
                'Use the dashboard trends to pick one thing to improve instead of forcing a dramatic read.'
            ));
        }

        const prediction = this.buildPredictiveOutlook(stats, sourceQuality, receipts);
        return {
            version: 1,
            source_quality: sourceQuality,
            receipts: receipts.slice(0, 6),
            pattern_counts: {
                unanswered_questions: unansweredQuestions.count,
                delayed_after_conflict: delayedAfterConflict.count,
                boundary_pressure: boundaryPressure,
                repair_attempts: repairAttempts
            },
            predictive_outlook: prediction
        };
    }

    receipt(claim, evidence, pattern, confidence, action) {
        return { claim, evidence, pattern, confidence, action };
    }

    findUnansweredQuestions(messages) {
        let count = 0;
        for (let i = 0; i < messages.length - 1; i++) {
            const current = messages[i];
            const next = messages[i + 1];
            if (!/\?|\b(why|what|when|where|how|kya|kyu|kab|kaise)\b/i.test(current.text || '')) continue;
            if (next.sender === current.sender) continue;
            const shortAnswer = (next.text || '').split(/\s+/).length <= 3;
            const deflect = /\b(idk|later|leave it|forget it|whatever|hmm|ok|seen)\b/i.test(next.text || '');
            if (shortAnswer || deflect) count++;
        }
        return { count };
    }

    findDelayedAfterConflict(messages) {
        const conflictRe = /\b(fight|angry|hurt|upset|ignore|ignored|sorry|rude|toxic|lie|lied|cheat|trust|problem)\b/i;
        let count = 0;
        for (let i = 0; i < messages.length - 1; i++) {
            const current = messages[i];
            const next = messages[i + 1];
            if (!conflictRe.test(current.text || '')) continue;
            const gapHours = (new Date(next.timestamp) - new Date(current.timestamp)) / 3600000;
            if (gapHours >= 6) count++;
        }
        return { count };
    }

    buildPredictiveOutlook(stats, sourceQuality, receipts) {
        const riskReceipts = receipts.filter(r => r.confidence === 'high').length * 18
            + receipts.filter(r => r.confidence === 'medium').length * 10;
        const symmetryScore = Number(stats?.symmetry?.score || 65);
        const weeks = stats?.weekly_data || [];
        let trend = 'stable';
        let sentimentDelta = 0;
        if (weeks.length >= 2) {
            const recent = weeks.slice(-3);
            const earlier = weeks.slice(0, Math.max(1, weeks.length - 3));
            const avg = arr => arr.reduce((sum, w) => sum + Number(w.mean_sentiment || 0), 0) / arr.length;
            sentimentDelta = avg(recent) - avg(earlier);
            trend = sentimentDelta > 0.12 ? 'improving' : sentimentDelta < -0.12 ? 'declining' : 'stable';
        }
        const riskBase = Math.max(0, 100 - symmetryScore) + riskReceipts + (trend === 'declining' ? 18 : 0);
        const dropOffRisk = Math.max(5, Math.min(95, Math.round(riskBase)));
        const stability = Math.max(5, Math.min(95, Math.round(100 - dropOffRisk + (trend === 'improving' ? 12 : 0))));
        const confidence = Math.round((sourceQuality.score * 0.65) + (Math.min(100, Number(stats?.total_messages || 0) / 5) * 0.35));
        return {
            trend,
            confidence: Math.max(10, Math.min(95, confidence)),
            stability,
            reciprocity_trend: symmetryScore >= 75 ? 'balanced' : symmetryScore >= 55 ? 'uneven but workable' : 'imbalanced',
            repair_likelihood: receipts.some(r => r.pattern === 'repair_attempts') ? 'medium-high' : 'unclear',
            drop_off_risk: dropOffRisk,
            conflict_recurrence_risk: receipts.some(r => r.pattern === 'conflict_delay' || r.pattern === 'boundary_pressure') ? 'elevated' : 'normal',
            next_action: dropOffRisk >= 65 ? 'Have one direct repair conversation and watch the follow-through.' : 'Pick one repeated pattern and make a small request around it.'
        };
    }

    buildRawExcerptPack(messages, receipts) {
        const scrub = text => String(text || '')
            .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
            .replace(/\+?\d[\d\s().-]{7,}\d/g, '[phone]')
            .replace(/https?:\/\/\S+/gi, '[link]')
            .slice(0, 240);
        return {
            version: 1,
            minimization: 'short_scrubbed_excerpts_only',
            excerpts: messages
                .filter(m => (m.text || '').length > 8)
                .slice(-12)
                .map(m => ({
                    sender: m.sender,
                    text: scrub(m.text),
                    evidence_ref: m.evidence_ref
                })),
            receipt_claims: (receipts || []).map(r => r.claim).slice(0, 6)
        };
    }
}

window.ConversationIntelligence = ConversationIntelligence;
