/**
 * The Algorithm - Local Analytics Engine (V1.0 Edge)
 * Ports the complex relationship scoring logic from analytics.py to JavaScript.
 */

class AnalyticsEngine {
    constructor() {
        // Regex Patterns (Ported from analytics.py)
        this.STRESS_RE = /work|tired|sad|stressed|deadline|exhausted|unhappy|worry|anxious|sick|bad day|hard time/i;
        this.AFFIRMATIVE_RE = /love|thanks|happy|we|miss|appreciate|glad|proud|beautiful|care/i;
        this.DISMISSIVE_RE = /whatever|fine|okay|sure|k|ok|busy|tired|idk|anyway/i;
        
        // Topic Mix Regexes
        this.LOGISTICS_RE = /dinner|lunch|bill|home|work|done|todo|buy|shop|cleaning/i;
        this.EXTERNAL_RE = /friends|party|movie|news|gym|weather|job/i;
        this.CONFLICT_RE = /sorry|why|fight|angry|stop|listen|mean|hurt|annoyed/i;
        this.INTIMACY_RE = /love|miss|baby|darling|honey|kiss|hug|beautiful|forever/i;
        
        // Sentiment Keyword Map
        this.POS_WORDS = new Set(['love', 'happy', 'great', 'awesome', 'good', 'nice', 'thanks', 'wonderful', 'beautiful', 'yay', 'yes', 'perfect', 'glad', 'proud']);
        this.NEG_WORDS = new Set(['hate', 'sad', 'bad', 'angry', 'hurt', 'sorry', 'no', 'stop', 'upset', 'annoyed', 'tired', 'sick', 'worry', 'fail']);
    }

    /**
     * Main Entry Point
     */
    runPipeline(messages, connectionType = 'romantic') {
        if (!messages.length) return null;

        // 1. Pre-process text (lowercase)
        const processed = messages.map(m => ({
            ...m,
            textLower: m.text.toLowerCase(),
            words: m.text.toLowerCase().split(/\s+/).filter(w => w.length > 0)
        }));

        // 2. Metrics
        const latencyInfo = this.calculateLatency(processed);
        const sentimentInfo = this.applySentiment(processed);
        const initiatorInfo = this.calculateInitiatorRatio(latencyInfo);
        const powerInfo = this.calculatePowerDynamics(processed);
        const supportInfo = this.calculateSupportGap(processed);
        const topicMix = this.calculateTopicMix(processed, connectionType);
        
        // 3. Weekly Aggregation
        const weekly = this.aggregateWeekly(latencyInfo);
        const riskAnalysis = this.calculateRiskScore(weekly);
        const phases = this.detectRiskPhases(riskAnalysis);

        return {
            weekly: phases,
            initiator_ratio: initiatorInfo,
            power_dynamics: powerInfo,
            support_gap: supportInfo,
            topic_mix: topicMix,
            sentiment_summary: {
                partner_mean: sentimentInfo.partnerMean,
                me_mean: sentimentInfo.meMean
            }
        };
    }

    /**
     * Latency & Response Gap
     */
    calculateLatency(messages) {
        for (let i = 1; i < messages.length; i++) {
            const current = messages[i];
            const prev = messages[i - 1];
            
            const gapMs = current.timestamp - prev.timestamp;
            const gapMins = gapMs / (1000 * 60);
            
            current.gapMins = gapMins;
            
            // Valid reply: Different sender, gap <= 24 hours
            if (current.sender !== prev.sender && gapMins <= 1440) {
                current.latencyMins = gapMins;
            } else {
                current.latencyMins = null;
            }
        }
        return messages;
    }

    /**
     * Keyword Sentiment Engine (Browser Optimized)
     */
    applySentiment(messages) {
        let partnerTotal = 0;
        let partnerCount = 0;
        let meTotal = 0;
        let meCount = 0;

        for (const m of messages) {
            let score = 0;
            for (const word of m.words) {
                if (this.POS_WORDS.has(word)) score += 1;
                else if (this.NEG_WORDS.has(word)) score -= 1;
            }
            
            // Clamp score
            m.sentiment = Math.max(-1, Math.min(1, score));
            
            if (m.sender === 'PARTNER') {
                partnerTotal += m.sentiment;
                partnerCount++;
            } else {
                meTotal += m.sentiment;
                meCount++;
            }
        }

        return {
            partnerMean: partnerCount > 0 ? partnerTotal / partnerCount : 0,
            meMean: meCount > 0 ? meTotal / meCount : 0
        };
    }

    /**
     * Initiations (> 4 hour gap)
     */
    calculateInitiatorRatio(messages) {
        let meInits = 0;
        let partnerInits = 0;
        const GAP_THRESHOLD = 240; // 4 hours

        // First message is initiation
        if (messages.length > 0) {
            if (messages[0].sender === 'ME') meInits++;
            else partnerInits++;
        }

        for (let i = 1; i < messages.length; i++) {
            if (messages[i].gapMins >= GAP_THRESHOLD) {
                if (messages[i].sender === 'ME') meInits++;
                else partnerInits++;
            }
        }

        const total = meInits + partnerInits;
        return {
            me_initiations: meInits,
            partner_initiations: partnerInits,
            me_ratio: total > 0 ? meInits / total : 0.5
        };
    }

    /**
     * Power Dynamics (Word Count)
     */
    calculatePowerDynamics(messages) {
        let meWords = 0;
        let partnerWords = 0;

        for (const m of messages) {
            if (m.sender === 'ME') meWords += m.words.length;
            else partnerWords += m.words.length;
        }

        return {
            me_word_count: meWords,
            partner_word_count: partnerWords,
            power_ratio: partnerWords > 0 ? meWords / partnerWords : 1.0
        };
    }

    /**
     * Support Gap (Stress messages)
     */
    calculateSupportGap(messages) {
        let meStress = 0;
        let partnerStress = 0;
        let meSupported = 0;
        let partnerSupported = 0;

        // Tracks active stress states
        let activeStressMeTs = null;
        let activeStressPartnerTs = null;
        const SUPPORT_WINDOW = 60 * 60 * 1000; // 1 hour

        for (const m of messages) {
            const isStress = this.STRESS_RE.test(m.text);
            
            if (isStress) {
                if (m.sender === 'ME') {
                    meStress++;
                    activeStressMeTs = m.timestamp;
                } else {
                    partnerStress++;
                    activeStressPartnerTs = m.timestamp;
                }
            }

            // Check if this message is a response to the other's stress
            if (m.sender === 'ME' && activeStressPartnerTs) {
                if (m.timestamp - activeStressPartnerTs <= SUPPORT_WINDOW && m.words.length > 3) {
                    partnerSupported++;
                    activeStressPartnerTs = null;
                }
            } else if (m.sender === 'PARTNER' && activeStressMeTs) {
                if (m.timestamp - activeStressMeTs <= SUPPORT_WINDOW && m.words.length > 3) {
                    meSupported++;
                    activeStressMeTs = null;
                }
            }
        }

        return {
            ME: { stress_count: meStress, support_received: meSupported },
            PARTNER: { stress_count: partnerStress, support_received: partnerSupported }
        };
    }

    /**
     * Weekly Aggregation
     */
    aggregateWeekly(messages) {
        const weeks = {};

        for (const m of messages) {
            // Anchor to Monday
            const date = new Date(m.timestamp);
            const day = date.getDay();
            const diff = date.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(date.setDate(diff));
            monday.setHours(0,0,0,0);
            
            const key = monday.toISOString().split('T')[0];
            if (!weeks[key]) {
                weeks[key] = {
                    week_start: key,
                    volume: 0,
                    me_count: 0,
                    partner_count: 0,
                    latencies: [],
                    sentiments: []
                };
            }
            
            weeks[key].volume++;
            if (m.sender === 'ME') weeks[key].me_count++;
            else weeks[key].partner_count++;

            if (m.latencyMins !== null) weeks[key].latencies.push(m.latencyMins * 60); // Store in seconds
            if (m.sender === 'PARTNER') weeks[key].sentiments.push(m.sentiment);
        }

        return Object.values(weeks).map(w => ({
            ...w,
            avg_latency_seconds: this._mean(w.latencies) || 0,
            median_latency: this._median(w.latencies) / 60 || 0, // minutes for internal use
            mean_sentiment: this._mean(w.sentiments) || 0
        }));

    }

    /**
     * The Algorithm Risk Score
     */
    calculateRiskScore(weeks) {
        if (!weeks.length) return [];
        
        const maxLat = Math.max(...weeks.map(w => w.median_latency)) || 1;
        const maxVol = Math.max(...weeks.map(w => w.volume)) || 1;

        return weeks.map(w => {
            const sentimentInv = (1 - w.mean_sentiment) / 2.0;
            const latencyNorm = w.median_latency / maxLat;
            const volumeInv = 1.0 - (w.volume / maxVol);
            
            const risk = (0.5 * sentimentInv) + (0.3 * latencyNorm) + (0.2 * volumeInv);
            return {
                ...w,
                risk_score: parseFloat(risk.toFixed(4))
            };
        });
    }

    detectRiskPhases(weeks) {
        return weeks.map(w => {
            let phase = 'Stable';
            if (w.risk_score < 0.3) phase = 'Honeymoon';
            else if (w.risk_score < 0.6) phase = 'Stable';
            else if (w.risk_score < 0.85) phase = 'Tension';
            else phase = 'Danger';
            
            return { ...w, phase };
        });
    }

    calculateTopicMix(messages, connectionType) {
        const topics = { Logistics: 0, Intimacy: 0, Conflict: 0, External: 0 };
        
        for (const m of messages) {
            if (this.LOGISTICS_RE.test(m.text)) topics.Logistics++;
            if (this.INTIMACY_RE.test(m.text)) topics.Intimacy++;
            if (this.CONFLICT_RE.test(m.text)) topics.Conflict++;
            if (this.EXTERNAL_RE.test(m.text)) topics.External++;
        }
        return topics;
    }

    _median(arr) {
        if (!arr.length) return 0;
        const sorted = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }

    _mean(arr) {
        return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    }
}

if (typeof module !== 'undefined') {
    module.exports = AnalyticsEngine;
}
