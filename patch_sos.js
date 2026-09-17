const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/SosPanicButton.jsx', 'utf8');

// Add idle pulse animation to the button
code = code.replace(
  /boxShadow: '0 4px 15px rgba\(231, 76, 60, 0.4\)',/g,
  "boxShadow: '0 4px 15px rgba(231, 76, 60, 0.4)',\n              animation: !isHolding ? 'sos-idle-pulse 2s infinite' : 'none',"
);

// Add the keyframes
code = code.replace(
  /\}<\/style>/g,
  "} @keyframes sos-idle-pulse { 0% { box-shadow: 0 0 0 0 rgba(231, 76, 60, 0.7); } 70% { box-shadow: 0 0 0 15px rgba(231, 76, 60, 0); } 100% { box-shadow: 0 0 0 0 rgba(231, 76, 60, 0); } }</style>"
);

fs.writeFileSync('frontend/src/components/SosPanicButton.jsx', code);
console.log('Added idle heartbeat pulse to SOS button');
