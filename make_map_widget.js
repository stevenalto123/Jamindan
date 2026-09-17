const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/CommandMap.jsx', 'utf8');

// Modify declaration
code = code.replace(/const CommandMap = \(\) => \{/, 'const CommandMap = ({ isWidget = false }) => {');

// Modify container height
code = code.replace(
  /<div style=\{\{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#111' \}\}>/,
  "<div className={isWidget ? 'glass-card' : ''} style={{ display: 'flex', flexDirection: 'column', height: isWidget ? '450px' : '100vh', backgroundColor: '#111', borderRadius: isWidget ? '16px' : '0', overflow: 'hidden', marginBottom: isWidget ? '24px' : '0' }}>"
);

// Conditionally hide header
code = code.replace(
  /\{\/\* Header \*\/\}/g,
  "{!isWidget && (\n        <>\n        {/* Header */}"
);
code = code.replace(
  /\{\/\* Map Container \*\/\}/g,
  "        </>\n      )}\n      {/* Map Container */}"
);

fs.writeFileSync('frontend/src/pages/CommandMap.jsx', code);
console.log('Updated CommandMap to support isWidget prop');
