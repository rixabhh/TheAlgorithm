import json
import requests

SYSTEM_PROMPT = """You are an insightful, deeply empathetic Relationship Coach and a wise, observant confidant.
You are reflecting on the conversational footprint and emotional rhythms of a chat history between '{user}' (ME) and '{partner}' (PARTNER).

Data Dimensions Provided:
- Weekly Volume, Sentiment, and Latency trends.
- Power Dynamics (word count ratios).
- Affection/Friction metrics.
- Support Score (how they respond to each other's stress words).
- Linguistic Mirroring (how their vocabularies have converged).
- Re-engagement (who breaks long silences).
- Topic Mix (Logistics vs Bonding vs Conflict).

The context is: {connection_type}.
User Context: {user_context}

CRITICAL TONE & VOCABULARY GUIDELINES:
1. Act as a warm, human confidant and expert coach. AVOID sounding like a robotic data analyst. 
2. DO NOT use clinical terms like "data points", "latency", "volume", "metrics", "statistics", or "score". Instead, talk about "rhythm", "space", "energy", "harmony", and "conversational flow".
3. NEVER use phrases like "The data shows", "According to the metrics", or "The analytics indicate". Instead use phrasing like "I noticed...", "It feels like...", or "There's a beautiful pattern where...".
4. Speak directly to '{user}' using "you", "your connection", etc. Make it deeply personal and conversational, like you're sitting with them over coffee.
5. KEEP EXPLANATIONS SIMPLE and HUMAN. Avoid overly poetic, complicated, or complex language. Talk to them normally, as an intelligent but accessible friend would.
6. YOU MUST WRITE YOUR ENTIRE RESPONSE IN THE REQUESTED OUTPUT LANGUAGE: {output_language}. If it is 'hinglish', use casual internet-style Roman Hindi mixed with English (e.g. 'Aise lag raha hai ki...', 'Super chill vibe hai', etc). If it's Hindi, write in pure Devanagari Hindi script. If English, keep it English.
7. {tone_guidelines}

Output a valid JSON object with these EXACT keys:
{{
  "dynamic_headline": "A short, evocative, and warm title for their current stage (e.g., 'Navigating the Beautiful Chaos', 'A Season of Deepening Trust').",
  "pulse_summary": "A deeply personalized, conversational, and soulful paragraph (4-6 sentences) synthesizing their emotional climate. Tell the story of how they connect and relate to each other as humans, completely avoiding analytical jargon.",
  "relationship_persona": "A creative, endearing title (e.g., 'The Midnight Philosophers', 'The Steady Rocks').",
  "time_machine_insights": "A warm reflective paragraph analyzing how their shared language, emotional support, and shared rhythms have evolved together over time.",
  "predictive_path": "A gentle, inspiring thought about where their connection is heading based on their recent energy.",
  "compatibility_score": 85,
  "repair_tips": ["A highly specific, warm, human invitation to connect (not a rigid 'exercise').", "A second gentle, heartfelt suggestion based on any recent friction."],
  "milestones": ["First major emotional or connection highlight", "Second meaningful memory or milestone"],
  "top_shareable_snippet": "A fun, short, 'Spotify Wrapped' style compliment or highlight.",
  "chart_insights": {{
    "stability": "1-2 conversational sentences explaining how they handle ups and downs, without mentioning 'charts' or 'intensity boards'.",
    "volume": "1-2 warm sentences about the unique rhythm and flow of their messaging frequency, avoiding 'volume' or 'messages per day'.",
    "latency": "1-2 warm sentences explaining what their response times say about the comfortable space they give each other, avoiding 'latency' or 'response time'.",
    "emoji": "1-2 sentences about the unique 'vibe' their top emojis create.",
    "initiator": "1-2 sentences analyzing the 'first text' balance and how they hold space for each other.",
    "power": "1-2 sentences about how they share the conversational spotlight, ignoring 'word count ratio' terminology.",
    "affection": "1-2 sentences about how they show up for each other affirmatively and kindly."
  }}
}}
Return raw JSON ONLY. Do not use markdown blocks like ```json.
"""

def build_prompt(stats_payload: dict, my_name: str, partner_name: str, connection_type: str, user_context: str = "", output_language: str = "english") -> str:
    """Safely converts the statistical payload to a JSON string prompt."""
    context = {
        "user": my_name,
        "partner": partner_name,
        "connection_type": connection_type,
        "user_context": user_context,
        "analytics_data": stats_payload # Now includes weekly, power_dynamics, emoji freq, etc.
    }
    
    # Custom encoder for numpy types that might sneak in
    def np_encoder(obj):
        import numpy as np
        if isinstance(obj, np.integer): return int(obj)
        if isinstance(obj, np.floating): return float(obj)
        if isinstance(obj, np.ndarray): return obj.tolist()
        return str(obj)

    # Define relationship-specific tone guidelines to prevent romanticizing platonic chats
    tone_guidelines = ""
    ct = connection_type.lower()
    if 'friend' in ct or 'casual' in ct:
        tone_guidelines = "- Tone: Fun, platonic, buddy-like.\n- Vocabulary: Use words like 'Bonding', 'Camaraderie', 'Banter'. STRICTLY AVOID romantic terms like 'Intimacy', 'Passion', 'Romance', 'Honeymoon', or 'Lovers'."
    elif 'professional' in ct or 'work' in ct:
        tone_guidelines = "- Tone: Professional, analytical, team-oriented.\n- Vocabulary: Use words like 'Collaboration', 'Alignment', 'Sync', 'Operations'. STRICTLY AVOID any emotional/romantic terms."
    elif 'family' in ct:
        tone_guidelines = "- Tone: Warm, familial, supportive.\n- Vocabulary: Use words like 'Kinship', 'Care', 'Support'. STRICTLY AVOID romantic terms."
    else:
        tone_guidelines = "- Tone: Empathetic, deep, romantic.\n- Vocabulary: Terms like 'Intimacy', 'Passion', and 'Connection' are appropriate here."

    # We dynamically inject names, connection type, and tone into the system prompt
    sys_prompt = SYSTEM_PROMPT.format(
        user=my_name, 
        partner=partner_name, 
        connection_type=connection_type, 
        user_context=user_context or "None provided.",
        output_language=output_language.upper(),
        tone_guidelines=tone_guidelines
    )
    
    return sys_prompt, f"Here is the relationship data:\n{json.dumps(context, indent=2, default=np_encoder)}"

def call_openai(api_key: str, sys_prompt: str, data_prompt: str) -> dict:
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "gpt-4o", # or gpt-4o-mini
        "messages": [
            {"role": "system", "content": sys_prompt},
            {"role": "user", "content": data_prompt}
        ],
        "temperature": 0.7
    }
    resp = requests.post(url, headers=headers, json=payload)
    resp.raise_for_status()
    # Attempt to parse json 
    content = resp.json()['choices'][0]['message']['content'].strip()
    return json.loads(content)

def call_anthropic(api_key: str, sys_prompt: str, data_prompt: str) -> dict:
    url = "https://api.anthropic.com/v1/messages"
    headers = {
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
    }
    payload = {
        "model": "claude-3-5-sonnet-20241022",
        "system": sys_prompt,
        "messages": [
            {"role": "user", "content": data_prompt}
        ],
        "max_tokens": 1000,
        "temperature": 0.7
    }
    resp = requests.post(url, headers=headers, json=payload)
    resp.raise_for_status()
    content = resp.json()['content'][0]['text'].strip()
    return json.loads(content)

def call_gemini(api_key: str, sys_prompt: str, data_prompt: str) -> dict:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    
    # Gemini requires system instructions differently
    payload = {
        "contents": [{
            "parts": [{"text": sys_prompt + "\n\n" + data_prompt}]
        }],
        "generationConfig": {
            "temperature": 0.7,
            "responseMimeType": "application/json"
        }
    }
    resp = requests.post(url, headers=headers, json=payload)
    resp.raise_for_status()
    
    data = resp.json()
    if 'error' in data:
        raise ValueError(data['error'].get('message', 'Unknown Gemini API Error'))
        
    content = data['candidates'][0]['content']['parts'][0]['text'].strip()
    return json.loads(content)

def generate_report(provider: str, api_key: str, stats_payload: dict, my_name: str, partner_name: str, connection_type: str, user_context: str = "", output_language: str = "english") -> dict:
    """Main entrypoint for the analytics pipeline to get LLM insights."""
    if not api_key:
        return {
            "pulse_summary": "API Key not provided. Skip to charts.",
            "time_machine_insights": "API Key not provided. Skip to charts.",
            "predictive_path": "API Key not provided. Skip to charts.",
            "top_shareable_snippet": "API Key not provided."
        }
    
    sys_prompt, prompt = build_prompt(stats_payload, my_name, partner_name, connection_type, user_context, output_language)
    
    try:
        p = provider.lower()
        if p == 'openai':
            return call_openai(api_key, sys_prompt, prompt)
        elif p == 'anthropic':
            return call_anthropic(api_key, sys_prompt, prompt)
        elif p == 'gemini':
            return call_gemini(api_key, sys_prompt, prompt)
        else:
            raise ValueError(f"Unknown provider: {provider}")
    except Exception as e:
        print(f"LLM API Error: {e}")
        return {
            "pulse_summary": f"Error contacting {provider} API",
            "time_machine_insights": str(e),
            "predictive_path": "Ensure your API key has credits and is valid.",
            "top_shareable_snippet": "Error."
        }
