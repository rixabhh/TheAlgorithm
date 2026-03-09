const { escapeHTML } = require('../static/js/dashboard_utils.js');

const testCases = [
    { input: '<script>alert(1)</script>', expected: '&lt;script&gt;alert(1)&lt;/script&gt;' },
    { input: 'Hello & welcome', expected: 'Hello &amp; welcome' },
    { input: 'He said "Hello"', expected: 'He said &quot;Hello&quot;' },
    { input: "It's a trap", expected: 'It&#039;s a trap' },
    { input: '<b>Bold</b>', expected: '&lt;b&gt;Bold&lt;/b&gt;' },
    { input: null, expected: '' },
    { input: undefined, expected: '' },
    { input: 123, expected: '123' },
    { input: 0, expected: '0' },
    { input: false, expected: 'false' }
];

let allPassed = true;
testCases.forEach((tc, index) => {
    const result = escapeHTML(tc.input);
    if (result === tc.expected) {
        console.log(`Test Case ${index + 1} PASSED`);
    } else {
        console.error(`Test Case ${index + 1} FAILED: Expected "${tc.expected}", got "${result}"`);
        allPassed = false;
    }
});

if (allPassed) {
    console.log("All escapeHTML tests passed!");
    process.exit(0);
} else {
    console.error("Some escapeHTML tests failed.");
    process.exit(1);
}
