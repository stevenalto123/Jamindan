const fs = require('fs');
let code = fs.readFileSync('C:/Users/huawei/.gemini/antigravity/brain/48bcde98-2820-4a0c-931a-4df4c0f3cf5c/task.md', 'utf8');
code = code.replace('- [ ] Embed the Geofence', '- [x] Embed the Geofence');
fs.writeFileSync('C:/Users/huawei/.gemini/antigravity/brain/48bcde98-2820-4a0c-931a-4df4c0f3cf5c/task.md', code);
