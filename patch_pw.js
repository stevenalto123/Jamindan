const fs = require('fs');
let code = fs.readFileSync('backend/routes/authRoutes.js', 'utf8');

// The new strong password logic
const passwordCheckRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
const passwordErrorMessage = 'Password must be at least 8 characters long and contain at least one uppercase letter and one number.';

// Register Route Replace
code = code.replace(/if \(password\.length < 6\) \{\s*return res\.status\(400\)\.json\(\{ message: 'Password must be at least 6 characters long' \}\);\s*\}/, 
if (!/^(?=.*[A-Z])(?=.*\\d).{8,}$/.test(password)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long and contain at least one uppercase letter and one number.' });
    });

// Reset Password Replace
code = code.replace(/if \(newPassword\.length < 6\) \{\s*return res\.status\(400\)\.json\(\{ message: 'Password must be at least 6 characters\.' \}\);\s*\}/, 
if (!/^(?=.*[A-Z])(?=.*\\d).{8,}$/.test(newPassword)) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long and contain at least one uppercase letter and one number.' });
  });

// Change Password Replace (doesn't exist in the same format, let's search if length check exists. If not we insert it)
// Looking at the grep output, change-password doesn't even have a length check!
// So let's insert it after checking if newPassword is provided.
code = code.replace(/if \(!currentPassword \|\| !newPassword\) \{\s*return res\.status\(400\)\.json\(\{ message: 'Current password and new password are required' \}\);\s*\}/, 
if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current password and new password are required' });
  }

  if (!/^(?=.*[A-Z])(?=.*\\d).{8,}$/.test(newPassword)) {
    return res.status(400).json({ message: 'New password must be at least 8 characters long and contain at least one uppercase letter and one number.' });
  });

fs.writeFileSync('backend/routes/authRoutes.js', code);
console.log('Password security patched.');
