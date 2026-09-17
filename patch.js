const fs = require('fs');
let code = fs.readFileSync('backend/routes/authRoutes.js', 'utf8');

const newGetTransporter = sync function sendEmail({ to, subject, html, text }) {
  if (process.env.BREVO_API_KEY) {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: 'Jamindan Emergency IT',
          email: 'jamindan.emergency@gmail.com'
        },
        to: [{ email: to }],
        subject: subject,
        htmlContent: html,
        textContent: text
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error('Brevo API Error: ' + response.status + ' - ' + errorText);
    }
    return { messageId: 'brevo-api' };
  } else {
    // Fallback to Ethereal Email (fake testing inbox)
    const testAccount = await nodemailer.createTestAccount();
    console.log('Created Ethereal Email test account for testing Password Reset!');
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    const info = await transporter.sendMail({
      from: '"Jamindan Emergency IT" <jamindan.emergency@gmail.com>',
      to: to,
      subject: subject,
      text: text,
      html: html
    });
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('-------------------------------------------');
      console.log('PREVIEW FAKE EMAIL HERE: %s', previewUrl);
      console.log('-------------------------------------------');
    }
    return info;
  }
};

// Replace getTransporter declaration
code = code.replace(/async function getTransporter\(\) \{[\s\S]*?\}\s*;/m, newGetTransporter);

// Replace verify-user approve email
code = code.replace(/const transporter = await getTransporter\(\);\s*const senderEmail = process\.env\.SMTP_USER \|\| 'no-reply@jamindan\.gov\.ph';\s*await transporter\.sendMail\(\{[\s\S]*?from:.*,[\s\S]*?to: targetUser\.email,[\s\S]*?subject: 'Account Approved - Jamindan Emergency Response',[\s\S]*?html: ([\s\S]*?)\s*\}\);/m, 
  "await sendEmail({ to: targetUser.email, subject: 'Account Approved - Jamindan Emergency Response', html: $1 });");

// Replace verify-user reject email
code = code.replace(/const transporter = await getTransporter\(\);\s*const senderEmail = process\.env\.SMTP_USER \|\| 'no-reply@jamindan\.gov\.ph';\s*await transporter\.sendMail\(\{[\s\S]*?from:.*,[\s\S]*?to: targetUser\.email,[\s\S]*?subject: 'Registration Update - Jamindan Emergency Response',[\s\S]*?html: ([\s\S]*?)\s*\}\);/m, 
  "await sendEmail({ to: targetUser.email, subject: 'Registration Update - Jamindan Emergency Response', html: $1 });");

// Replace forgot-password email
code = code.replace(/const transporter = await getTransporter\(\);\s*const info = await transporter\.sendMail\(\{[\s\S]*?from:.*,[\s\S]*?to: user\.email,[\s\S]*?subject: 'Password Reset Request',[\s\S]*?text: ([\s\S]*?),[\s\S]*?html: ([\s\S]*?)\s*\}\);/m, 
  "const info = await sendEmail({ to: user.email, subject: 'Password Reset Request', text: $1, html: $2 });");

// Replace the other parts related to preview url since we moved it into sendEmail
code = code.replace(/const previewUrl = nodemailer\.getTestMessageUrl\(info\);\s*if \(previewUrl\) \{\s*console\.log\('-------------------------------------------'\);\s*console\.log\('PREVIEW FAKE EMAIL HERE: %s', previewUrl\);\s*console\.log\('-------------------------------------------'\);\s*\}/g, "");

fs.writeFileSync('backend/routes/authRoutes.js', code);
console.log('Patched authRoutes.js');
