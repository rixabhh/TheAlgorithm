const ChatParser = require('../../static/js/parser.js');
const parser = new ChatParser();
const content = `[2023-12-25 14:30] Alice: Merry Christmas!
[2023-12-25 14:31] Bob: You too!
[2023-12-25 14:32] Alice: Did you get my gift?`;

const isSignal = parser.detectSignal(content);
const messages = parser.parseSignal(content);

if (isSignal !== true) {
    console.error("detectSignal failed");
    process.exit(1);
}

if (messages.length !== 3) {
    console.error("parseSignal length failed");
    process.exit(1);
}

if (messages[0].sender !== 'Alice' || messages[0].text !== 'Merry Christmas!') {
    console.error("parseSignal content failed");
    process.exit(1);
}

console.log("Tests passed!");
