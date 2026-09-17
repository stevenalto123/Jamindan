const fs = require('fs');
let code = fs.readFileSync('C:/Users/huawei/.gemini/antigravity/brain/48bcde98-2820-4a0c-931a-4df4c0f3cf5c/task.md', 'utf8');
code = code.replace('- [ ] Add Quick-Dial Action Bar', '- [x] Add Quick-Dial Action Bar');
fs.writeFileSync('C:/Users/huawei/.gemini/antigravity/brain/48bcde98-2820-4a0c-931a-4df4c0f3cf5c/task.md', code);
