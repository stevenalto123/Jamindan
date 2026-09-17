const fs = require('fs');
let code = fs.readFileSync('frontend/src/context/AuthContext.jsx', 'utf8');

// The original line:
// export const BACKEND_URL = window.Capacitor ? 'http://159.223.110.159:29052' : 'https://jamindan.onrender.com';

code = code.replace(
  /export const BACKEND_URL = window\.Capacitor \? 'http:\/\/159\.223\.110\.159:29052' : 'https:\/\/jamindan\.onrender\.com';/,
  "export const BACKEND_URL = 'https://jamindan.onrender.com';"
);

fs.writeFileSync('frontend/src/context/AuthContext.jsx', code);
console.log('Fixed BACKEND_URL for Capacitor.');
