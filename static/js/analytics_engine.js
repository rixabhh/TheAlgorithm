/**
 * The Algorithm - Local Analytics Engine (V4.0 Global Edition)
 * Deep Hinglish Support & Premium Psychological Metrics.
 */

class AnalyticsEngine {
    constructor() {
        // --- 1. HINGLISH EXPANSE (Transliterated & Hindi Script) ---
        this.STRESS_RE = /work|tired|sad|stressed|deadline|exhausted|unhappy|worry|anxious|sick|hard time|presure|dukh|pareshan|tension|thak|beemar|tension|dard|rona|pareshani|mushkil|gadbad/i;
        this.AFFIRMATIVE_RE = /love|thanks|happy|we|miss|appreciate|glad|proud|beautiful|care|pyaar|shukriya|accha|theek|badhiya|jaan|sona|shona|dil|dhanyawad|sundar|mast|swagat|namaste/i;
        this.DISMISSIVE_RE = /whatever|fine|okay|sure|k|ok|busy|idk|anyway|thik h|hmmm|hmm|okey|theek hai|achha hai|thik hai|chal|hat|pata nahi|pata nhi|ignore|bye/i;
        
        // Topic Mix Regexes
        this.LOGISTICS_RE = /dinner|lunch|bill|home|work|done|todo|buy|shop|cleaning|khana|ghar|paisa|office|market|sabzi|payment|dukan|dukaan/i;
        this.EXTERNAL_RE = /friends|party|movie|news|gym|weather|job|dost|bahar|ghumna|travel|trip|planning|shadi|shaadi|office|colleague/i;
        this.CONFLICT_RE = /sorry|why|fight|angry|stop|listen|mean|hurt|annoyed|galti|kyu|gussa|chup|kyun|ladai|jhagda|badtameez|bewafa|jhoot|jut/i;
        this.INTIMACY_RE = /love|miss|baby|darling|honey|kiss|hug|beautiful|forever|miss u|pyaar|jaan|shona|ummah|jaaneman|mohabbat|ishq|sath/i;
        
        // Sentiment Sets (Hinglish Included)
        this.POS_WORDS = new Set(['love', 'happy', 'great', 'awesome', 'good', 'nice', 'thanks', 'wonderful', 'beautiful', 'yay', 'yes', 'perfect', 'glad', 'proud', 'accha', 'mast', 'top', 'badhiya', 'sahi', 'zindabad', 'wah', 'shabash', 'pyaar', 'mohabbat', 'jaan']);
        this.NEG_WORDS = new Set(['hate', 'sad', 'bad', 'angry', 'hurt', 'sorry', 'no', 'stop', 'upset', 'annoyed', 'tired', 'sick', 'worry', 'fail', 'bekar', 'gussa', 'bura', 'ghatiya', 'pagal', 'bewakoof', 'chup', 'dard', 'dukh', 'mushkil', 'pareshan']);

        this.STOP_WORDS = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'to', 'for', 'and', 'but', 'or', 'if', 'this', 'that', 'it', 'me', 'you', 'my', 'your', 'on', 'at', 'in', 'of', 'i', 'im', 'with', 'hi', 'hey', 'hello', 'ya', 'ye', 'na', 'h', 'hai', 'tha', 'thee', 'ke', 'ka', 'ko', 'ki', 'ne', 'mein', 'par', 'tha', 'the', 'thi', 'raha', 'rahi', 'rahe', 'hota', 'hote', 'hoti', 'lekin', 'kyun', 'kya', 'kise', 'kisko', 'kaise', 'kahan', 'kab']);
    }

    runPipeline(messages, connectionType = 'romantic') {
        if (!messages.length) return null;

        const processed = messages.map(m => ({
            ...m,
            textLower: (m.text || '').toLowerCase(),
            words: (m.text || '').toLowerCase().split(/\s+/).filter(w => w.length > 1 && !this.STOP_WORDS.has(w))
        }));

        const latencyInfo = this.calculateLatency(processed);
        const sentimentInfo = this.applySentiment(processed);
        const emojiStats = this.extractEmojiStats(processed);
        const initiatorInfo = this.calculateInitiatorRatio(latencyInfo);
        const powerInfo = this.calculatePowerDynamics(processed);
        const supportInfo = this.calculateSupportGap(processed);
        const topicMix = this.calculateTopicMix(processed, connectionType);
        const mirroringValue = this.calculateMirroring(processed);
        const attachment = this.calculateAttachmentStyle(processed, latencyInfo);
        const topWords = this.calculateTopWords(processed);
        
        const weekly = this.aggregateWeekly(latencyInfo);
        const riskAnalysis = this.calculateRiskScore(weekly);
        const phases = this.detectRiskPhases(riskAnalysis);

        return {
            weekly_data: phases,
            emoji_frequency: emojiStats,
            initiator_ratio: initiatorInfo,
            power_dynamics: powerInfo,
            support_gap: supportInfo,
            support_score: this.calculateSupportScore(supportInfo),
            topic_mix: topicMix,
            mirroring: mirroringValue,
            attachment_style: attachment,
            top_words: topWords,
            sentiment_summary: {
                partner_mean: sentimentInfo.partnerMean,
                me_mean: sentimentInfo.meMean
            }
        };
    }

    calculateLatency(messages) {
        for (let i = 1; i < messages.length; i++) {
            const current = messages[i];
            const prev = messages[i - 1];
            const gapMs = current.timestamp - prev.timestamp;
            const gapMins = gapMs / (1000 * 60);
            current.gapMins = gapMins;
            if (current.sender !== prev.sender && gapMins <= 1440) current.latencyMins = gapMins;
            else current.latencyMins = null;
        }
        return messages;
    }

    applySentiment(messages) {
        let partnerTotal = 0, partnerCount = 0, meTotal = 0, meCount = 0;
        for (const m of messages) {
            let score = 0;
            // Hindi script check (Decomposition)
            if (/[\u0900-\u097F]/.test(m.text)) score += 0.1; 

            for (const word of m.words) {
                if (this.POS_WORDS.has(word)) score += 1;
                else if (this.NEG_WORDS.has(word)) score -= 1;
            }
            if (this.AFFIRMATIVE_RE.test(m.text)) score += 1;
            if (this.DISMISSIVE_RE.test(m.text)) score -= 1;
            m.sentiment = Math.max(-1, Math.min(1, score));
            if (m.sender === 'PARTNER') { partnerTotal += m.sentiment; partnerCount++; }
            else { meTotal += m.sentiment; meCount++; }
        }
        return {
            partnerMean: partnerCount > 0 ? partnerTotal / partnerCount : 0,
            meMean: meCount > 0 ? meTotal / meCount : 0
        };
    }

    extractEmojiStats(messages) {
        const emojiRegex = /[\u{1f300}-\u{1f5ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{1f700}-\u{1f77f}\u{1f780}-\u{1f7ff}\u{1f800}-\u{1f8ff}\u{1f900}-\u{1f9ff}\u{1fa00}-\u{1faff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}]/gu;
        const stats = { ME: {}, PARTNER: {} };
        for (const m of messages) {
            const matches = (m.text || '').match(emojiRegex);
            if (matches) {
                const target = stats[m.sender];
                for (const emoji of matches) target[emoji] = (target[emoji] || 0) + 1;
            }
        }
        const finalize = (obj) => Object.entries(obj).map(([emoji, count]) => ({ emoji, count })).sort((a, b) => b.count - a.count).slice(0, 5);
        return { ME: finalize(stats.ME), PARTNER: finalize(stats.PARTNER) };
    }

    calculateInitiatorRatio(messages) {
        let meInits = 0, partnerInits = 0;
        const GAP_THRESHOLD = 240;
        if (messages.length > 0) messages[0].sender === 'ME' ? meInits++ : partnerInits++;
        for (let i = 1; i < messages.length; i++) {
            if (messages[i].gapMins >= GAP_THRESHOLD) messages[i].sender === 'ME' ? meInits++ : partnerInits++;
        }
        const total = meInits + partnerInits;
        return { me_initiations: meInits, partner_initiations: partnerInits, me_ratio: total > 0 ? meInits / total : 0.5 };
    }

    calculatePowerDynamics(messages) {
        let meWords = 0, partnerWords = 0;
        for (const m of messages) m.sender === 'ME' ? meWords += m.words.length : partnerWords += m.words.length;
        return { me_word_count: meWords, partner_word_count: partnerWords, power_ratio: partnerWords > 0 ? meWords / partnerWords : 1.0 };
    }

    calculateSupportGap(messages) {
        let meStress = 0, partnerStress = 0, meSupported = 0, partnerSupported = 0;
        let activeStressMeTs = null, activeStressPartnerTs = null;
        const SUPPORT_WINDOW = 60 * 60 * 1000;
        for (const m of messages) {
            if (this.STRESS_RE.test(m.text)) {
                if (m.sender === 'ME') { meStress++; activeStressMeTs = m.timestamp; }
                else { partnerStress++; activeStressPartnerTs = m.timestamp; }
            }
            if (m.sender === 'ME' && activeStressPartnerTs) {
                if (m.timestamp - activeStressPartnerTs <= SUPPORT_WINDOW && m.words.length > 2) { partnerSupported++; activeStressPartnerTs = null; }
            } else if (m.sender === 'PARTNER' && activeStressMeTs) {
                if (m.timestamp - activeStressMeTs <= SUPPORT_WINDOW && m.words.length > 2) { meSupported++; activeStressMeTs = null; }
            }
        }
        return {
            ME: { stress_count: meStress, support_received: meSupported },
            PARTNER: { stress_count: partnerStress, support_received: partnerSupported }
        };
    }

    calculateSupportScore(supportInfo) {
        const totalStress = supportInfo.ME.stress_count + supportInfo.PARTNER.stress_count;
        const totalSupp = supportInfo.ME.support_received + supportInfo.PARTNER.support_received;
        if (totalStress === 0) return 90;
        return Math.round(Math.min(100, (totalSupp / totalStress) * 100));
    }

    calculateMirroring(messages) {
        const meFreq = {}, pFreq = {};
        for (const m of messages) {
            const target = m.sender === 'ME' ? meFreq : pFreq;
            for (const word of m.words) target[word] = (target[word] || 0) + 1;
        }
        const meTop = Object.keys(meFreq).sort((a,b) => meFreq[b] - meFreq[a]).slice(0, 30);
        const pTop = new Set(Object.keys(pFreq).sort((a,b) => pFreq[b] - pFreq[a]).slice(0, 30));
        let common = 0;
        for (const w of meTop) if (pTop.has(w)) common++;
        return Math.round((common / 30) * 100);
    }

    calculateTopicMix(messages, connectionType) {
        const topics = { Logistics: 0, Intimacy: 0, Conflict: 0, External: 0 };
        for (const m of messages) {
            if (this.LOGISTICS_RE.test(m.text)) topics.Logistics++;
            if (this.INTIMACY_RE.test(m.text)) topics.Intimacy++;
            if (this.CONFLICT_RE.test(m.text)) topics.Conflict++;
            if (this.EXTERNAL_RE.test(m.text)) topics.External++;
        }
        const sorted = Object.entries(topics).sort((a,b) => b[1] - a[1]);
        return { breakdown: topics, top_topic: sorted[0][1] > 0 ? sorted[0][0] : "Life Talk" };
    }

    calculateAttachmentStyle(messages, latencyInfo) {
        let anxiousScore = 0, avoidantScore = 0;
        const totalMsgs = messages.length;
        if (totalMsgs < 10) return "Secure";

        // Anxious signals: Double texting, fast replies to slow ones, high stress words
        // Avoidant signals: Long latency, short word counts, dismissive regex
        for (const m of messages) {
            if (m.sender === 'ME') {
                if (m.latencyMins && m.latencyMins < 5) anxiousScore += 0.2;
                if (this.DISMISSIVE_RE.test(m.text)) avoidantScore += 0.5;
                if (this.STRESS_RE.test(m.text)) anxiousScore += 0.3;
            }
        }
        const ratio = anxiousScore / (avoidantScore || 1);
        if (ratio > 1.5) return "Anxious-Leaning";
        if (ratio < 0.6) return "Avoidant-Leaning";
        return "Securely Connected";
    }

    calculateTopWords(messages) {
        const freq = {};
        for (const m of messages) {
            for (const word of m.words) {
                freq[word] = (freq[word] || 0) + 1;
            }
        }
        return Object.entries(freq).sort((a,b) => b[1] - a[1]).slice(0, 5).map(e => e[0]);
    }

    aggregateWeekly(messages) {
        const weeks = {};
        for (const m of messages) {
            const d = new Date(m.timestamp);
            const mon = new Date(d.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1)));
            mon.setHours(0,0,0,0);
            const key = mon.toISOString().split('T')[0];
            if (!weeks[key]) weeks[key] = { week_start: key, volume: 0, me_count: 0, partner_count: 0, latencies: [], sentiments: [] };
            weeks[key].volume++;
            m.sender === 'ME' ? weeks[key].me_count++ : weeks[key].partner_count++;
            if (m.latencyMins !== null) weeks[key].latencies.push(m.latencyMins * 60);
            if (m.sender === 'PARTNER') weeks[key].sentiments.push(m.sentiment);
        }
        return Object.values(weeks).map(w => ({
            ...w,
            median_latency: this._median(w.latencies) / 60 || 0,
            mean_sentiment: this._mean(w.sentiments) || 0
        }));
    }

    calculateRiskScore(weeks) {
        if (!weeks.length) return [];
        const maxLat = Math.max(...weeks.map(w => w.median_latency)) || 1;
        const maxVol = Math.max(...weeks.map(w => w.volume)) || 1;
        return weeks.map(w => {
            const risk = (0.5 * ((1 - w.mean_sentiment) / 2)) + (0.3 * (w.median_latency / maxLat)) + (0.2 * (1 - (w.volume / maxVol)));
            return { ...w, risk_score: parseFloat(risk.toFixed(4)) };
        });
    }

    detectRiskPhases(weeks) {
        return weeks.map(w => {
            let p = 'Stable';
            if (w.risk_score < 0.3) p = 'Honeymoon';
            else if (w.risk_score < 0.85) p = 'Stable';
            else p = 'Tension';
            return { ...w, phase: p };
        });
    }

    _median(arr) {
        if (!arr.length) return 0;
        const s = [...arr].sort((a,b) => a - b);
        const m = Math.floor(s.length / 2);
        return s.length % 2 !== 0 ? s[m] : (s[m-1] + s[m]) / 2;
    }

    _mean(arr) { return arr.length ? arr.reduce((a,b) => a+b, 0) / arr.length : 0; }
}

if (typeof module !== 'undefined') { module.exports = AnalyticsEngine; }
