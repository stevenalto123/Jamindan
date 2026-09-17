const fs = require('fs');
let code = fs.readFileSync('backend/server.js', 'utf8');

// Remove walkie-talkie lines
const walkieBlock =   // --- Walkie-Talkie Radio Comms ---
  socket.on('join-global-radio', () => {
    socket.join('global-radio');
    console.log(\Socket \ joined global-radio\);
  });

  socket.on('radio-transmission', (data) => {
    // data contains { audioBlob, senderName, senderRole, timestamp }
    // Broadcast to everyone else in the radio room
    socket.to('global-radio').emit('radio-transmission', data);
  });

  socket.on('radio-active', (data) => {
    socket.to('global-radio').emit('radio-active', data);
  });

  socket.on('radio-inactive', () => {
    socket.to('global-radio').emit('radio-inactive');
  });;

code = code.replace(walkieBlock, '');

fs.writeFileSync('backend/server.js', code);
console.log('Removed WalkieTalkie socket events from server.js');
