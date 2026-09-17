const fs = require('fs');
let code = fs.readFileSync('frontend/android/app/src/main/AndroidManifest.xml', 'utf8');

if (!code.includes('RECORD_AUDIO')) {
  code = code.replace(
    '<uses-permission android:name="android.permission.INTERNET" />',
    '<uses-permission android:name="android.permission.INTERNET" />\n    <uses-permission android:name="android.permission.RECORD_AUDIO" />\n    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />'
  );
  fs.writeFileSync('frontend/android/app/src/main/AndroidManifest.xml', code);
  console.log('Added RECORD_AUDIO permissions to Android.');
} else {
  console.log('Permissions already exist.');
}
