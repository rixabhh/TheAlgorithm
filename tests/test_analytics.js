const assert = require('assert');
const AnalyticsEngine = require('../static/js/utils/analytics_engine.js');

function runTests() {
    console.log("Running Analytics Engine Tests...");
    const engine = new AnalyticsEngine();

    // Setup dummy data for conflict indicators
    const conflictMessages = [
        { sender: 'ME', text: 'I am so sorry about that', timestamp: new Date('2023-01-01T10:00:00') },
        { sender: 'PARTNER', text: 'why are you always late and angry?', timestamp: new Date('2023-01-01T10:05:00') },
        { sender: 'PARTNER', text: 'my bad, I overreacted', timestamp: new Date('2023-01-01T10:10:00') }
    ];

    const conflictInfo = engine.calculateConflictIndicators(conflictMessages);
    assert.strictEqual(conflictInfo.ME.apologies, 1, 'ME apologies should be 1');
    assert.strictEqual(conflictInfo.ME.arguments, 0, 'ME arguments should be 0');
    assert.strictEqual(conflictInfo.PARTNER.apologies, 1, 'PARTNER apologies should be 1');
    assert.strictEqual(conflictInfo.PARTNER.arguments, 1, 'PARTNER arguments should be 1');
    console.log("✅ calculateConflictIndicators passed.");

    // Setup dummy data for reciprocity
    const initInfo1 = {
        me_latency_avg: 10,
        partner_latency_avg: 10
    };
    const rec1 = engine.calculateReciprocityScore(initInfo1);
    assert.strictEqual(rec1.score, 100, 'Perfect reciprocity score should be 100');
    assert.strictEqual(rec1.label, 'Reciprocal');

    const initInfo2 = {
        me_latency_avg: 10,
        partner_latency_avg: 100
    };
    const rec2 = engine.calculateReciprocityScore(initInfo2);
    // diff = 90, max = 100 => balance = 1 - 90/100 = 0.1 => score = 10
    assert.strictEqual(rec2.score, 10, 'Highly skewed reciprocity score should be 10');
    assert.strictEqual(rec2.label, 'Highly Skewed');

    console.log("✅ calculateReciprocityScore passed.");
    console.log("All tests passed successfully.");
}

runTests();
