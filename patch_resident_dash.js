const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/ResidentDashboard.jsx', 'utf8');

// 1. Add icons
code = code.replace(
  /import \{ Bell \} from 'lucide-react';/,
  "import { Bell, Phone, Shield, Flame, HeartPulse } from 'lucide-react';"
);

// 2. Add Quick-Dial Row
const quickDialHTML = 
      {/* Premium Quick-Dial Action Bar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <a href="tel:911" style={{ flex: 1, textDecoration: 'none' }}>
          <div className="glass-card" style={{ padding: '12px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', backgroundColor: 'rgba(52, 152, 219, 0.1)' }}>
            <div style={{ padding: '8px', backgroundColor: '#3498db', borderRadius: '50%', color: 'white' }}>
              <Shield size={20} />
            </div>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#2980b9' }}>Police</span>
          </div>
        </a>
        <a href="tel:911" style={{ flex: 1, textDecoration: 'none' }}>
          <div className="glass-card" style={{ padding: '12px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', backgroundColor: 'rgba(230, 126, 34, 0.1)' }}>
            <div style={{ padding: '8px', backgroundColor: '#e67e22', borderRadius: '50%', color: 'white' }}>
              <Flame size={20} />
            </div>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#d35400' }}>Fire</span>
          </div>
        </a>
        <a href="tel:911" style={{ flex: 1, textDecoration: 'none' }}>
          <div className="glass-card" style={{ padding: '12px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', backgroundColor: 'rgba(46, 204, 113, 0.1)' }}>
            <div style={{ padding: '8px', backgroundColor: '#2ecc71', borderRadius: '50%', color: 'white' }}>
              <HeartPulse size={20} />
            </div>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#27ae60' }}>Medical</span>
          </div>
        </a>
      </div>
;

code = code.replace(
  /\{\/\* Official SOS Panic Button Component \*\/\}/,
  quickDialHTML + "\n      {/* Official SOS Panic Button Component */}"
);

// 3. Add glass-card to the grid cards
code = code.replace(
  /<div style=\{\{ backgroundColor: 'var\(--card-bg\)', padding: '20px'/g,
  <div className="glass-card" style={{ padding: '20px'
);
code = code.replace(
  /<div style=\{\{ backgroundColor: '#fdf2f2', padding: '20px'/g,
  <div className="glass-card" style={{ backgroundColor: '#fdf2f2', padding: '20px'
);
code = code.replace(
  /<div style=\{\{ backgroundColor: 'var\(--card-bg\)', padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '10px' \}\}>/,
  <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
);

fs.writeFileSync('frontend/src/pages/ResidentDashboard.jsx', code);
console.log('Added quick dial and glass cards to ResidentDashboard');
