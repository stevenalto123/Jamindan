const fs = require('fs');

function writeWav(filename, sampleRate, samples) {
    const buffer = Buffer.alloc(44 + samples.length * 2);
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + samples.length * 2, 4);
    buffer.write('WAVE', 8);
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20);
    buffer.writeUInt16LE(1, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * 2, 28);
    buffer.writeUInt16LE(2, 32);
    buffer.writeUInt16LE(16, 34);
    buffer.write('data', 36);
    buffer.writeUInt32LE(samples.length * 2, 40);
    
    for (let i = 0; i < samples.length; i++) {
        let val = Math.max(-32768, Math.min(32767, Math.floor(samples[i] * 32767)));
        buffer.writeInt16LE(val, 44 + i * 2);
    }
    
    fs.writeFileSync(filename, buffer);
}

const sampleRate = 44100;

// 1. PROFESSIONAL RESPONDER CHIME (Motorola Pager Style)
// 4 fast, bright, urgent beeps followed by a pause
let chimeSamples = [];
const beepDuration = 0.12; 
const silenceDuration = 0.08; 
const f1 = 1200;
const f2 = 1400;

let chimePhase1 = 0;
let chimePhase2 = 0;

for(let b=0; b<4; b++) {
    // Beep
    for (let i = 0; i < sampleRate * beepDuration; i++) {
        chimePhase1 += 2 * Math.PI * f1 / sampleRate;
        chimePhase2 += 2 * Math.PI * f2 / sampleRate;
        // Mix sine with a bit of square wave for a harsh, bright electronic pager sound
        let s1 = Math.sin(chimePhase1);
        let sq1 = Math.sign(Math.sin(chimePhase1)) * 0.4;
        let val = (s1 + sq1) * 0.5; // Smooth but rich
        chimeSamples.push(val);
    }
    // Silence between beeps
    for (let i = 0; i < sampleRate * silenceDuration; i++) {
        chimeSamples.push(0);
    }
}
// Pause before repeating the 4 beeps
for (let i = 0; i < sampleRate * 1.0; i++) {
    chimeSamples.push(0);
}
writeWav('frontend/public/chime.wav', sampleRate, chimeSamples);


// 2. REALISTIC WAIL SIREN (American Police / Ambulance Style)
// Smoothly sweeps up and down
let sirenSamples = [];
let sirenPhase = 0;

// Sweep up 500Hz to 1200Hz over 2 seconds
for (let i = 0; i < sampleRate * 2.0; i++) {
    let t = i / (sampleRate * 2.0);
    let freq = 500 + (700 * t);
    sirenPhase += 2 * Math.PI * freq / sampleRate;
    sirenSamples.push(Math.sin(sirenPhase) * 0.8);
}
// Sweep down 1200Hz to 500Hz over 2 seconds
for (let i = 0; i < sampleRate * 2.0; i++) {
    let t = i / (sampleRate * 2.0);
    let freq = 1200 - (700 * t);
    sirenPhase += 2 * Math.PI * freq / sampleRate;
    sirenSamples.push(Math.sin(sirenPhase) * 0.8);
}
writeWav('frontend/public/siren.wav', sampleRate, sirenSamples);

console.log("Professional audio files generated successfully!");
