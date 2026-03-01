import os
import re
import unicodedata
import pandas as pd
from datetime import datetime
from bs4 import BeautifulSoup
import pdfplumber
import json


def sanitize_text(text: str) -> str:
    """Strip invisible Unicode characters (LTR/RTL marks, zero-width spaces, BOM, etc.)
    that messaging apps embed in exports. Applied universally before any parser touches the text."""
    # Remove Unicode categories: Cf (format), Cc (control except \n \r \t), Zl/Zp (line/paragraph sep)
    return ''.join(
        ch for ch in text
        if ch in ('\n', '\r', '\t')
        or unicodedata.category(ch) not in ('Cf', 'Cc', 'Zl', 'Zp')
    )

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
        print(f"Smart Mapping: Nickname '{partner_name}' mapped to file sender '{partner_file_name}'")
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
        print(f"Smart Mapping: Phase C fallback triggered. Mapped top 2 senders.")
    elif not mapping and len(top_senders) == 1:
        mapping[top_senders[0]] = 'ME'

    print(f"Final Mapping Registry: {mapping}")
    
    df['sender_mapped'] = df['sender'].map(mapping).fillna('UNKNOWN')
    
    # Filter and Normalize
    df = df[df['sender_mapped'].isin(['ME', 'PARTNER'])].copy()
    df['sender'] = df['sender_mapped']
    df.drop(columns=['sender_mapped'], inplace=True)
    return df

class Parsers:
    
    @staticmethod
    def parse_whatsapp(file_path: str) -> pd.DataFrame:
        pattern = re.compile(
            r'^\[?(?P<date>\d{1,2}[/-]\d{1,2}[/-]\d{2,4})[,\s]+(?P<time>\d{1,2}:\d{2}(?::\d{2})?(?:\s*[apAp][mM])?)\]?[\s-]+(?P<sender>[^:]+):\s+(?P<text>.*)$'
        )
        sys_pattern = re.compile(
            r'^\[?(?P<date>\d{1,2}[/-]\d{1,2}[/-]\d{2,4})[,\s]+(?P<time>\d{1,2}:\d{2}(?::\d{2})?(?:\s*[apAp][mM])?)\]?[\s-]+(?P<sys_msg>Messages and calls are end-to-end encrypted.*|.*changed their phone number|.*joined using an invite link|.*left|.*changed the subject to|.*changed the group description|.*You deleted this message.*)$'
        )

        messages = []
        with open(file_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = sanitize_text(line).strip()
                if not line:
                    continue
                match = pattern.match(line)
                if match:
                    date_str, time_str, sender, text = match.groups()
                    try:
                        # Normalize date formats. This is a generic approach since WhatsApp dates vary tremendously.
                        dt_str = f"{date_str} {time_str}"
                        messages.append({
                            'timestamp': pd.to_datetime(dt_str, dayfirst=True, errors='coerce'),
                            'sender': sender.strip(),
                            'text': text.strip()
                        })
                    except Exception:
                        pass
                else:
                    sys_match = sys_pattern.match(line)
                    if sys_match:
                         pass # Skip system messages
                    elif messages:
                         # Multiline append
                         messages[-1]['text'] += f"\n{line}"

        df = pd.DataFrame(messages)
        if not df.empty:
            df.dropna(subset=['timestamp'], inplace=True)
            df.sort_values('timestamp', inplace=True)
        return df

    @staticmethod
    def parse_telegram(file_path: str) -> pd.DataFrame:
        messages = []
        with open(file_path, 'r', encoding='utf-8') as f:
            soup = BeautifulSoup(sanitize_text(f.read()), 'html.parser')

        current_sender = "UNKNOWN"
        for msg_div in soup.find_all('div', class_='message'):
            if 'service' in msg_div.get('class', []):
                continue

            body_div = msg_div.find('div', class_='body')
            if not body_div: continue

            # Extract date
            date_div = body_div.find('div', class_='date')
            dt = None
            if date_div and date_div.get('title'):
                try:
                    # e.g "08.01.2021 16:05:14 UTC+05:30" or "08.01.2021 16:05:14"
                    title_str = date_div['title'].strip()
                    parts = title_str.split(' ')
                    if len(parts) >= 3:
                        dt_str = f"{parts[0]} {parts[1]}"
                    else:
                        dt_str = title_str
                    dt = pd.to_datetime(dt_str, format='%d.%m.%Y %H:%M:%S', errors='coerce')
                except Exception:
                    pass

            if dt is pd.NaT or dt is None: continue

            # Check if this is a 'joined' message (sent by the same person as the previous message)
            if 'joined' not in msg_div.get('class', []):
                from_name_div = body_div.find('div', class_='from_name')
                if from_name_div:
                    current_sender = from_name_div.text.strip()
            # If no from_name_div, it uses the previous current_sender (bubble pattern)
            
            # Extract text
            text_div = body_div.find('div', class_='text')
            text = ""
            
            if text_div:
                 lines = [line for line in text_div.stripped_strings]
                 text = "\n".join(lines)
            else:
                # If no text div, check for Media (Stickers, Calls, etc.)
                media_wrap = body_div.find('div', class_='media_wrap')
                if media_wrap:
                    m_title = media_wrap.find('div', class_='title')
                    m_status = media_wrap.find('div', class_='status')
                    
                    title_text = m_title.get_text().strip() if m_title else "Media"
                    status_text = m_status.get_text().strip() if m_status else ""
                    text = f"[{title_text}] {status_text}".strip()
            
            if not text:
                continue # Skip truly empty messages if any

            messages.append({
                'timestamp': dt,
                'sender': current_sender,
                'text': text
            })

        df = pd.DataFrame(messages)
        if not df.empty:
             df.sort_values('timestamp', inplace=True)
        return df

    @staticmethod
    def parse_pdf(file_path: str) -> pd.DataFrame:
        """Extracts text from PDF and applies WhatsApp parsing loosely."""
        extracted_text = []
        with pdfplumber.open(file_path) as pdf:
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
        pattern = re.compile(
            r'^\[?(?P<date>\d{1,2}[/-]\d{1,2}[/-]\d{2,4})[,\s]+(?P<time>\d{1,2}:\d{2}(?::\d{2})?(?:\s*[apAp][mM])?)\]?[\s-]+(?P<sender>[^:]+):\s+(?P<text>.*)$'
        )
        messages = []
        for line in lines:
            line = line.strip()
            if not line: continue
            match = pattern.match(line)
            if match:
                date_str, time_str, sender, text = match.groups()
                messages.append({
                    'timestamp': pd.to_datetime(f"{date_str} {time_str}", dayfirst=True, errors='coerce'),
                    'sender': sender.strip(),
                    'text': text.strip()
                })
            elif messages:
                messages[-1]['text'] += f"\n{line}"
                
        df = pd.DataFrame(messages)
        if not df.empty:
            df.dropna(subset=['timestamp'], inplace=True)
            df.sort_values('timestamp', inplace=True)
        return df

    @staticmethod
    def parse_json(file_path: str) -> pd.DataFrame:
        """Determines if JSON is Instagram or Discord and parses accordingly."""
        with open(file_path, 'r', encoding='utf-8') as f:
            try:
                data = json.loads(sanitize_text(f.read()))
            except Exception as e:
                print(f"JSON Parse Error: {e}")
                return pd.DataFrame()

        # Instagram Detection (Participants + Messages key)
        if isinstance(data, dict) and 'messages' in data and 'participants' in data:
            return Parsers._parse_instagram(data)
        
        # Discord Detection (List of messages with 'Timestamp', 'Contents')
        if isinstance(data, list) and len(data) > 0 and 'Timestamp' in data[0]:
            return Parsers._parse_discord_native(data)
        
        # DiscordChatExporter JSON detection
        if isinstance(data, dict) and 'messages' in data and 'channel' in data:
            return Parsers._parse_discord_exporter(data)

        print("JSON Format not recognized.")
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
            sender = fix_text(msg.get('sender_name', 'UNKNOWN'))
            text = fix_text(msg.get('content', ''))
            ts_ms = msg.get('timestamp_ms')
            
            if ts_ms and text:
                messages.append({
                    'timestamp': pd.to_datetime(ts_ms, unit='ms'),
                    'sender': sender,
                    'text': text
                })
        
        return pd.DataFrame(messages)

    @staticmethod
    def _parse_discord_native(data: list) -> pd.DataFrame:
        messages = []
        for msg in data:
            ts = msg.get('Timestamp')
            text = msg.get('Contents')
            if ts and text:
                messages.append({
                    'timestamp': pd.to_datetime(ts),
                    'sender': 'DISCORD_USER',
                    'text': text
                })
        return pd.DataFrame(messages)

    @staticmethod
    def _parse_discord_exporter(data: dict) -> pd.DataFrame:
        messages = []
        for msg in data.get('messages', []):
            sender = msg.get('author', {}).get('name', 'UNKNOWN')
            text = msg.get('content', '')
            ts = msg.get('timestamp')
            
            if ts and text:
                messages.append({
                    'timestamp': pd.to_datetime(ts),
                    'sender': sender,
                    'text': text
                })
        return pd.DataFrame(messages)
        
def process_file(file_path: str, my_name: str, partner_name: str) -> pd.DataFrame:
    """Takes a file, directs it to the correct parser natively, and standardizes entities."""
    ext = os.path.splitext(file_path)[1].lower()
    if ext == '.html':
        df = Parsers.parse_telegram(file_path)
    elif ext == '.pdf':
        df = Parsers.parse_pdf(file_path)
    elif ext == '.json':
        df = Parsers.parse_json(file_path)
    else:
        df = Parsers.parse_whatsapp(file_path)
        
    if df.empty:
         return df
         
    processed_df = standardize_entities(df, my_name, partner_name)
    
    if processed_df.empty and not df.empty:
        unique_file_names = df['sender'].unique().tolist()
        raise ValueError(f"Name Mismatch: The names you entered ('{my_name}' or '{partner_name}') don't match the names in your export file: {unique_file_names}. Please use the exact names from the chat.")
        
    return processed_df
