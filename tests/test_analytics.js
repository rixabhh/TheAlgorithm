const assert = require('assert');
const AnalyticsEngine = require('../static/js/utils/analytics_engine.js');

const engine = new AnalyticsEngine();

const messages = [
    { sender: 'ME', text: 'Hey, how are you?', timestamp: new Date('2023-01-01T10:00:00Z').getTime() },
    { sender: 'PARTNER', text: 'I am good, sorry I missed your call earlier.', timestamp: new Date('2023-01-01T10:30:00Z').getTime() },
    { sender: 'ME', text: 'No worries! Are we still on for later?', timestamp: new Date('2023-01-01T11:00:00Z').getTime() },
    { sender: 'ME', text: 'Let me know.', timestamp: new Date('2023-01-01T11:05:00Z').getTime() },
    { sender: 'PARTNER', text: 'Yes, my bad. See you at 5.', timestamp: new Date('2023-01-01T15:00:00Z').getTime() }
];

// Test Question Ratio
const questionStats = engine.calculateQuestionRatio(messages);
assert.strictEqual(questionStats.me_questions, 2, 'ME should have 2 questions');
assert.strictEqual(questionStats.partner_questions, 0, 'PARTNER should have 0 questions');
assert.strictEqual(questionStats.me_ratio, 1.0, 'Ratio should be 1.0 for ME');

// Test Apology Rate
const apologyStats = engine.calculateApologyRate(messages);
assert.strictEqual(apologyStats.me_apologies, 0, 'ME should have 0 apologies');
assert.strictEqual(apologyStats.partner_apologies, 2, 'PARTNER should have 2 apologies (sorry, my bad)');

// Test Peak Hours
const peakHourStats = engine.calculatePeakHours(messages);
// 10:00, 10:30 -> hour 10 has 2 messages
// 11:00, 11:05 -> hour 11 has 2 messages
// 15:00 -> hour 15 has 1 message
// Since 10 and 11 tie, it should pick the first one which is 10, but just check peak_volume
assert.strictEqual(peakHourStats.peak_volume, 2, 'Peak volume should be 2');

console.log('Analytics Engine Tests Passed!');
