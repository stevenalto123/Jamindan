const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/Settings.jsx', 'utf8');

// I removed the closing div for the main white box in my regex chunk.
// Let's add it back right before the logout button.

code = code.replace(
  /\n\n      <button \n        onClick=\{logout\}/g,
  "\n      </div>\n\n      <button \n        onClick={logout}"
);

fs.writeFileSync('frontend/src/pages/Settings.jsx', code);
console.log('Restored missing div tag');
