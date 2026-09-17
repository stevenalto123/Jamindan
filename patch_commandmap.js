const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/CommandMap.jsx', 'utf8');

code = code.replace(/import WalkieTalkie from '\.\.\/components\/WalkieTalkie';\r?\n/g, '');
code = code.replace(/[ \t]*<WalkieTalkie \/>[ \t]*\r?\n/g, '');

fs.writeFileSync('frontend/src/pages/CommandMap.jsx', code);
console.log('Removed WalkieTalkie from CommandMap.jsx');
