const fs = require('fs');

function writeWav(filename, sampleRate, samples) {
    const buffer = Buffer.alloc(44 + samples.length * 2);
    
    // RIFF chunk descriptor
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + samples.length * 2, 4);
    buffer.write('WAVE', 8);
    
    // fmt sub-chunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16); // Subchunk1Size
    buffer.writeUInt16LE(1, 20); // AudioFormat (PCM)
    buffer.writeUInt16LE(1, 22); // NumChannels
    buffer.writeUInt32LE(sampleRate, 24); // SampleRate
    buffer.writeUInt32LE(sampleRate * 2, 28); // ByteRate
    buffer.writeUInt16LE(2, 32); // BlockAlign
    buffer.writeUInt16LE(16, 34); // BitsPerSample
    
    // data sub-chunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(samples.length * 2, 40);
    
    // Write PCM samples
    for (let i = 0; i < samples.length; i++) {
        // Clamp between -32768 and 32767
        let val = Math.max(-32768, Math.min(32767, Math.floor(samples[i] * 32767)));
        buffer.writeInt16LE(val, 44 + i * 2);
    }
    
    fs.writeFileSync(filename, buffer);
}

const sampleRate = 44100;

// 1. CHIME: 3 beeps
let chimeSamples = [];
for (let b = 0; b < 3; b++) {
    // 0.3s beep
    for (let i = 0; i < sampleRate * 0.3; i++) {
        let t = i / sampleRate;
        let freq = 800; // 800Hz
        let env = Math.exp(-t * 5); // decay
        chimeSamples.push(Math.sin(2 * Math.PI * freq * t) * env);
    }
    // 0.2s silence
    for (let i = 0; i < sampleRate * 0.2; i++) {
        chimeSamples.push(0);
    }
}
writeWav('frontend/public/chime.wav', sampleRate, chimeSamples);

// 2. SIREN: European style high-low
let sirenSamples = [];
for (let b = 0; b < 10; b++) { // 10 seconds
    for (let i = 0; i < sampleRate * 0.5; i++) {
        let t = i / sampleRate;
        sirenSamples.push(Math.sin(2 * Math.PI * 600 * t)); // 600Hz
    }
    for (let i = 0; i < sampleRate * 0.5; i++) {
        let t = i / sampleRate;
        sirenSamples.push(Math.sin(2 * Math.PI * 800 * t)); // 800Hz
    }
}
writeWav('frontend/public/siren.wav', sampleRate, sirenSamples);

console.log("WAV files generated!");
