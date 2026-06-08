const assert = require('assert');
const ChatParser = require('../static/js/utils/parser.js');

const parser = new ChatParser();

// 1. WhatsApp (.txt)
const whatsappSample = `
1/1/25, 10:00 AM - Alice: Hey Bob, what's up?
1/1/25, 10:05 AM - Bob: Not much, just working.
`;

const waMessages = parser.parseWhatsApp(whatsappSample);
assert.strictEqual(waMessages.length, 2);
assert.strictEqual(waMessages[0].sender, 'Alice');
assert.strictEqual(waMessages[1].sender, 'Bob');

// 2. Telegram (.html)
const telegramSample = `
<div class="message default clearfix" id="message1">
  <div class="pull_right date details" title="01.01.2025 10:00:00"></div>
  <div class="from_name">Alice</div>
  <div class="text">Hello</div>
</div>
<div class="message default clearfix" id="message2">
  <div class="pull_right date details" title="01.01.2025 10:05:00"></div>
  <div class="from_name">Bob</div>
  <div class="text">Hi</div>
</div>
`;

const tgMessages = parser.parseTelegram(telegramSample);
assert.strictEqual(tgMessages.length, 2);
assert.strictEqual(tgMessages[0].sender, 'Alice');
assert.strictEqual(tgMessages[1].sender, 'Bob');


// 3. Instagram (.json)
const instaSample = {
    messages: [
        { sender_name: 'Alice', content: 'Hey', timestamp_ms: 1700000000000 },
        { sender_name: 'Bob', content: 'Yo', timestamp_ms: 1700000010000 }
    ]
};

const instaMessages = parser.parseInstagram(instaSample);
assert.strictEqual(instaMessages.length, 2);
assert.strictEqual(instaMessages[0].sender, 'Alice');
assert.strictEqual(instaMessages[1].sender, 'Bob');


// 4. Discord (.json)
const discordSample = [
    { author: { name: 'Alice' }, content: 'Sup', timestamp: '2025-01-01T10:00:00Z' },
    { author: { name: 'Bob' }, content: 'Nothing', timestamp: '2025-01-01T10:05:00Z' }
];

const discordMessages = parser.parseDiscord(discordSample);
assert.strictEqual(discordMessages.length, 2);
assert.strictEqual(discordMessages[0].sender, 'Alice');
assert.strictEqual(discordMessages[1].sender, 'Bob');

// 5. Slack (.json)
const slackSample = [
    { type: 'message', user_profile: { real_name: 'Alice' }, text: 'Hello', ts: '1618210000.000100' },
    { type: 'message', user: 'U12345', text: 'Hi', ts: '1618210010.000100' }
];

const slackMessages = parser.parseSlack(slackSample);
assert.strictEqual(slackMessages.length, 2);
assert.strictEqual(slackMessages[0].sender, 'Alice');
assert.strictEqual(slackMessages[1].sender, 'U12345');
assert.strictEqual(slackMessages[0].timestamp.getTime(), 1618210000000);

console.log('All tests passed!');
