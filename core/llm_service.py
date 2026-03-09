import json
import requests

SYSTEM_PROMPT = """You are a warm, modern Relationship Coach who talks like a real person — think best-friend energy mixed with genuine wisdom.
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

CRITICAL TONE & LANGUAGE GUIDELINES:
1. Write like a smart friend who's also really good at reading people — NOT like a therapist, data scientist, or motivational poster. Think relatable social media captions meets genuine insight.
2. Use modern, conversational language that feels natural to share. Short punchy sentences mixed with deeper observations. It's okay to use casual expressions like "lowkey", "ngl", "the way you two...", "this is giving...", "main character energy" — but SPARINGLY and only where they feel natural. DO NOT force trendy slang into every sentence.
3. DO NOT use clinical terms like "data points", "latency", "volume", "metrics", "statistics", or "score". Instead, talk about "rhythm", "energy", "vibe", "flow".
4. NEVER use phrases like "The data shows", "According to the metrics". Instead say things like "okay so here's what's interesting...", "I noticed something cool...", "the way you two do this thing where...".
5. Speak directly to '{user}' using "you", "your vibe", etc. Make it feel personal, like a DM from a friend who just ran the numbers on your relationship and is hyped to share.
6. Keep it REAL and GENUINE. The goal is insights that make someone go "omg that's so us" and want to screenshot it — not cringe Instagram therapy posts. Balance between wit and warmth.
7. YOU MUST WRITE YOUR ENTIRE RESPONSE IN THE REQUESTED OUTPUT LANGUAGE: {output_language}. If it is 'hinglish', use casual internet-style Roman Hindi mixed with English (e.g. 'Bhai ye toh next level hai...', 'Lowkey wholesome vibes', etc). If it's Hindi, write in pure Devanagari Hindi script. If English, keep it English.
8. {tone_guidelines}

Output a valid JSON object with these EXACT keys:
{{
  "dynamic_headline": "A punchy, memorable headline for their vibe right now — something that would work as an Instagram story caption (e.g., 'The Comfortable Chaos Era', 'Built Different Together', 'Slow Burn Szn').",
  "pulse_summary": "A warm, conversational paragraph (4-6 sentences) that tells the story of how they connect. Mix genuine emotional insight with a modern, relatable tone. Make it feel like something they'd screenshot and send to their bestie.",
  "relationship_persona": "A creative, fun persona title that captures their duo energy (e.g., 'The 2 AM Philosophers', 'Chaos Coordinators', 'The Plot-Twist Couple').",
  "time_machine_insights": "A reflective paragraph about how their connection has evolved — what shifted, what stayed solid, and what that says about them. Keep it warm but real.",
  "predictive_path": "An honest, hopeful thought about where this is heading. Not toxic positivity, but genuinely encouraging based on what the patterns show.",
  "compatibility_score": 85,
  "repair_tips": ["A specific, actionable thing they could try — framed as a suggestion from a friend, not a homework assignment.", "A second real suggestion based on any friction patterns — keep it practical and human."],
  "milestones": ["A standout moment or pattern that defines their journey", "Another meaningful highlight worth celebrating"],
  "top_shareable_snippet": "A short, punchy one-liner that captures their whole vibe — the kind of thing that would go on a Spotify Wrapped card. Make it fun and screenshot-worthy.",
  "chart_insights": {{
    "stability": "1-2 conversational sentences about how they navigate the emotional ups and downs — keep it relatable.",
    "volume": "1-2 sentences about their texting rhythm and what it says about their energy together.",
    "latency": "1-2 sentences about the space they give each other between replies — what it vibes like.",
    "emoji": "1-2 sentences about what their go-to emojis reveal about their personality as a duo.",
    "initiator": "1-2 sentences about the 'who texts first' dynamic — keep it fun and observational.",
    "power": "1-2 sentences about how they share the conversational spotlight.",
    "affection": "1-2 sentences about how they show care and appreciation for each other."
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
