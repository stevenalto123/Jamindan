const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// Remove import WalkieTalkie from './components/WalkieTalkie';
code = code.replace(/import WalkieTalkie from '\.\/components\/WalkieTalkie';\r?\n/g, '');

// Remove <WalkieTalkie /> from JSX
code = code.replace(/<WalkieTalkie \/>\r?\n/g, '');
// Handle spaces or indents if any
code = code.replace(/[ \t]*<WalkieTalkie \/>[ \t]*\r?\n/g, '');

fs.writeFileSync('frontend/src/App.jsx', code);
console.log('Removed WalkieTalkie from App.jsx');
