const assert = require('assert');
const ChatParser = require('../static/js/utils/parser.js');

const parser = new ChatParser();

// Mock Slack JSON data
const mockSlackData = [
    {
        user: "U123456",
        user_profile: { real_name: "Alice" },
        text: "Hello team",
        ts: "1716075932.123456"
    },
    {
        user: "U789012",
        user_profile: { real_name: "Bob" },
        text: "Hi Alice",
        ts: "1716075960.000000"
    },
    {
        subtype: "channel_join",
        user: "U345678",
        ts: "1716076000.000000"
    }
];

// Test parseSlack
const parsedMessages = parser.parseSlack(mockSlackData);

// Verify correct number of messages parsed (should skip the subtype without text)
assert.strictEqual(parsedMessages.length, 2, 'Should parse exactly 2 messages');

// Verify timestamp conversion (1716075932.123456 * 1000 = 1716075932123.456)
// JS Date ignores sub-milliseconds but handles the float conversion
const expectedTimeMs = 1716075932123;
assert.strictEqual(
    parsedMessages[0].timestamp.getTime(),
    expectedTimeMs,
    'UNIX epoch string should be correctly converted to Date object'
);

// Verify sender and text extraction
assert.strictEqual(parsedMessages[0].sender, 'Alice', 'Should extract user_profile.real_name as sender');
assert.strictEqual(parsedMessages[0].text, 'Hello team', 'Should extract correct text');

assert.strictEqual(parsedMessages[1].sender, 'Bob', 'Should extract user_profile.real_name as sender');
assert.strictEqual(parsedMessages[1].text, 'Hi Alice', 'Should extract correct text');

console.log('All Slack parser tests passed!');
