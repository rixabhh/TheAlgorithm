const ChatParser = require('../static/js/utils/parser.js');
const assert = require('assert');

function testSlackParser() {
    const parser = new ChatParser();
    const slackData = JSON.stringify([
        {
            "client_msg_id": "1",
            "type": "message",
            "text": "Hello world",
            "user": "U12345",
            "ts": "1618210000.000100",
            "team": "T12345",
            "user_profile": {
                "name": "alice",
                "real_name": "Alice Smith"
            }
        }
    ]);

    assert.strictEqual(parser.detect(slackData, "slack.json"), "Slack");

    const parsed = parser.parseSlack(slackData);
    assert.strictEqual(parsed.length, 1);
    assert.strictEqual(parsed[0].sender, "Alice Smith");
    assert.strictEqual(parsed[0].text, "Hello world");
    // 1618210000.000100 * 1000 = 1618210000000.1
    // Floor is taken by Date constructor
    assert.strictEqual(parsed[0].timestamp.getTime(), 1618210000000);

    console.log("Slack parser tests passed.");
}

testSlackParser();
