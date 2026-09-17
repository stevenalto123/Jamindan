const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/UserProfile.jsx', 'utf8');

// We will remove all inner <div style={{ display: 'grid'... }} className="responsive-grid-col">
// and replace them with a simpler wrap or just standard grid layout.

code = code.replace(/<div style=\{\{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' \}\} className="responsive-grid-col">/g, '<div style={{ display: "flex", gap: "12px" }}>');

code = code.replace(/<div style=\{\{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 0.5fr', gap: '12px' \}\} className="responsive-grid-col">/g, '<div style={{ display: "flex", gap: "12px" }}>');

// And we need to make sure the inner .form-group divs have flex: 1
code = code.replace(/<div className="form-group" style=\{\{ margin: 0 \}\}>/g, '<div className="form-group" style={{ margin: 0, flex: 1 }}>');

fs.writeFileSync('frontend/src/pages/UserProfile.jsx', code);
console.log('Fixed UserProfile flex layout.');
