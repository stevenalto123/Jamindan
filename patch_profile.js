const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/UserProfile.jsx', 'utf8');

// The main grid wrapper already has className="responsive-grid-col".
// The inner grids look like:
// <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
// <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>

code = code.replace(/<div style=\{\{ display: 'grid', gridTemplateColumns: '(.*?)', gap: '12px' \}\}>/g, 
  "<div style={{ display: 'grid', gridTemplateColumns: '$1', gap: '12px' }} className=\"responsive-grid-col\">");

// Also, the 3-column layout is probably bad for email anyway.
// Let's change the 1fr 1fr 1fr to 1.5fr 1fr 0.5fr to give email more space on desktop!
code = code.replace(/gridTemplateColumns: '1fr 1fr 1fr'/g, "gridTemplateColumns: '1.5fr 1fr 0.5fr'");

fs.writeFileSync('frontend/src/pages/UserProfile.jsx', code);
console.log('Fixed UserProfile inner grids.');
