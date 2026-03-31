const AnalyticsEngine = require('./static/js/analytics_engine.js');
const engine = new AnalyticsEngine();

const messages = [
    { timestamp: 100000000, sender: "ME", text: "Hey! How are you?" },
    { timestamp: 100060000, sender: "PARTNER", text: "I'm good, thanks! haha" }, // 1 laugh for PARTNER
    { timestamp: 100120000, sender: "ME", text: "lol that's great" }, // 1 laugh for ME
    { timestamp: 100180000, sender: "ME", text: "what are you doing?" },
    // Gap of 3 days (4320 minutes)
    { timestamp: 100180000 + (4320 * 60 * 1000), sender: "ME", text: "Long time no see!" }, // Break silence by ME
    { timestamp: 100180000 + (4320 * 60 * 1000) + 60000, sender: "PARTNER", text: "yeah been busy hehe" } // 1 laugh for PARTNER
];

const results = engine.runPipeline(messages);
console.log(JSON.stringify(results.humor, null, 2));
console.log(JSON.stringify(results.ghost_periods, null, 2));
