/**
 * The Algorithm - Local Chat Parser (V1.0 Edge)
 * Ports the robust regex logic from parsers.py to JavaScript for client-side processing.
 */

class ChatParser {
    constructor() {
        // Regex Patterns (Ported from parsers.py)
        this.WA_MSG_PATTERN = /^\[?(?<date>\d{1,2}[/-]\d{1,2}[/-]\d{2,4})[,\s]+(?<time>\d{1,2}:\d{2}(?::\d{2})?(?:\s*[apAp][mM])?)\]?[\s-]+(?<sender>[^:]+):\s+(?<text>.*)$/;
        this.SIGNAL_MSG_PATTERN = /^\[(?<date>\d{4}-\d{2}-\d{2})\s+(?<time>\d{2}:\d{2})\]\s+(?<sender>[^:]+):\s+(?<text>.*)$/;
        this.WA_SYS_PATTERN = /^\[?(?<date>\d{1,2}[/-]\d{1,2}[/-]\d{2,4})[,\s]+(?<time>\d{1,2}:\d{2}(?::\d{2})?(?:\s*[apAp][mM])?)\]?[\s-]+(?<sys_msg>Messages and calls are end-to-end encrypted.*|.*changed their phone number|.*joined using an invite link|.*left|.*changed the subject to|.*changed the group description|.*You deleted this message.*)$/;

        this.TG_DATE_PATTERN = /class="pull_right date details" title="([^"]+)"/;
        this.TG_DATE_FALLBACK_PATTERN = /class="date" title="([^"]+)"/;
        this.TG_SENDER_PATTERN = /<div class="from_name">\s*([^<]+)\s*<\/div>/;
        this.TG_TEXT_PATTERN = /<div class="text"[^>]*>(.*?)<\/div>/gs;
        this.TG_MEDIA_PATTERN = /<div class="media_wrap[^>]*>.*?<div class="title">\s*([^<]+)\s*<\/div>.*?<div class="status">\s*([^<]+)\s*<\/div>/gs;

        // Invisible characters to strip (LTR, RTL, BOM, etc.)
        this.STRIP_REGEX = /[\u200B-\u200D\uFEFF\u202A-\u202E\u0000-\u0008\u000B\u000C\u000E-\u001F]/g;
    }

    sanitize(text) {
        if (!text) return "";
        return text.replace(this.STRIP_REGEX, "").trim();
    }

    /**
     * Detects if content is a Signal (.txt) export
     */
    detectSignal(textData) {
        const lines = textData.split(/\r?\n/).slice(0, 50); // Check first 50 lines
        for (let line of lines) {
            line = this.sanitize(line);
            if (this.SIGNAL_MSG_PATTERN.test(line)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Parses Signal (.txt)
     */
    parseSignal(textData) {
        const messages = [];
        const lines = textData.split(/\r?\n/);

        for (let line of lines) {
            line = this.sanitize(line);
            if (!line) continue;

            const match = line.match(this.SIGNAL_MSG_PATTERN);
            if (match) {
                if (messages.length >= 50000) break;
                const { date, time, sender, text } = match.groups;
                messages.push({
                    timestamp: this.parseDateTime(`${date} ${time}`),
                    sender: sender.trim(),
                    text: text.trim()
                });
            } else if (messages.length > 0) {
                // Multiline message append
                messages[messages.length - 1].text += "\n" + line;
            }
        }
        return messages;
    }

    /**
     * Parses WhatsApp (.txt)
     */
    parseWhatsApp(textData) {
        const messages = [];
        const lines = textData.split(/\r?\n/);
        
        for (let line of lines) {
            line = this.sanitize(line);
            if (!line) continue;

            const match = line.match(this.WA_MSG_PATTERN);
            if (match) {
                if (messages.length >= 50000) break;
                const { date, time, sender, text } = match.groups;
                messages.push({
                    timestamp: this.parseDateTime(`${date} ${time}`),
                    sender: sender.trim(),
                    text: text.trim()
                });
            } else if (messages.length > 0 && !line.match(this.WA_SYS_PATTERN)) {
                // Multiline message append
                messages[messages.length - 1].text += "\n" + line;
            }
        }
        return messages;
    }

    /**
     * Parses Telegram (.html)
     */
    parseTelegram(htmlData) {
        const messages = [];
        const content = this.sanitize(htmlData);
        const blocks = content.split('<div class="message ');
        
        let currentSender = "UNKNOWN";

        for (let i = 1; i < blocks.length; i++) {
            if (messages.length >= 50000) break;
            const block = blocks[i];
            if (block.includes('service"')) continue;

            // Date
            let dateMatch = block.match(this.TG_DATE_PATTERN) || block.match(this.TG_DATE_FALLBACK_PATTERN);
            if (!dateMatch) continue;
            
            const titleStr = dateMatch[1].trim();
            const parts = titleStr.split(' ');
            const dtStr = parts.length >= 2 ? `${parts[0]} ${parts[1]}` : titleStr;

            // Sender
            const senderMatch = block.match(this.TG_SENDER_PATTERN);
            if (senderMatch) {
                currentSender = senderMatch[1].trim();
            }

            // Text
            let textMatch = this.TG_TEXT_PATTERN.exec(block);
            this.TG_TEXT_PATTERN.lastIndex = 0; // Reset for next use if needed
            
            let text = "";
            if (textMatch) {
                text = textMatch[1].replace(/<[^>]+>/g, "\n").trim();
            } else {
                // Media fallback
                const mediaMatch = this.TG_MEDIA_PATTERN.exec(block);
                this.TG_MEDIA_PATTERN.lastIndex = 0;
                if (mediaMatch) {
                    text = `[${mediaMatch[1].trim()}] ${mediaMatch[2].trim()}`;
                }
            }

            if (text) {
                messages.push({
                    timestamp: this.parseDateTime(dtStr),
                    sender: currentSender,
                    text: text
                });
            }
        }
        return messages;
    }

    /**
     * Parses Instagram (.json)
     */
    parseInstagram(jsonData) {
        const messages = [];
        const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
        
        const fixText = (t) => {
            if (!t) return "";
            try { return decodeURIComponent(escape(t)); } catch (e) { return t; }
        };

        if (data.messages && Array.isArray(data.messages)) {
            for (const msg of data.messages) {
                if (messages.length >= 50000) break;
                const sender = fixText(msg.sender_name || "UNKNOWN");
                const text = fixText(msg.content || "");
                const tsMs = msg.timestamp_ms;

                if (tsMs && text) {
                    messages.push({
                        timestamp: new Date(tsMs),
                        sender: sender,
                        text: text
                    });
                }
            }
        }
        return messages;
    }

    /**
     * Parses Discord (.json)
     */
    parseDiscord(jsonData) {
        const messages = [];
        const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
        
        // Discord exports usually have an array of messages or an object containing messages
        const msgArray = Array.isArray(data) ? data : (data.messages || []);
        
        if (msgArray && Array.isArray(msgArray)) {
            for (const msg of msgArray) {
                if (messages.length >= 50000) break;
                const sender = msg.author?.name || msg.author?.username || "UNKNOWN";
                const text = msg.content || "";
                const ts = msg.timestamp;

                if (ts && text) {
                    messages.push({
                        timestamp: new Date(ts),
                        sender: sender,
                        text: text
                    });
                }
            }
        }
        return messages;
    }

    /**
     * Smart Mapping Logic (Ported from standardize_entities in Python)
     */
    standardizeEntities(messages, myName, partnerName) {
        if (!messages.length) return [];

        // 1. Count frequencies
        const counts = {};
        for (const m of messages) {
            counts[m.sender] = (counts[m.sender] || 0) + 1;
        }

        // Sort by frequency
        const sortedSenders = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
        const topSenders = sortedSenders.slice(0, 2);

        const myNameL = myName.toLowerCase().trim();
        const partnerNameL = partnerName.toLowerCase().trim();

        const mapping = {};
        const remainingTop = [...topSenders];

        // PHASE A: Exact or Substring Matching
        for (const s of topSenders) {
            const sL = s.toLowerCase().trim();
            if (sL.includes(myNameL) || myNameL.includes(sL)) {
                mapping[s] = 'ME';
                remainingTop.splice(remainingTop.indexOf(s), 1);
                break;
            }
        }

        for (const s of [...remainingTop]) {
            const sL = s.toLowerCase().trim();
            if (sL.includes(partnerNameL) || partnerNameL.includes(sL)) {
                mapping[s] = 'PARTNER';
                remainingTop.splice(remainingTop.indexOf(s), 1);
                break;
            }
        }

        // PHASE B: Logical Fallback
        if (mapping.ME && !mapping.PARTNER && remainingTop.length === 1) {
            mapping[remainingTop[0]] = 'PARTNER';
        } else if (mapping.PARTNER && !mapping.ME && remainingTop.length === 1) {
            mapping[remainingTop[0]] = 'ME';
        }

        // PHASE C: Worst Case
        if (Object.keys(mapping).length === 0 && topSenders.length >= 2) {
            mapping[topSenders[0]] = 'ME';
            mapping[topSenders[1]] = 'PARTNER';
        } else if (Object.keys(mapping).length === 0 && topSenders.length === 1) {
            mapping[topSenders[0]] = 'ME';
        }

        // Apply mapping and filter
        return messages
            .filter(m => mapping[m.sender])
            .map(m => ({
                ...m,
                sender: mapping[m.sender]
            }));
    }

    /**
     * Robust Date Parsing
     */
    parseDateTime(dtStr) {
        // Handle common formats manually or via Date object
        // WhatsApp often uses DD/MM/YYYY or MM/DD/YYYY
        // For simplicity in the browser, we'll try a few common patterns or use Date.parse
        
        // Attempt to swap DD/MM to MM/DD if suspect
        let cleaned = dtStr.replace(/[\[\]]/g, "").replace(/,/g, "");
        
        // Telegram style: 14.12.2023 10:20:30
        if (cleaned.match(/^\d{2}\.\d{2}\.\d{4}/)) {
            const [date, time] = cleaned.split(' ');
            const [d, m, y] = date.split('.');
            cleaned = `${y}-${m}-${d} ${time}`;
        }
        
        const d = new Date(cleaned);
        return isNaN(d.getTime()) ? new Date() : d;
    }
}

// Export for use in Workers or Main Thread
if (typeof module !== 'undefined') {
    module.exports = ChatParser;
}
