import subprocess
import json
import os

def test_analytics_engine_new_metrics():
    # We will write a small node script that uses the AnalyticsEngine class
    # and feeds it test messages to verify `calculateHumorDynamics` and `calculateGhostPeriods`.
    node_script = """
    const AnalyticsEngine = require('./static/js/analytics_engine.js');
    const engine = new AnalyticsEngine();

    const messages = [
        { timestamp: 1000, sender: 'ME', text: 'hello', words: ['hello'], chars: 5 },
        { timestamp: 2000, sender: 'PARTNER', text: 'hi lol', words: ['hi', 'lol'], chars: 6 },
        { timestamp: 3000, sender: 'ME', text: 'lmao 😂', words: ['lmao'], chars: 6 },
        { timestamp: 86403001, sender: 'PARTNER', text: 'ghost break', words: ['ghost', 'break'], chars: 11 }, // > 24 hours later
    ];

    // add latency for metrics
    engine.calculateLatency(messages);

    const humor = engine.calculateHumorDynamics(messages);
    const ghost = engine.calculateGhostPeriods(messages);

    console.log(JSON.stringify({ humor, ghost }));
    """

    script_path = "temp_test_script.js"
    with open(script_path, "w") as f:
        f.write(node_script)

    try:
        result = subprocess.run(["node", script_path], capture_output=True, text=True, check=True)
        output = json.loads(result.stdout)

        # Test humor
        assert output["humor"]["ME"] == 1 # lmao 😂 is counted as 1 message match
        assert output["humor"]["PARTNER"] == 1 # lol
        assert output["humor"]["total"] == 2

        # Test ghosting
        assert output["ghost"]["count"] == 1
        assert float(output["ghost"]["longest_days"]) == 1.0
        assert output["ghost"]["breakers"]["ME"] == 0
        assert output["ghost"]["breakers"]["PARTNER"] == 1

    finally:
        if os.path.exists(script_path):
            os.remove(script_path)
