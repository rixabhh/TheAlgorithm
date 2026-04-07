import subprocess
import json


def test_analytics_engine():
    # Write a small script to test the engine using Node
    js_test_script = """
    const AnalyticsEngine = require('./static/js/analytics_engine.js');
    const engine = new AnalyticsEngine();

    // Test Messages
    const messages = [
        { sender: 'ME', text: 'Hey there', timestamp: 1000 },
        { sender: 'PARTNER', text: 'Hi!', timestamp: 2000 }, // gap: 1000ms
        { sender: 'ME', text: 'haha that is funny', timestamp: 1000 + (13 * 60 * 60 * 1000) }, // gap > 12 hours (ghost break) + humor
        { sender: 'PARTNER', text: 'lol I know', timestamp: 1000 + (14 * 60 * 60 * 1000) } // gap: 1 hour + humor
    ];

    const results = engine.runPipeline(messages);
    console.log(JSON.stringify({
        ghost_breakers: results.ghost_breakers,
        humor: results.humor
    }));
    """

    with open("temp_test.js", "w") as f:
        f.write(js_test_script)

    try:
        output = subprocess.check_output(["node", "temp_test.js"]).decode("utf-8")
        data = json.loads(output)

        assert (
            data["ghost_breakers"]["ME"] == 1
        ), f"Expected ME to break 1 ghost period, got {data['ghost_breakers']['ME']}"
        assert (
            data["ghost_breakers"]["PARTNER"] == 0
        ), f"Expected PARTNER to break 0 ghost periods, got {data['ghost_breakers']['PARTNER']}"

        assert (
            data["humor"]["ME"] == 1
        ), f"Expected ME to have 1 humor instance, got {data['humor']['ME']}"
        assert (
            data["humor"]["PARTNER"] == 1
        ), f"Expected PARTNER to have 1 humor instance, got {data['humor']['PARTNER']}"

    finally:
        import os

        if os.path.exists("temp_test.js"):
            os.remove("temp_test.js")
