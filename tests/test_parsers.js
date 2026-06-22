const assert = require('assert');
const ChatParser = require('../static/js/utils/parser');

const parser = new ChatParser();

function runTests() {
    console.log("Running ChatParser tests...");

    // Test 1: Test Slack Parse
    const slackJSON = JSON.stringify([
        {
            "type": "message",
            "user": "U1234",
            "text": "Hello Slack",
            "ts": "1618210000.000100",
            "user_profile": {
                "real_name": "Alice"
            }
        },
        {
            "type": "message",
            "subtype": "channel_join",
            "user": "U1234",
            "text": "<@U1234> has joined the channel",
            "ts": "1618210001.000100"
        },
        {
            "type": "message",
            "user": "U5678",
            "text": "Hi Alice",
            "ts": "1618210005.000100",
            "user_profile": {
                "name": "Bob"
            }
        }
    ]);

    const messages = parser.parseSlack(slackJSON);
    assert.strictEqual(messages.length, 2, "Should have 2 valid messages (1 subtype skipped)");

    assert.strictEqual(messages[0].sender, "Alice", "Sender should be extracted from user_profile.real_name");
    assert.strictEqual(messages[0].text, "Hello Slack", "Text should match");
    assert.strictEqual(messages[0].timestamp.getTime(), 1618210000 * 1000, "Timestamp should be correctly converted to milliseconds");

    assert.strictEqual(messages[1].sender, "Bob", "Sender should fallback to user_profile.name");
    assert.strictEqual(messages[1].text, "Hi Alice", "Text should match");

    // Test 2: Test Slack Detect
    const detected = parser.detect(slackJSON.replace(/"/g, '"'), "export.json");
    // Ensure the detection strings are matched correctly
    assert.strictEqual(detected, "Slack", "Slack should be detected from keys");

    console.log("All tests passed!");
}

runTests();
