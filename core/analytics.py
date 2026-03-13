import os
from urllib.parse import urlparse
import pandas as pd
import numpy as np
from transformers import pipeline
import torch
import emoji
from collections import Counter

sentiment_pipeline = None

def get_sentiment_pipeline():
    """Lazy load and quantize the Hinglish sentiment model on CPU."""
    global sentiment_pipeline
    if sentiment_pipeline is None:
        print("Loading and quantizing multilingual sentiment model...")
        model_name = "cardiffnlp/twitter-xlm-roberta-base-sentiment"
        
        # Use pre-downloaded model dir (Docker) or fall back to HuggingFace cache (local dev)
        model_dir = os.environ.get("MODEL_DIR")
        model_kwargs = {"model": model_name, "device": -1}
        if model_dir and os.path.isdir(model_dir):
            print(f"Loading model from local directory: {model_dir}")
            model_kwargs["model"] = model_dir
        
        sentiment_pipeline = pipeline("sentiment-analysis", **model_kwargs)
        # Apply dynamic quantization to Linear layers for 50% RAM reduction
        sentiment_pipeline.model = torch.quantization.quantize_dynamic(
            sentiment_pipeline.model, 
            {torch.nn.Linear}, 
            dtype=torch.qint8
        )
        print("Model loaded successfully.")
    return sentiment_pipeline

def validate_cloud_url(url: str) -> bool:
    """
    Validates that the provided cloud GPU URL is secure and matches the allowed domain.
    Prevents SSRF by enforcing HTTPS and restricting to *.lit.ai.
    """
    if not url:
        return False
    try:
        parsed = urlparse(url)
        # Enforce HTTPS and restrict to Lightning AI domain (*.lit.ai)
        if parsed.scheme == 'https' and parsed.netloc.endswith('.lit.ai'):
            return True
        return False
    except Exception:
        return False

def calculate_latency(df: pd.DataFrame) -> pd.DataFrame:
    df = df.sort_values('timestamp').reset_index(drop=True)
    df['prev_sender'] = df['sender'].shift(1)
    df['prev_timestamp'] = df['timestamp'].shift(1)
    
    df['time_gap_mins'] = (df['timestamp'] - df['prev_timestamp']).dt.total_seconds() / 60.0
    
    # Valid reply: Different sender, gap <= 24 hours (1440 mins)
    valid_reply_mask = (df['sender'] != df['prev_sender']) & (df['time_gap_mins'] <= 1440)
    
    df['latency_mins'] = np.nan
    df.loc[valid_reply_mask, 'latency_mins'] = df.loc[valid_reply_mask, 'time_gap_mins']
    
    df.drop(columns=['prev_sender', 'prev_timestamp', 'time_gap_mins'], inplace=True)
    return df

def apply_sentiment(df: pd.DataFrame, hf_url: str = "") -> pd.DataFrame:
    # We only score PARTNER messages for the risk algorithm
    partner_mask = df['sender'] == 'PARTNER'
    partner_msgs = df.loc[partner_mask, 'text'].astype(str).tolist()
    
    # Truncate to 512 characters to prevent token overflow
    partner_msgs = [x[:512] for x in partner_msgs]
    
    sentiment_scores = []
    
    if hf_url:
        # 🛡️ Sentinel: Validate URL to prevent SSRF
        if not validate_cloud_url(hf_url):
            raise ValueError("Security Error: Invalid cloud GPU URL. Must be a secure https://*.lit.ai endpoint.")

        print(f"Offloading sentiment analysis of {len(partner_msgs)} messages to Cloud GPU...")
        import requests
        import concurrent.futures
        import time as _time
        
        # Ensure URL has /analyze endpoint precisely once
        base_url = hf_url.rstrip('/').replace('/analyze', '')
        api_endpoint = base_url + "/analyze"
        
        chunk_size = 1500 # Send in batches of 1500 to prevent payload too large/timeouts
        total_chunks = (len(partner_msgs) + chunk_size - 1) // chunk_size
        
        sentiment_scores = [0] * len(partner_msgs)
        
        MAX_RETRIES = 3
        BASE_TIMEOUT = 120  # seconds; increased from 90 to handle cold starts
        
        def fetch_chunk(chunk, chunk_index, start_idx):
            """Send a chunk to the Cloud GPU. Retries up to MAX_RETRIES on failure."""
            last_error = None
            for attempt in range(1, MAX_RETRIES + 1):
                timeout = BASE_TIMEOUT + (attempt - 1) * 60  # 120s, 180s, 240s
                try:
                    print(f"  Chunk {chunk_index}/{total_chunks} ({len(chunk)} msgs) → Cloud GPU (attempt {attempt}/{MAX_RETRIES}, timeout={timeout}s)...")
                    response = requests.post(
                        api_endpoint,
                        json={"texts": chunk},
                        headers={"Content-Type": "application/json"},
                        timeout=timeout
                    )
                    response.raise_for_status()
                    result = response.json()
                    if "scores" in result:
                        print(f"  ✓ Chunk {chunk_index}/{total_chunks} completed.")
                        return start_idx, result["scores"]
                    else:
                        raise ValueError(f"Invalid API response format for chunk {chunk_index}: missing 'scores' key")
                except Exception as e:
                    last_error = e
                    if attempt < MAX_RETRIES:
                        wait = 5 * attempt
                        print(f"  ✗ Chunk {chunk_index} attempt {attempt} failed ({e}). Retrying in {wait}s...")
                        _time.sleep(wait)
            # All retries exhausted — propagate the error (NO local fallback)
            raise RuntimeError(f"Chunk {chunk_index} failed after {MAX_RETRIES} attempts: {last_error}")
            
        chunks_data = []
        for i in range(0, len(partner_msgs), chunk_size):
            chunk = partner_msgs[i:i + chunk_size]
            chunk_index = (i // chunk_size) + 1
            chunks_data.append((chunk, chunk_index, i))
        
        try:
            with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
                futures = [executor.submit(fetch_chunk, c, ci, si) for c, ci, si in chunks_data]
                for future in concurrent.futures.as_completed(futures):
                    start_idx, scores = future.result()
                    for idx, score in enumerate(scores):
                        if start_idx + idx < len(sentiment_scores):
                            sentiment_scores[start_idx + idx] = score
                             
        except Exception as e:
            print(f"CRITICAL: Cloud GPU offload failed: {e}.")
            # No local fallback when a cloud URL is provided — this prevents 70k+ messages from locking up the CPU.
            raise RuntimeError(f"Cloud Sentiment Analysis Failed: {e}. Check your Lightning Studio instance.")
            
    else:
        # ONLY run local scoring if NO cloud URL was provided at all
        pipe = get_sentiment_pipeline()
        results = []
        batch_size = 32
        print(f"Scoring {len(partner_msgs)} messages locally in batches of {batch_size}...")
        
        for i in range(0, len(partner_msgs), batch_size):
            batch = partner_msgs[i:i+batch_size]
            try:
                batch_results = pipe(batch)
                results.extend(batch_results)
            except Exception as e:
                print(f"Batch failed: {e}")
                results.extend([{'label': 'Neutral', 'score': 0}] * len(batch))
                
        for r in results:
            label = r['label'].lower()
            if 'positive' in label or label == 'label_2':
                sentiment_scores.append(1)
            elif 'negative' in label or label == 'label_0':
                sentiment_scores.append(-1)
            else:
                sentiment_scores.append(0)
                
    df['sentiment'] = 0
    df.loc[partner_mask, 'sentiment'] = sentiment_scores
    
    return df

def aggregate_weekly(df: pd.DataFrame) -> pd.DataFrame:
    # Anchor to Monday - Vectorized
    df['week_start'] = df['timestamp'].dt.to_period('W').dt.start_time
    
    # Pre-calculate filtered sentiment for vectorized aggregation
    df['_partner_sent'] = df['sentiment'].where(df['sender'] == 'PARTNER')

    # Aggregate using vectorized .agg() instead of slow .apply()
    weekly = df.groupby('week_start').agg(
        volume=('sentiment', 'size'),
        median_latency=('latency_mins', 'median'),
        mean_sentiment=('_partner_sent', 'mean')
    ).reset_index()

    # Clean up temporary column
    df.drop(columns=['_partner_sent'], inplace=True)
    
    weekly.fillna({'median_latency': 0, 'mean_sentiment': 0}, inplace=True)
    return weekly

def calculate_emoji_frequency(df: pd.DataFrame, text_str: pd.Series = None) -> dict:
    """Extract top-10 emoji usage per sender. Must be called BEFORE privacy firewall drops text."""
    result = {}
    # Use pre-calculated string series if provided to avoid redundant astype(str)
    t_series = text_str if text_str is not None else df['text'].astype(str)
    for sender in ['ME', 'PARTNER']:
        mask = df['sender'] == sender
        # Memory-efficient: Use generator to avoid creating a massive intermediate string/list
        emojis_gen = (c for text in t_series[mask] for c in text if emoji.is_emoji(c))
        counts = Counter(emojis_gen).most_common(10)
        result[sender] = [{'emoji': e, 'count': c} for e, c in counts]
    return result

def calculate_initiator_ratio(df: pd.DataFrame) -> dict:
    """Count conversation initiations. An initiation = message after a >=4 hour gap."""
    # Optimization: DF is already sorted by calculate_latency at the start of the pipeline
    if len(df) < 2:
        return {'me_initiations': 0, 'partner_initiations': 0, 'me_ratio': 0.0}
    
    gap_threshold_mins = 240  # 4 hours
    
    df['prev_ts'] = df['timestamp'].shift(1)
    df['gap_mins'] = (df['timestamp'] - df['prev_ts']).dt.total_seconds() / 60.0
    
    # First message is always an initiation
    initiation_mask = (df['gap_mins'] >= gap_threshold_mins) | (df.index == 0)
    initiations = df.loc[initiation_mask]
    
    me_count = int((initiations['sender'] == 'ME').sum())
    partner_count = int((initiations['sender'] == 'PARTNER').sum())
    total = me_count + partner_count
    
    df.drop(columns=['prev_ts', 'gap_mins'], inplace=True)
    
    return {
        'me_initiations': me_count,
        'partner_initiations': partner_count,
        'me_ratio': round(me_count / total, 4) if total > 0 else 0.0
    }

def calculate_risk_score(weekly_df: pd.DataFrame) -> pd.DataFrame:
    if weekly_df.empty: return weekly_df
    
    # Sentiment: -1 (bad) to 1 (good). Inverted: 1 (high risk) to 0 (low risk)
    weekly_df['sentiment_inv'] = (1 - weekly_df['mean_sentiment']) / 2.0
    
    # Latency: Normalize 0 to 1
    max_lat = weekly_df['median_latency'].max()
    min_lat = weekly_df['median_latency'].min()
    if max_lat > min_lat:
        weekly_df['latency_norm'] = (weekly_df['median_latency'] - min_lat) / (max_lat - min_lat)
    else:
        weekly_df['latency_norm'] = 0
        
    # Volume: Normalize and Invert
    max_vol = weekly_df['volume'].max()
    min_vol = weekly_df['volume'].min()
    if max_vol > min_vol:
        vol_norm = (weekly_df['volume'] - min_vol) / (max_vol - min_vol)
        weekly_df['volume_inv'] = 1.0 - vol_norm
    else:
        weekly_df['volume_inv'] = 0
        
    # Formula from PRD 2.0
    weekly_df['risk_score'] = (0.5 * weekly_df['sentiment_inv']) + (0.3 * weekly_df['latency_norm']) + (0.2 * weekly_df['volume_inv'])
    
    # Round metrics for clean UI
    weekly_df['risk_score'] = weekly_df['risk_score'].round(4)
    weekly_df['mean_sentiment'] = weekly_df['mean_sentiment'].round(4)
    weekly_df['median_latency'] = weekly_df['median_latency'].round(2)
    
    return weekly_df

def detect_risk_phases(weekly_df: pd.DataFrame) -> pd.DataFrame:
    """Label each week with a relationship phase based on risk score."""
    def _phase(score):
        if score < 0.3: return 'Honeymoon'
        elif score < 0.6: return 'Stable'
        elif score < 0.85: return 'Tension'
        else: return 'Danger'
    
    if not weekly_df.empty:
        weekly_df['phase'] = weekly_df['risk_score'].apply(_phase)
    return weekly_df

def calculate_power_dynamics(df: pd.DataFrame, text_str: pd.Series = None) -> dict:
    """Calculate the Word Count ratio to establish Power Dynamics (V3.0)."""
    if 'text' not in df.columns: return {}
    
    # Optimization: Use str.count for faster vectorized word counting
    # Use pre-calculated string series if provided
    t_series = text_str if text_str is not None else df['text'].astype(str)
    df['word_count'] = t_series.str.count(r'\S+')
    counts = df.groupby('sender')['word_count'].sum().to_dict()
    
    me_words = int(counts.get('ME', 0))
    partner_words = int(counts.get('PARTNER', 0))
    
    # Ratio: ME / PARTNER. If > 1, ME is dominating the conversation volume.
    ratio = float(round(me_words / partner_words, 2)) if partner_words > 0 else 0.0
    
    return {
        'me_word_count': me_words,
        'partner_word_count': partner_words,
        'power_ratio': ratio
    }

def calculate_affection_friction(df: pd.DataFrame, text_lower: pd.Series = None) -> dict:
    """Detect 'Burnout' via affirmative vs dismissive language trends (V3.0)."""
    if 'text' not in df.columns: return {}
    
    affirmative = ['love', 'thanks', 'happy', 'we', 'miss', 'appreciate', 'glad', 'proud', 'beautiful', 'care']
    dismissive = ['whatever', 'fine', 'okay', 'sure', 'k', 'ok', 'busy', 'tired', 'idk', 'anyway']
    
    # Use pre-calculated lowercased series if provided
    text_lower = text_lower if text_lower is not None else df['text'].astype(str).str.lower()
    
    # Count occurrences across the entire dataset
    aff_count = text_lower.str.contains('|'.join(affirmative), regex=True).sum()
    dis_count = text_lower.str.contains('|'.join(dismissive), regex=True).sum()
    
    return {
        'affirmative_count': int(aff_count),
        'dismissive_count': int(dis_count)
    }

def calculate_support_gap(df: pd.DataFrame, text_lower: pd.Series = None, text_str: pd.Series = None) -> dict:
    """Identify stress messages and measure partner's response quality (V4.0)."""
    if 'text' not in df.columns or len(df) < 5: return {}
    
    stress_keywords = ['work', 'tired', 'sad', 'stressed', 'deadline', 'exhausted', 'unhappy', 'worry', 'anxious', 'sick', 'bad day', 'hard time']
    
    # Optimization: Use input df directly as it is already sorted
    df_temp = df

    # Use pre-calculated series if provided
    t_lower = text_lower if text_lower is not None else df_temp['text'].astype(str).str.lower()
    t_str_vals = text_str.values if text_str is not None else df_temp['text'].astype(str).values

    # Vectorized stress detection outside the loop is much faster
    is_stress = t_lower.str.contains('|'.join(stress_keywords), regex=True).values
    senders = df_temp['sender'].values
    timestamps = df_temp['timestamp'].values
    texts = t_str_vals
    
    support_results = {
        'ME': {'stress_count': 0, 'support_received': 0},
        'PARTNER': {'stress_count': 0, 'support_received': 0}
    }
    
    # State trackers for active stress
    active_stress = {'ME': None, 'PARTNER': None}  # Stores timestamp of last stress msg
    
    # Using numpy array iteration is ~40x faster than df.iterrows()
    for i in range(len(senders)):
        sender = senders[i]
        timestamp = timestamps[i]
        
        # Did this person just send a stress message?
        if is_stress[i]:
            support_results[sender]['stress_count'] += 1
            active_stress[sender] = timestamp
            
        # Did this person just respond to the OTHER person's stress message?
        other_sender = 'PARTNER' if sender == 'ME' else 'ME'
        if active_stress[other_sender] is not None:
            # Check if response is within 60 mins and decent length
            # Use numpy datetime subtraction for speed
            time_diff = (timestamp - active_stress[other_sender]) / np.timedelta64(1, 'm')
            if time_diff <= 60.0 and len(texts[i]) > 10:
                support_results[other_sender]['support_received'] += 1
                # Clear their stress state so we don't double count
                active_stress[other_sender] = None
                
    return support_results

def calculate_reengagement(df: pd.DataFrame) -> dict:
    """Detect who reaches out first after a long silence (> 24h) (V4.0)."""
    # Optimization: DF is already sorted
    if len(df) < 10: return {}
    
    # We already have latency_mins from calculate_latency
    # Long silence = gap > 24 hours (1440 mins)
    df['prev_ts'] = df['timestamp'].shift(1)
    df['gap_hours'] = (df['timestamp'] - df['prev_ts']).dt.total_seconds() / 3600.0
    
    reengagements = df[df['gap_hours'] > 24]
    counts = reengagements['sender'].value_counts().to_dict()
    
    return {
        'me_reengagements': int(counts.get('ME', 0)),
        'partner_reengagements': int(counts.get('PARTNER', 0))
    }

def calculate_linguistic_mirroring(df: pd.DataFrame, text_lower: pd.Series = None) -> dict:
    """Measure how frequently partners adopt each others vocabulary (V4.0)."""
    if 'text' not in df.columns or len(df) < 100:
        return {}
    
    # Simplified approach: Look for rare punctuation/emoji habits or unique high-frequency words
    punctuation_habits = ['!!!', '...', '??', 'haha', 'lol', 'lmao']
    
    results = {}
    # Optimization: Use vectorized .str.contains().any() to avoid massive string joins
    # Joining 100k messages into one string causes major memory spikes and slow search.
    # Use pre-calculated lowercased series if provided
    text_lower = text_lower if text_lower is not None else df['text'].astype(str).str.lower()
    
    # Pre-calculate habit presence for each sender using vectorized operations
    habit_presence = {}
    for sender in ['ME', 'PARTNER']:
        sender_mask = df['sender'] == sender
        sender_msgs = text_lower[sender_mask]
        habit_presence[sender] = {
            habit: sender_msgs.str.contains(habit, regex=False).any()
            for habit in punctuation_habits
        }

    for sender in ['ME', 'PARTNER']:
        other = 'PARTNER' if sender == 'ME' else 'ME'
        mirror_score = sum(
            1 for habit in punctuation_habits
            if habit_presence[sender][habit] and habit_presence[other][habit]
        )
        results[f"{sender}_mirroring"] = mirror_score
        
    return results

def calculate_topic_mix(df: pd.DataFrame, connection_type: str, text_lower: pd.Series = None) -> dict:
    """Categorize conversation dynamically based on connection type (V4.0)."""
    if 'text' not in df.columns: return {}
    
    # Base topics that apply to everything
    logistics = ['dinner', 'lunch', 'bill', 'home', 'work', 'done', 'todo', 'buy', 'shop', 'cleaning']
    external = ['friends', 'party', 'movie', 'news', 'gym', 'weather', 'job']
    conflict = ['sorry', 'why', 'fight', 'angry', 'stop', 'listen', 'mean', 'hurt', 'annoyed']
    
    # Relationship-specific intimacy/bonding terms
    if connection_type == 'romantic':
        intimacy = ['love', 'miss', 'baby', 'darling', 'honey', 'kiss', 'hug', 'beautiful', 'forever']
        categories = {'Logistics': logistics, 'Intimacy': intimacy, 'Conflict': conflict, 'External': external}
    elif connection_type in ['friendship', 'casual', 'family']:
        bonding = ['miss', 'love', 'haha', 'lol', 'fun', 'crazy', 'remember', 'bro', 'dude', 'bestie']
        categories = {'Logistics': logistics, 'Bonding': bonding, 'Disagreement': conflict, 'External': external}
    elif connection_type == 'professional':
        collaboration = ['help', 'thanks', 'appreciate', 'great', 'good job', 'team', 'meeting', 'sync']
        categories = {'Operations': logistics, 'Collaboration': collaboration, 'Blockers': conflict, 'External': external}
    else:
        # Default fallback
        categories = {'Logistics': logistics, 'Bonding': ['miss', 'care', 'fun'], 'Conflict': conflict, 'External': external}
    
    # Use pre-calculated lowercased series if provided
    text_lower = text_lower if text_lower is not None else df['text'].astype(str).str.lower()
    results = {}
    
    for cat, keywords in categories.items():
        results[cat] = int(text_lower.str.contains('|'.join(keywords), regex=True).sum())
        
    return results

def run_analytics_pipeline(df: pd.DataFrame, hf_url: str = "", connection_type: str = "romantic") -> dict:
    """Runs the full analytics pipeline and returns a dict with weekly stats, emoji freq, and initiator ratio."""
    df = calculate_latency(df)
    df = apply_sentiment(df, hf_url=hf_url)

    # Optimization: Pre-calculate string conversions and lowercasing once
    # to avoid redundant O(N) operations across multiple analytics functions.
    text_str = df['text'].astype(str)
    text_lower = text_str.str.lower()
    
    # Phase 6: Extract enhanced features BEFORE privacy firewall
    emoji_freq = calculate_emoji_frequency(df, text_str=text_str)
    initiator_ratio = calculate_initiator_ratio(df.copy())
    
    # Phase 8 (V3.0): Power Dynamics & Burnout NLP
    power_dynamics = calculate_power_dynamics(df, text_str=text_str)
    affection_friction = calculate_affection_friction(df, text_lower=text_lower)
    
    # Phase 11 (V4.0): Advanced Personalization
    support_gap = calculate_support_gap(df, text_lower=text_lower, text_str=text_str)
    reengagement = calculate_reengagement(df)
    mirroring = calculate_linguistic_mirroring(df, text_lower=text_lower)
    topic_mix = calculate_topic_mix(df, connection_type, text_lower=text_lower)
    
    # Privacy handling: text is needed for flashbacks in app.py, so we don't drop it here anymore.
    # The app.py will handle the session storage and eventual purging.
        
    weekly_df = aggregate_weekly(df)
    weekly_df = calculate_risk_score(weekly_df)
    weekly_df = detect_risk_phases(weekly_df)
    
    # Format date for JSON
    weekly_df['week_start'] = weekly_df['week_start'].dt.strftime('%Y-%m-%d')
    
    return {
        'weekly': weekly_df.to_dict(orient='records'),
        'emoji_freq': emoji_freq,
        'initiator_ratio': initiator_ratio,
        'power_dynamics': power_dynamics,
        'affection_friction': affection_friction,
        'support_gap': support_gap,
        'reengagement': reengagement,
        'mirroring': mirroring,
        'topic_mix': topic_mix
    }
