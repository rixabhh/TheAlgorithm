const assert = require('assert');
const ChatParser = require('../static/js/utils/parser.js');

const parser = new ChatParser();

// Mock console methods to avoid cluttering test output
const originalWarn = console.warn;
console.warn = () => {};

function testSlackParser() {
    console.log("Running Slack Parser Tests...");

    // Test basic message parsing
    const slackData = JSON.stringify([
        {
            "user": "U12345",
            "type": "message",
            "ts": "1618210000.000100",
            "text": "Hello world"
        },
        {
            "user_profile": { "real_name": "Alice" },
            "type": "message",
            "ts": "1618210100.000200",
            "text": "Hi Alice"
        },
        {
            "username": "Bot",
            "type": "message",
            "ts": "1618210200.000300",
            "text": "Bot message"
        },
        {
            "user": "U12345",
            "ts": "1618210300.000400"
            // missing text
        }
    ]);

    const messages = parser.parseSlack(slackData);

    assert.strictEqual(messages.length, 3, "Should parse 3 valid messages");

    assert.strictEqual(messages[0].sender, "U12345", "Fallback to user ID if real_name is missing");
    assert.strictEqual(messages[0].text, "Hello world", "Text should match");
    assert.strictEqual(messages[0].timestamp.getTime(), 1618210000000, "Timestamp should be parsed correctly (ignore fractional ms difference for simplicity or check exactly)");
    // actually, new Date(1618210000000.1) is same as new Date(1618210000000)

    assert.strictEqual(messages[1].sender, "Alice", "Should use real_name if available");
    assert.strictEqual(messages[1].text, "Hi Alice");

    assert.strictEqual(messages[2].sender, "Bot", "Should use username if real_name and user are missing");

    console.log("Slack Parser Tests Passed.");
}

testSlackParser();

console.warn = originalWarn;
