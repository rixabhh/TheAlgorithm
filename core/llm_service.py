import json
import requests

SYSTEM_PROMPT = """You are an insightful, deeply empathetic Relationship Coach and Behavioral Analyst.
You are reviewing a comprehensive statistical summary of a chat history between '{user}' (ME) and '{partner}' (PARTNER).

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
2. DO NOT use clinical terms like "data points", "latency", "volume", or "metrics" in your response. Instead, talk about "rhythm", "space", "energy", and "conversational flow".
3. Explain the *human meaning* behind the numbers. Connect the statistics to their emotional reality.
4. {tone_guidelines}

Output a valid JSON object with these EXACT keys:
{{
  "dynamic_headline": "A short, evocative, and warm title for their current stage (e.g., 'Navigating the Beautiful Chaos', 'A Season of Deepening Trust').",
  "pulse_summary": "A deeply personalized, warm, and insightful paragraph (4-6 sentences) synthesizing their current emotional climate. Read the data to tell the story of how they connect. Write it as if you are speaking directly to them in a coaching session.",
  "relationship_persona": "A creative, endearing title (e.g., 'The Midnight Philosophers', 'The Steady Rocks').",
  "time_machine_insights": "A warm reflective paragraph analyzing how their language, support styles, or sentiment have evolved together over time.",
  "predictive_path": "A gentle, forward-looking thought based on their recent energy and re-engagement habits.",
  "repair_tips": ["A highly specific, warm invitation to connect (not a rigid 'exercise').", "A second gentle suggestion based on their recent friction points."],
  "milestones": ["First major emotional/timeline highlight", "Second meaningful milestone"],
  "top_shareable_snippet": "A fun, short, 'Spotify Wrapped' style compliment or highlight.",
  "chart_insights": {{
    "stability": "1-2 warm sentences explaining what their emotional intensity chart reveals about how they handle ups and downs.",
    "volume": "1-2 warm sentences about the unique rhythm and flow of their messaging frequency.",
    "latency": "1-2 warm sentences explaining what their response times say about the comfortable space they give each other.",
    "emoji": "1-2 sentences about the 'vibe' their top emojis create.",
    "initiator": "1-2 sentences analyzing the 'first text' balance and how they hold space for each other.",
    "power": "1-2 sentences about how they share the conversational spotlight (word count ratio).",
    "affection": "1-2 sentences about how they show up for each other affirmatively versus dismissively."
  }}
}}
Return raw JSON ONLY. Do not use markdown blocks like ```json.
"""

def build_prompt(stats_payload: dict, my_name: str, partner_name: str, connection_type: str, user_context: str = "") -> str:
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

def generate_report(provider: str, api_key: str, stats_payload: dict, my_name: str, partner_name: str, connection_type: str, user_context: str = "") -> dict:
    """Main entrypoint for the analytics pipeline to get LLM insights."""
    if not api_key:
        return {
            "pulse_summary": "API Key not provided. Skip to charts.",
            "time_machine_insights": "API Key not provided. Skip to charts.",
            "predictive_path": "API Key not provided. Skip to charts.",
            "top_shareable_snippet": "API Key not provided."
        }
    
    sys_prompt, prompt = build_prompt(stats_payload, my_name, partner_name, connection_type, user_context)
    
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
