const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/Settings.jsx', 'utf8');

const target = 
        
          <div style={{ width: '40px', height: '22px', backgroundColor: darkMode ? 'var(--primary-color)' : '#ccc', borderRadius: '11px', position: 'relative', transition: '0.3s' }}>
            <div style={{ width: '18px', height: '18px', backgroundColor: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: darkMode ? '20px' : '2px', transition: '0.3s' }}></div>
          </div>
        </div>;

code = code.replace(target, '');
fs.writeFileSync('frontend/src/pages/Settings.jsx', code);
console.log('Cleaned up hanging dark mode block');
