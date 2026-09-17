const fs = require('fs');
let code = fs.readFileSync('frontend/src/index.css', 'utf8');

code = code.replace(
  /--shadow-sm: 0 1px 2px rgba\(0, 0, 0, 0\.05\);/g,
  "--shadow-sm: 0 2px 8px rgba(44, 62, 80, 0.08);"
);
code = code.replace(
  /--shadow-md: 0 4px 6px -1px rgba\(0, 0, 0, 0\.05\);/g,
  "--shadow-md: 0 8px 24px rgba(44, 62, 80, 0.12);"
);
code = code.replace(
  /--shadow-lg: 0 10px 15px -3px rgba\(0, 0, 0, 0\.05\);/g,
  "--shadow-lg: 0 16px 40px rgba(44, 62, 80, 0.16);\n  --glass-bg: rgba(255, 255, 255, 0.7);\n  --glass-border: rgba(255, 255, 255, 0.5);"
);

// Add glass-card class
code += "\n\n/* Premium Glassmorphism Card */\n.glass-card {\n  background: var(--glass-bg);\n  backdrop-filter: blur(12px);\n  -webkit-backdrop-filter: blur(12px);\n  border: 1px solid var(--glass-border);\n  box-shadow: var(--shadow-md);\n  border-radius: var(--radius-lg);\n}\n";

fs.writeFileSync('frontend/src/index.css', code);
console.log('Added premium shadows and glassmorphism to CSS');
