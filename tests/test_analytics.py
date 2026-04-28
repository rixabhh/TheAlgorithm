import subprocess
import json
import os

def test_analytics_engine_edge_cases() -> None:
    js_code = """
    const AnalyticsEngine = require('./static/js/analytics_engine.js');
    const engine = new AnalyticsEngine();

    // Test case 1: Very short conversation with laughter
    const messages1 = [
        { sender: 'ME', text: 'haha lol', timestamp: 1000, words: ['haha', 'lol'], chars: 8 },
        { sender: 'PARTNER', text: 'hehe 😂', timestamp: 2000, words: ['hehe'], chars: 7 }
    ];
    const res1 = engine.runPipeline(messages1, 'romantic');

    // Test case 2: Long gap silence breakers
    const messages2 = [
        { sender: 'ME', text: 'hi', timestamp: 1000, words: ['hi'], chars: 2 },
        { sender: 'PARTNER', text: 'hello', timestamp: 1000 + (13 * 60 * 60 * 1000), words: ['hello'], chars: 5 }
    ];
    const res2 = engine.runPipeline(messages2, 'romantic');

    // Test case 3: Caps lock
    const messages3 = [
        { sender: 'ME', text: 'OMG NO WAY', timestamp: 1000, words: ['omg', 'no', 'way'], chars: 10 },
        { sender: 'PARTNER', text: 'crazy', timestamp: 2000, words: ['crazy'], chars: 5 }
    ];
    const res3 = engine.runPipeline(messages3, 'romantic');

    console.log(JSON.stringify({
        res1: {
            laughter: res1.laughter
        },
        res2: {
            silence_breakers: res2.silence_breakers
        },
        res3: {
            caps_lock: res3.caps_lock
        }
    }));
    """

    with open('test_temp.js', 'w', encoding='utf-8') as f:
        f.write(js_code)

    try:
        result = subprocess.run(['node', 'test_temp.js'], capture_output=True, text=True, check=True)
        data = json.loads(result.stdout)

        # Verify Laughter
        assert data['res1']['laughter']['ME'] == 1, "Expected 1 laugh from ME"
        assert data['res1']['laughter']['PARTNER'] == 1, "Expected 1 laugh from PARTNER"

        # Verify Silence Breakers
        assert data['res2']['silence_breakers']['PARTNER'] == 1, "Expected 1 silence break from PARTNER"
        assert data['res2']['silence_breakers']['ME'] == 0, "Expected 0 silence break from ME"

        # Verify Caps Lock
        assert data['res3']['caps_lock']['ME'] == 1, "Expected 1 caps lock from ME"
        assert data['res3']['caps_lock']['PARTNER'] == 0, "Expected 0 caps lock from PARTNER"

    finally:
        if os.path.exists('test_temp.js'):
            os.remove('test_temp.js')
