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
            words: (m.text || '').toLowerCase().split(/\s+/).filter(w => w.length > 1 && !this.STOP_WORDS.has(w)),
            chars: (m.text || '').length
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
        
        const doubleTexts = this.calculateDoubleTexts(processed);
        const maxInactivity = this.calculateMaxInactivity(processed);
        const sleepTime = this.estimateSleepTime(processed);
        const behavioralTraits = this.calculateBehavioralTraits(processed);
        
        // --- NEW METRICS ---
        const threads = this.calculateThreads(processed);
        const duration = this.calculateDuration(processed);
        const streakInfo = this.calculateStreaks(processed);
        const lexicalDiversity = this.calculateLexicalDiversity(processed);
        const links = this.extractLinks(processed);
        const symmetry = this.calculateSymmetryScore(initiatorInfo, powerInfo);
        const ghostBreakers = this.calculateGhostBreakers(processed);
        const humorRatio = this.calculateHumor(processed);
        
        // --- MSG DISTRIBUTION FOR CHARTS ---
        const msgDist = { ME: 0, PARTNER: 0 };
        processed.forEach(m => { msgDist[m.sender]++; });

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
            double_texts: doubleTexts,
            max_inactivity: maxInactivity,
            sleep_time: sleepTime,
            behavioral_traits: behavioralTraits,
            messages: msgDist,
            words: { ME: powerInfo.me_word_count, PARTNER: powerInfo.partner_word_count },
            chars: { ME: powerInfo.me_char_count, PARTNER: powerInfo.partner_char_count },
            threads: threads,
            duration: duration,
            streaks: { longest: streakInfo.max_streak, current: streakInfo.current_streak || 0, active_pct: streakInfo.active_pct },
            lexical_diversity: lexicalDiversity,
            links: links,
            symmetry: symmetry,
            ghost_breakers: ghostBreakers,
            humor: humorRatio,
            sentiment_summary: {
                partner_mean: sentimentInfo.partnerMean,
                me_mean: sentimentInfo.meMean
            }
        };
    }

    calculateGhostBreakers(messages) {
        const breakers = { ME: 0, PARTNER: 0 };
        const SILENCE_THRESHOLD = 720; // 12 hours in minutes

        for (let i = 1; i < messages.length; i++) {
            if (messages[i].gapMins >= SILENCE_THRESHOLD) {
                breakers[messages[i].sender]++;
            }
        }
        return breakers;
    }

    calculateHumor(messages) {
        const humor = { ME: 0, PARTNER: 0 };
        const HUMOR_RE = /haha|lol|lmao|hehe|rofl|💀|😂|😭|🤣/i;

        for (const m of messages) {
            if (HUMOR_RE.test(m.text)) {
                humor[m.sender]++;
            }
        }
        return humor;
    }

    calculateLatency(messages) {
        for (let i = 1; i < messages.length; i++) {
            const current = messages[i];
            const prev = messages[i - 1];
            const gapMs = current.timestamp - prev.timestamp;
            const gapMins = gapMs / (1000 * 60);
            current.gapMins = gapMins;
            
            // Only count as latency if it's a reply to the other person
            if (current.sender !== prev.sender) {
                if (gapMins <= 1440) current.latencyMins = gapMins; // Within 24 hours
                else current.latencyMins = null;
            } else {
                current.latencyMins = null;
            }
        }
        return messages;
    }

    calculateDoubleTexts(messages) {
        const doubleTexts = { ME: 0, PARTNER: 0 };
        const DOUBLE_TEXT_THRESHOLD = 60; // 60 minutes
        
        for (let i = 1; i < messages.length; i++) {
            const current = messages[i];
            const prev = messages[i - 1];
            if (current.sender === prev.sender && current.gapMins >= DOUBLE_TEXT_THRESHOLD) {
                doubleTexts[current.sender]++;
            }
        }
        return doubleTexts;
    }

    calculateMaxInactivity(messages) {
        let maxGap = 0;
        for (let i = 1; i < messages.length; i++) {
            if (messages[i].gapMins > maxGap) maxGap = messages[i].gapMins;
        }
        return (maxGap / 1440).toFixed(1); // Return in days
    }

    estimateSleepTime(messages) {
        const gaps = new Array(24).fill(0);
        for (let i = 1; i < messages.length; i++) {
            const m = messages[i];
            if (m.gapMins > 240) { // Gap > 4 hours
                const date = new Date(messages[i-1].timestamp);
                const hour = date.getHours();
                gaps[hour]++;
            }
        }
        const sleepHour = gaps.indexOf(Math.max(...gaps));
        return `${sleepHour.toString().padStart(2, '0')}:00`;
    }

    calculateThreads(messages) {
        let count = 0;
        const THRESHOLD = 360; // 6 hours
        if (messages.length > 0) count = 1;
        for (let i = 1; i < messages.length; i++) {
            if (messages[i].gapMins > THRESHOLD) count++;
        }
        return count;
    }

    calculateDuration(messages) {
        if (messages.length < 2) return "0 days";
        const first = messages[0].timestamp;
        const last = messages[messages.length - 1].timestamp;
        const diffDays = Math.round((last - first) / (1000 * 3600 * 24));
        if (diffDays > 365) {
            const y = Math.floor(diffDays / 365.25);
            const m = Math.floor((diffDays % 365.25) / 30.44);
            return `${y}y ${m}m`;
        }
        return `${diffDays} days`;
    }

    calculateStreaks(messages) {
        const activeDays = new Set();
        for (const m of messages) {
            activeDays.add(new Date(m.timestamp).toISOString().split('T')[0]);
        }
        
        const sortedDays = Array.from(activeDays).sort();
        let maxStreak = 0;
        let currentStreak = 0;
        let lastDay = null;

        for (const day of sortedDays) {
            const current = new Date(day);
            if (lastDay) {
                const diffTime = Math.abs(current - lastDay);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays === 1) {
                    currentStreak++;
                } else {
                    currentStreak = 1;
                }
            } else {
                currentStreak = 1;
            }
            if (currentStreak > maxStreak) maxStreak = currentStreak;
            lastDay = current;
        }

        const totalDaysRange = messages.length > 1 ? 
            Math.ceil((messages[messages.length - 1].timestamp - messages[0].timestamp) / (1000 * 3600 * 24)) : 1;
        
        return {
            max_streak: maxStreak,
            current_streak: currentStreak,
            days_active: activeDays.size,
            active_pct: Math.round((activeDays.size / (totalDaysRange || 1)) * 100)
        };
    }

    calculateLexicalDiversity(messages) {
        const meWords = [], pWords = [];
        for (const m of messages) {
            if (m.sender === 'ME') m.words.forEach(w => meWords.push(w));
            else m.words.forEach(w => pWords.push(w));
        }
        const getPct = (words) => words.length ? (new Set(words).size / words.length * 100).toFixed(1) : 0;
        return {
            ME: { pct: getPct(meWords), total: meWords.length, unique: new Set(meWords).size },
            PARTNER: { pct: getPct(pWords), total: pWords.length, unique: new Set(pWords).size }
        };
    }

    extractLinks(messages) {
        const urlRegex = /https?:\/\/[^\s$.?#].[^\s]*/gi;
        const domains = {};
        let total = 0;
        for (const m of messages) {
            const matches = (m.text || '').match(urlRegex);
            if (matches) {
                total += matches.length;
                for (const url of matches) {
                    try {
                        const domain = new URL(url).hostname.replace('www.', '');
                        domains[domain] = (domains[domain] || 0) + 1;
                    } catch (e) {}
                }
            }
        }
        const top = Object.entries(domains).sort((a,b) => b[1] - a[1]).slice(0, 10).map(([domain, count]) => ({ domain, count }));
        return { total, top };
    }

    calculateSymmetryScore(init, power) {
        // Balance of initiations and balance of word counts
        const initBalance = 1 - Math.abs(0.5 - init.me_ratio) * 2;
        const powerBalance = power.power_ratio > 1 ? 1 / power.power_ratio : power.power_ratio;
        const score = Math.round(((initBalance + powerBalance) / 2) * 100);
        let label = "Balanced";
        if (score < 40) label = "One-Sided";
        else if (score < 70) label = "Leaning";
        return { score, label };
    }

    calculateBehavioralTraits(messages) {
        const traits = {
            ME: { curiosity: 0, politeness: 0, warmth: 0, intimacy: 0, greetings: 0, gratitude: 0, affection: 0, compliments: 0, questions: 0 },
            PARTNER: { curiosity: 0, politeness: 0, warmth: 0, intimacy: 0, greetings: 0, gratitude: 0, affection: 0, compliments: 0, questions: 0 }
        };

        const GREETING_RE = /hi|hello|hey|morning|night|bye|namaste|salam/i;
        const GRATITUDE_RE = /thanks|thank you|patience|appreciate|shukriya|dhanyawad/i;
        const COMPLIMENT_RE = /nice|great|good job|proud|smart|beautiful|handsome|sundar|badhiya/i;
        const QUESTION_RE = /\?|how|why|what|when|where|who|kya|kyu|kab|kaise|kaha/i;

        for (const m of messages) {
            const user = traits[m.sender];
            if (GREETING_RE.test(m.text)) { user.greetings++; user.politeness += 10; }
            if (GRATITUDE_RE.test(m.text)) { user.gratitude++; user.politeness += 15; }
            if (COMPLIMENT_RE.test(m.text)) { user.compliments++; user.warmth += 15; }
            if (QUESTION_RE.test(m.text)) { user.questions++; user.curiosity += 10; }
            if (this.INTIMACY_RE.test(m.text)) { user.affection++; user.intimacy += 20; }
            if (this.AFFIRMATIVE_RE.test(m.text)) user.warmth += 5;
        }

        const finalize = (u) => {
            const highlights = [
                { label: 'Greetings', count: u.greetings },
                { label: 'Gratitude', count: u.gratitude },
                { label: 'Compliments', count: u.compliments },
                { label: 'Affection', count: u.affection },
                { label: 'Inquisitive', count: u.questions }
            ].filter(h => h.count > 0);

            return {
                scores: {
                    curiosity: Math.min(100, u.curiosity),
                    politeness: Math.min(100, u.politeness),
                    warmth: Math.min(100, u.warmth),
                    intimacy: Math.min(100, u.intimacy)
                },
                highlights: highlights,
                summary: highlights.map(h => `Strong ${h.label} showing (${h.count} instances).`)
            };
        };

        return { ME: finalize(traits.ME), PARTNER: finalize(traits.PARTNER) };
    }

    applySentiment(messages) {
        let partnerTotal = 0, partnerCount = 0, meTotal = 0, meCount = 0;
        for (const m of messages) {
            let score = 0;
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
        const finalize = (obj) => Object.entries(obj).map(([emoji, count]) => ({ emoji, count })).sort((a, b) => b.count - a.count).slice(0, 15);
        return { ME: finalize(stats.ME), PARTNER: finalize(stats.PARTNER), total: Object.values(stats.ME).reduce((a,b)=>a+b,0) + Object.values(stats.PARTNER).reduce((a,b)=>a+b,0) };
    }

    calculateInitiatorRatio(messages) {
        let meInits = 0, partnerInits = 0;
        let meLats = [], pLats = [];
        const GAP_THRESHOLD = 240;
        if (messages.length > 0) messages[0].sender === 'ME' ? meInits++ : partnerInits++;
        for (let i = 1; i < messages.length; i++) {
            const m = messages[i];
            if (m.gapMins >= GAP_THRESHOLD) m.sender === 'ME' ? meInits++ : partnerInits++;
            if (m.latencyMins !== null) {
                m.sender === 'ME' ? meLats.push(m.latencyMins) : pLats.push(m.latencyMins);
            }
        }
        const total = meInits + partnerInits;
        const avg = (arr) => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;
        return { 
            me_initiations: meInits, 
            partner_initiations: partnerInits, 
            me_ratio: total > 0 ? meInits / total : 0.5,
            me_latency_avg: avg(meLats) * 60,
            partner_latency_avg: avg(pLats) * 60
        };
    }

    calculatePowerDynamics(messages) {
        let meWords = 0, partnerWords = 0, meChars = 0, partnerChars = 0;
        for (const m of messages) {
            if (m.sender === 'ME') { meWords += m.words.length; meChars += m.chars; }
            else { partnerWords += m.words.length; partnerChars += m.chars; }
        }
        return { 
            me_word_count: meWords, partner_word_count: partnerWords, 
            me_char_count: meChars, partner_char_count: partnerChars,
            power_ratio: partnerWords > 0 ? meWords / partnerWords : 1.0 
        };
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
        if (messages.length < 10) return "Secure";
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
            for (const word of m.words) freq[word] = (freq[word] || 0) + 1;
        }
        return Object.entries(freq).sort((a,b) => b[1] - a[1]).slice(0, 50).map(e => ({ word: e[0], count: e[1] }));
    }

    aggregateWeekly(messages) {
        const weeks = {};
        for (const m of messages) {
            const d = new Date(m.timestamp);
            const mon = new Date(d.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1)));
            mon.setHours( mon.getHours() + (mon.getTimezoneOffset() / 60) ); // Adjust for TZ if needed but keep keys consistent
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
            p90_latency: this._percentile(w.latencies, 90) / 60 || 0,
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

    _percentile(arr, p) {
        if (!arr.length) return 0;
        const s = [...arr].sort((a,b) => a - b);
        const index = (p / 100) * (s.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        const weight = index - lower;
        if (upper >= s.length) return s[lower];
        return s[lower] * (1 - weight) + s[upper] * weight;
    }

    _mean(arr) { return arr.length ? arr.reduce((a,b) => a+b, 0) / arr.length : 0; }
}

if (typeof module !== 'undefined') { module.exports = AnalyticsEngine; }
