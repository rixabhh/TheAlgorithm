const assert = require('assert');
const ChatParser = require('../static/js/utils/parser.js');

function testSlack() {
    const parser = new ChatParser();

    // Slack export typically has an array of objects
    const slackJSON = `[
        {
            "user": "U12345",
            "type": "message",
            "ts": "1618210000.000100",
            "text": "Hello, world!"
        },
        {
            "user": "U54321",
            "type": "message",
            "ts": "1618210060.000200",
            "text": "How are you?"
        },
        {
            "bot_id": "B123",
            "type": "message",
            "ts": "1618210100.000300",
            "text": "I am a bot"
        }
    ]`;

    const messages = parser.parseSlack(slackJSON);
    assert.strictEqual(messages.length, 3);
    assert.strictEqual(messages[0].sender, "U12345");
    assert.strictEqual(messages[0].text, "Hello, world!");
    assert.ok(messages[0].timestamp instanceof Date);

    console.log("Slack parser works.");
}

testSlack();
