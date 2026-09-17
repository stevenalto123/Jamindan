const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// Replace the dependency array of the useEffect that holds the socket listener.
// We need to find the correct useEffect.
code = code.replace(
  /        socket\.disconnect\(\);\n      \};\n    \}, \[\]\);/g,
  "        socket.disconnect();\n      };\n    }, [user]);"
);

// Update the role check to also exclude Responders
code = code.replace(
  /\/\/ Don't trigger the alarm on the Admin's own screen\n        if \(user\?\.role === 'Admin'\) return;/g,
  "// Don't trigger the alarm for Admin or Responder accounts\n        if (user?.role === 'Admin' || user?.role === 'Responder') return;"
);

fs.writeFileSync('frontend/src/App.jsx', code);
console.log('Fixed Geofenced Evacuation Alarm bugs');
