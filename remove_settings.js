const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/Settings.jsx', 'utf8');

const regex = /\{\/\* Email Advisories Setting \*\/\}[\s\S]*?\{\/\* Dark Mode Setting \*\/\}[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;

if (regex.test(code)) {
    code = code.replace(regex, '');
    fs.writeFileSync('frontend/src/pages/Settings.jsx', code);
    console.log('Removed all dead toggles');
} else {
    console.log('Regex did not match.');
}
