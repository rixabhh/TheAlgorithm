const fs = require('fs');
const path = 'd:/PROJECTS/TheAlgorithm/dashboard.html';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove redundant script
content = content.replace(/<!-- Pass data to JS \(Edge Migration V1\.0\) -->[\s\S]*?<\/script>/, '<!-- Data handled in dashboard.js -->');

// 2. Add hero class
content = content.replace(/<section style=\"background:var\(--purple\);padding:4rem 0 5rem;position:relative;overflow:hidden\">/, '<section class=\"hero-dashboard\" style=\"background:var(--purple);padding:4rem 0 5rem;position:relative;overflow:hidden\">');

fs.writeFileSync(path, content);
console.log('Fixed dashboard.html structure and hero class via Node');
