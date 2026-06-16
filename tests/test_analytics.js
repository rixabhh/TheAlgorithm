const assert = require('assert');
const AnalyticsEngine = require('../static/js/utils/analytics_engine.js');

const engine = new AnalyticsEngine();

const messages = [
    { sender: 'ME', text: 'Hey sorry about earlier', timestamp: new Date('2023-01-01T10:00:00') },
    { sender: 'PARTNER', text: 'its okay, no worries. my fault too.', timestamp: new Date('2023-01-01T10:05:00') },
    { sender: 'ME', text: 'sorry I am running late', timestamp: new Date('2023-01-01T20:00:00') },
];

const processed = engine.runPipeline(messages, 'romantic');

// Test Apologies
assert(processed.apologies, "Apologies object should exist");
assert.strictEqual(processed.apologies.ME, 2, "ME should have 2 apologies");
assert.strictEqual(processed.apologies.PARTNER, 1, "PARTNER should have 1 apology");

// Test Peak Hours
assert(processed.peak_hours, "Peak hours object should exist");
assert.strictEqual(processed.peak_hours.peak_hour, '10:00', "Peak hour should be 10:00");

// Test Sleep time
assert(processed.sleep_time, "Sleep time object should exist");

console.log("Analytics processed successfully.");
