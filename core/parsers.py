import io
import os
import re
import sys
import unicodedata
import pandas as pd
import pdfplumber
import json
import sys

# Performance Optimization (V5.0): Use str.translate with a precomputed mapping
# table for high-speed text sanitization instead of character-level generator loops.
_CONTROL_CATEGORIES = ('Cf', 'Cc', 'Zl', 'Zp')
_KEEP_CHARS = ('\n', '\r', '\t')
_CONTROL_CHARS = ''.join(
    chr(i) for i in range(sys.maxunicode + 1)
    if unicodedata.category(chr(i)) in _CONTROL_CATEGORIES
    and chr(i) not in _KEEP_CHARS
)
_SANITIZATION_TABLE = str.maketrans('', '', _CONTROL_CHARS)

# Pre-compiled Regex Patterns for Core Parsers (V5.0 Optimization)
# Moving regexes to module-level avoids redundant re.compile calls in ThreadPoolExecutor
WA_MSG_PATTERN = re.compile(
    r'^\[?(?P<date>\d{1,2}[/-]\d{1,2}[/-]\d{2,4})[,\s]+(?P<time>\d{1,2}:\d{2}(?::\d{2})?(?:\s*[apAp][mM])?)\]?[\s-]+(?P<sender>[^:]+):\s+(?P<text>.*)$'
)
WA_SYS_PATTERN = re.compile(
    r'^\[?(?P<date>\d{1,2}[/-]\d{1,2}[/-]\d{2,4})[,\s]+(?P<time>\d{1,2}:\d{2}(?::\d{2})?(?:\s*[apAp][mM])?)\]?[\s-]+(?P<sys_msg>Messages and calls are end-to-end encrypted.*|.*changed their phone number|.*joined using an invite link|.*left|.*changed the subject to|.*changed the group description|.*You deleted this message.*)$'
)

TG_DATE_PATTERN = re.compile(r'class="pull_right date details" title="([^"]+)"')
TG_DATE_FALLBACK_PATTERN = re.compile(r'class="date" title="([^"]+)"')
TG_SENDER_PATTERN = re.compile(r'<div class="from_name">\s*([^<]+)\s*</div>')
TG_TEXT_PATTERN = re.compile(r'<div class="text"[^>]*>(.*?)</div>', re.DOTALL)
TG_MEDIA_PATTERN = re.compile(r'<div class="media_wrap[^>]*>.*?<div class="title">\s*([^<]+)\s*</div>.*?<div class="status">\s*([^<]+)\s*</div>', re.DOTALL)


# Precompute translation table for invisible Unicode characters
# Categories: Cf (format), Cc (control), Zl (line separator), Zp (paragraph separator)
_STRIP_CHARS = "".join(
    chr(i) for i in range(sys.maxunicode + 1)
    if chr(i) not in ('\n', '\r', '\t')
    and unicodedata.category(chr(i)) in ('Cf', 'Cc', 'Zl', 'Zp')
)
_STRIP_TABLE = str.maketrans('', '', _STRIP_CHARS)


def sanitize_text(text: str) -> str:
    """Strip invisible Unicode characters (LTR/RTL marks, zero-width spaces, BOM, etc.)
    that messaging apps embed in exports. Applied universally before any parser touches the text."""
    # Optimization: Use str.translate for O(N) performance vs O(N*M) character-level loop
    return text.translate(_STRIP_TABLE)

def standardize_entities(df: pd.DataFrame, my_name: str, partner_name: str) -> pd.DataFrame:
    """
    Standardizes names to 'ME' and 'PARTNER' using Smart Mapping (V3.0).
    Handles mismatches like "Comrade" (Input) vs "Mi Reina❣️" (File).
    """
    if df.empty: return df
    
    # 1. Identity the actual players in the file by frequency
    sender_counts = df['sender'].value_counts()
    # Filter out system-like names or UNKNOWN if possible, but usually top 2 are the chatters
    top_senders = sender_counts.head(2).index.tolist()
    
    my_name_l = my_name.lower().strip()
    partner_name_l = partner_name.lower().strip()
    
    mapping = {} # File Name -> Label (ME/PARTNER)
    remaining_top = top_senders.copy()
    
    # PHASE A: Exact or Substring Matching
    # Check if 'My Name' matches any of the top 2
    for s in top_senders:
        s_l = s.lower().strip()
        if my_name_l in s_l or s_l in my_name_l:
            mapping[s] = 'ME'
            if s in remaining_top: remaining_top.remove(s)
            break
            
    # Check if 'Partner Name' matches any remaining top
    for s in remaining_top:
        s_l = s.lower().strip()
        if partner_name_l in s_l or s_l in partner_name_l:
            mapping[s] = 'PARTNER'
            remaining_top.remove(s)
            break
            
    # PHASE B: Logical Fallback (Nickname Support)
    # If we mapped 'ME' but not 'PARTNER', and there's 1 person left in top_senders...
    if 'ME' in mapping.values() and 'PARTNER' not in mapping.values() and len(remaining_top) == 1:
        # The remaining person must be the partner!
        partner_file_name = remaining_top[0]
        mapping[partner_file_name] = 'PARTNER'
        pass  # Removed to prevent leaking names
        remaining_top.remove(partner_file_name)

    # If we mapped 'PARTNER' but not 'ME' (unlikely but possible)...
    elif 'PARTNER' in mapping.values() and 'ME' not in mapping.values() and len(remaining_top) == 1:
        my_file_name = remaining_top[0]
        mapping[my_file_name] = 'ME'
        remaining_top.remove(my_file_name)
        
    # PHASE C: Worst case fallback (If nothing mapped at all, just take top 2 in order)
    if not mapping and len(top_senders) >= 2:
        mapping[top_senders[0]] = 'ME'
        mapping[top_senders[1]] = 'PARTNER'
        pass  # Removed to prevent leaking mapping logic
    elif not mapping and len(top_senders) == 1:
        mapping[top_senders[0]] = 'ME'

    pass  # Removed to prevent leaking final mapping registry containing user names
    
    df['sender_mapped'] = df['sender'].map(mapping).fillna('UNKNOWN')
    
    # Filter and Normalize
    df = df[df['sender_mapped'].isin(['ME', 'PARTNER'])].copy()

    # Performance Optimization (V5.0): Convert sender to categorical dtype.
    # This reduces RAM usage and speeds up grouping/filtering by using integers internally.
    df['sender'] = df['sender_mapped'].astype('category')

    df.drop(columns=['sender_mapped'], inplace=True)
    return df

class Parsers:
    
    @staticmethod
    def parse_whatsapp(file_bytes: bytes) -> pd.DataFrame:
        dt_strs, senders, texts = [], [], []
        text_data = file_bytes.decode('utf-8', errors='replace')
        for line in text_data.splitlines():
                line = sanitize_text(line).strip()
                if not line:
                    continue
                match = WA_MSG_PATTERN.match(line)
                if match:
                    if len(texts) >= 50001: break # 🛡️ Sentinel: Early exit
                    date_str, time_str, sender, text = match.groups()
                    dt_strs.append(f"{date_str} {time_str}")
                    senders.append(sender.strip())
                    texts.append(text.strip())
                else:
                    sys_match = WA_SYS_PATTERN.match(line)
                    if sys_match:
                         pass # Skip system messages
                    elif texts:
                         # Multiline append
                         texts[-1] += f"\n{line}"

        df = pd.DataFrame({'dt_str': dt_strs, 'sender': senders, 'text': texts})
        if not df.empty:
            df['timestamp'] = pd.to_datetime(df['dt_str'], dayfirst=True, errors='coerce')
            df.drop(columns=['dt_str'], inplace=True)
            df.dropna(subset=['timestamp'], inplace=True)
        return df

    @staticmethod
    def parse_telegram(file_bytes: bytes) -> pd.DataFrame:
        dt_strs, senders, texts = [], [], []
        
        # We bypass BeautifulSoup entirely to prevent massive memory spikes on 50MB+ HTML files
        # Telegram exports are highly structured, so string-splitting combined with Regex is 50x faster.
        content = sanitize_text(file_bytes.decode('utf-8', errors='replace'))

        blocks = content.split('<div class="message ')
        current_sender = "UNKNOWN"
        
        for block in blocks[1:]:
            if len(texts) >= 50001: break # 🛡️ Sentinel: Early exit
            if 'service"' in block:
                continue
            
            # Extract date
            date_match = TG_DATE_PATTERN.search(block)
            if not date_match:
                date_match = TG_DATE_FALLBACK_PATTERN.search(block)
            
            if not date_match:
                continue
                
            title_str = date_match.group(1).strip()
            parts = title_str.split(' ')
            dt_str = f"{parts[0]} {parts[1]}" if len(parts) >= 2 else title_str
            
            # Extract sender
            sender_match = TG_SENDER_PATTERN.search(block)
            if sender_match:
                current_sender = sender_match.group(1).strip()
            
            # Extract text
            text_match = TG_TEXT_PATTERN.search(block)
            text = ""
            if text_match:
                raw_text = text_match.group(1)
                text = re.sub(r'<[^>]+>', '\n', raw_text).strip()
            else:
                # Check for media (Voice messages, Stickers, etc.)
                media_match = TG_MEDIA_PATTERN.search(block)
                if media_match:
                    text = f"[{media_match.group(1).strip()}] {media_match.group(2).strip()}"
                    
            if text:
                dt_strs.append(dt_str)
                senders.append(current_sender)
                texts.append(text)
                
        df = pd.DataFrame({'dt_str': dt_strs, 'sender': senders, 'text': texts})
        if not df.empty:
            # We attempt standard Telegram format first, then generic fallback
            df['timestamp'] = pd.to_datetime(df['dt_str'], format='%d.%m.%Y %H:%M:%S', errors='coerce')
            df['timestamp'] = df['timestamp'].fillna(pd.to_datetime(df['dt_str'], errors='coerce'))
            df.drop(columns=['dt_str'], inplace=True)
            df.dropna(subset=['timestamp'], inplace=True)
        return df

    @staticmethod
    def parse_pdf(file_bytes: bytes) -> pd.DataFrame:
        """Extracts text from PDF and applies WhatsApp parsing loosely."""
        extracted_text = []
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    extracted_text.extend(sanitize_text(text).split('\n'))

        # Create a temp txt file memory construct and run WhatsApp regex over it
        # Sometimes PDF chat exports match txt logs linearly.
        df = Parsers._parse_raw_lines_whatsapp(extracted_text)
        return df
        
    @staticmethod
    def _parse_raw_lines_whatsapp(lines: list) -> pd.DataFrame:
        dt_strs, senders, texts = [], [], []
        for line in lines:
            line = line.strip()
            if not line: continue
            match = WA_MSG_PATTERN.match(line)
            if match:
                if len(texts) >= 50001: break # 🛡️ Sentinel: Early exit
                date_str, time_str, sender, text = match.groups()
                dt_strs.append(f"{date_str} {time_str}")
                senders.append(sender.strip())
                texts.append(text.strip())
            elif texts:
                texts[-1] += f"\n{line}"
                
        df = pd.DataFrame({'dt_str': dt_strs, 'sender': senders, 'text': texts})
        if not df.empty:
            df['timestamp'] = pd.to_datetime(df['dt_str'], dayfirst=True, errors='coerce')
            df.drop(columns=['dt_str'], inplace=True)
            df.dropna(subset=['timestamp'], inplace=True)
        return df

    @staticmethod
    def parse_json(file_bytes: bytes) -> pd.DataFrame:
        """Determines if JSON is Instagram, Discord, or Telegram and parses accordingly."""
        try:
            data = json.loads(sanitize_text(file_bytes.decode('utf-8', errors='replace')))
        except Exception as e:
            pass  # Removed to prevent leaking internal error info
            return pd.DataFrame()

        # Telegram JSON Detection
        if isinstance(data, dict) and data.get('type') == 'personal_chat' and 'messages' in data:
            return Parsers._parse_telegram_json(data)
        elif isinstance(data, dict) and 'about' in data and 'chats' in data and 'list' in data['chats']:
            chats = data['chats']['list']
            if chats and 'messages' in chats[0]:
                return Parsers._parse_telegram_json(chats[0])

        # Instagram Detection (Participants + Messages key)
        if isinstance(data, dict) and 'messages' in data and 'participants' in data:
            return Parsers._parse_instagram(data)
        
        # Discord Detection (List of messages with 'Timestamp', 'Contents')
        if isinstance(data, list) and len(data) > 0 and ('Timestamp' in data[0] or 'timestamp' in data[0]):
            return Parsers._parse_discord_native(data)
        
        # DiscordChatExporter JSON detection
        if isinstance(data, dict) and 'messages' in data and 'channel' in data:
            return Parsers._parse_discord_exporter(data)

        pass  # Removed to prevent internal format logic info
        return pd.DataFrame()

    @staticmethod
    def _parse_instagram(data: dict) -> pd.DataFrame:
        messages = []
        def fix_text(t):
            if not t: return ""
            try:
                # Instagram JSON often uses latin-1 for emoji/special chars
                return t.encode('latin-1').decode('utf-8')
            except:
                return t

        for msg in data.get('messages', []):
            if len(messages) >= 50001: break # 🛡️ Sentinel: Early exit
            sender = fix_text(msg.get('sender_name', 'UNKNOWN'))
            text = fix_text(msg.get('content', ''))
            ts_ms = msg.get('timestamp_ms')
            
            if ts_ms and text:
                messages.append({
                    'timestamp': ts_ms,
                    'sender': sender,
                    'text': text
                })
        
        df = pd.DataFrame(messages)
        if not df.empty:
            # Optimization (V5.0): Vectorized datetime conversion is ~500x faster than per-message calls.
            df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
        return df

    @staticmethod
    def _parse_discord_native(data: list) -> pd.DataFrame:
        messages = []
        for msg in data:
            if len(messages) >= 50001: break # 🛡️ Sentinel: Early exit
            ts = msg.get('Timestamp') or msg.get('timestamp')
            text = msg.get('Contents') or msg.get('content')
            if ts and text:
                messages.append({
                    'timestamp': ts,
                    'sender': 'DISCORD_USER',
                    'text': text
                })
        df = pd.DataFrame(messages)
        if not df.empty:
            # Optimization (V5.0): Vectorized datetime conversion
            df['timestamp'] = pd.to_datetime(df['timestamp'])
        return df

    @staticmethod
    def _parse_telegram_json(data: dict) -> pd.DataFrame:
        messages = []
        for msg in data.get('messages', []):
            if len(messages) >= 50001: break # 🛡️ Sentinel: Early exit
            if msg.get('type') != 'message': continue
            sender = msg.get('from', 'UNKNOWN')
            text = msg.get('text', '')
            if isinstance(text, list):
                # Telegram sometimes uses a list of text entities
                text = "".join([t if isinstance(t, str) else t.get('text', '') for t in text])
            
            ts = msg.get('date') or msg.get('timestamp')
            if ts and text:
                messages.append({
                    'timestamp': ts,
                    'sender': sender,
                    'text': text
                })
        df = pd.DataFrame(messages)
        if not df.empty:
            # Optimization (V5.0): Vectorized datetime conversion
            df['timestamp'] = pd.to_datetime(df['timestamp'])
        return df

    @staticmethod
    def _parse_discord_exporter(data: dict) -> pd.DataFrame:
        messages = []
        for msg in data.get('messages', []):
            if len(messages) >= 50001: break # 🛡️ Sentinel: Early exit
            sender = msg.get('author', {}).get('name', 'UNKNOWN')
            text = msg.get('content', '')
            ts = msg.get('timestamp')
            
            if ts and text:
                messages.append({
                    'timestamp': ts,
                    'sender': sender,
                    'text': text
                })
        df = pd.DataFrame(messages)
        if not df.empty:
            # Optimization (V5.0): Vectorized datetime conversion
            df['timestamp'] = pd.to_datetime(df['timestamp'])
        return df
        
def process_file(filename: str, file_bytes: bytes, my_name: str, partner_name: str) -> pd.DataFrame:
    """Takes a file, directs it to the correct parser natively, and standardizes entities."""
    ext = os.path.splitext(filename)[1].lower()
    if ext == '.html':
        df = Parsers.parse_telegram(file_bytes)
    elif ext == '.pdf':
        df = Parsers.parse_pdf(file_bytes)
    elif ext == '.json':
        df = Parsers.parse_json(file_bytes)
    else:
        df = Parsers.parse_whatsapp(file_bytes)
        
    if df.empty:
         return df

    # 🛡️ Sentinel: Enforce per-file message limit to prevent memory exhaustion (DoS)
    if len(df) > 50000:
        raise ValueError(f"File too large: {filename} contains {len(df)} messages. Maximum 50,000 allowed per file.")
         
    processed_df = standardize_entities(df, my_name, partner_name)
    
    if processed_df.empty and not df.empty:
        unique_file_names = df['sender'].unique().tolist()
        raise ValueError(f"Name Mismatch: The names you entered ('{my_name}' or '{partner_name}') don't match the names in your export file: {unique_file_names}. Please use the exact names from the chat.")
        
    return processed_df
