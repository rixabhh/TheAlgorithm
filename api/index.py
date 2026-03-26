# Cloudflare Worker for The Algorithm
# This handles the LLM generation part of the analysis.

import json
from cloudflare import Cloudflare

async def on_request(request, env):
    if request.method != "POST":
        return Response.new("Method Not Allowed", status=405)

    try:
        data = await request.json()
        stats = data.get('stats')
        my_name = data.get('my_name')
        partner_name = data.get('partner_name')
        connection_type = data.get('connection_type')
        tone = data.get('tone', 'balanced')
        user_context = data.get('context', '')
        
        # Determine which AI to use (Workers AI vs External API)
        # For now, we'll implement a robust prompt for the LLM
        prompt = f"""
        Analyze these chat statistics between {my_name} (ME) and {partner_name} (PARTNER).
        Connection: {connection_type}
        Tone: {tone}
        Context: {user_context}
        
        Stats JSON: {json.dumps(stats)}
        
        Generate a deep relationship report for "The Algorithm". Be witty, data-driven, and honest.
        Include sections:
        1. The Vibe Check
        2. Power Dynamics
        3. Red/Green Flags
        4. The Final Verdict
        """
        
        # If user provided their own key, we use that. 
        # Otherwise, we could use env.AI.run() for a free built-in model.
        # But for the "Brutal" quality, we prefer a high-end LLM.
        
        # For this implementation, we simulate the LLM call or use Workers AI
        # Re-using the prompt logic...
        
        return Response.new(json.dumps({"report": "This is where the AI report will appear after connecting your API key."}), 
                            headers={"Content-Type": "application/json"})

    except Exception as e:
        return Response.new(json.dumps({"error": str(e)}), status=500, headers={"Content-Type": "application/json"})
