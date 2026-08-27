const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { authRequired, requireRole } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp|heic|heif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('SECURITY ERROR: Only image files (JPG, PNG, WEBP, HEIC) are allowed.'));
  }
});

// Register Resident
router.post('/register', upload.fields([{ name: 'id_photo', maxCount: 1 }, { name: 'selfie_photo', maxCount: 1 }]), async (req, res) => {
  const { username, email, password, full_name, phone, barangay, age, id_type } = req.body;

  if (!username || !email || !password || !full_name || !phone || !barangay || !age || !id_type) {
    return res.status(400).json({ message: 'All fields including Email and ID Type are required' });
  }

  // Input Validation
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  if (!usernameRegex.test(username.trim())) {
    return res.status(400).json({ message: 'Username must be 3-20 characters long and contain only letters, numbers, or underscores' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({ message: 'Please provide a valid email address' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  if (parseInt(age) < 18) {
    return res.status(400).json({ message: 'You must be at least 18 years old to register. Minors should ask a parent or guardian to report for them.' });
  }

  const id_photo_path = req.files && req.files['id_photo'] ? `/uploads/${req.files['id_photo'][0].filename}` : null;
  const selfie_photo_path = req.files && req.files['selfie_photo'] ? `/uploads/${req.files['selfie_photo'][0].filename}` : null;

  if (!id_photo_path || !selfie_photo_path) {
    return res.status(400).json({ message: 'Both ID and Selfie photos are required for verification.' });
  }

  let cleanPhone = phone ? phone.trim().replace(/[\s\-\(\)\+]/g, '') : '';
  if (cleanPhone.startsWith('639')) {
    cleanPhone = '09' + cleanPhone.slice(3);
  }

  const phoneRegex = /^09\d{9}$/;
  if (!phoneRegex.test(cleanPhone) || cleanPhone.length !== 11) {
    return res.status(400).json({ message: 'Phone number must be exactly 11 digits long and start with 09 (e.g., 09171234567)' });
  }

  try {
    // Check if username or email exists
    const [existing] = await db.execute('SELECT id FROM users WHERE username = ? OR email = ?', [username.trim().toLowerCase(), email.trim().toLowerCase()]);
    const existingUser = existing[0];
    if (existingUser) {
      return res.status(400).json({ message: 'Username or Email is already registered' });
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);

    await db.execute(`
      INSERT INTO users (username, email, password_hash, role, full_name, phone, barangay, age, id_type, id_photo_path, selfie_photo_path, is_verified)
      VALUES (?, ?, ?, 'Resident', ?, ?, ?, ?, ?, ?, ?, 0)
    `, [username.trim().toLowerCase(), email.trim().toLowerCase(), password_hash, full_name.trim(), cleanPhone, barangay.trim(), parseInt(age), id_type.trim(), id_photo_path, selfie_photo_path]);

    await db.logAudit(`User account registered: ${username.trim().toLowerCase()}`, username.trim().toLowerCase(), req.ip);
    return res.status(201).json({ message: 'Registration successful! You can now log in.' });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username.trim().toLowerCase()]);
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    if (!user.is_active) {
      await db.logAudit(`Login blocked (deactivated account)`, username.trim().toLowerCase(), req.ip);
      return res.status(403).json({ message: 'Account is deactivated. Please contact administrator.' });
    }

    if (user.role === 'Resident' && !user.is_verified) {
      await db.logAudit(`Login blocked (pending verification)`, username.trim().toLowerCase(), req.ip);
      return res.status(403).json({ message: 'Account pending verification. Please wait for an administrator to review your ID. You will receive an email (check your Spam folder) once approved.' });
    }

    const passwordMatch = bcrypt.compareSync(password, user.password_hash);
    if (!passwordMatch) {
      await db.logAudit(`Failed login attempt`, username.trim().toLowerCase(), req.ip);
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    await db.logAudit(`User authentication successful`, user.username, req.ip);
    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        full_name: user.full_name,
        phone: user.phone,
        barangay: user.barangay,
        purok_sitio: user.purok_sitio,
        blood_type: user.blood_type,
        allergies: user.allergies,
        medical_conditions: user.medical_conditions,
        emergency_contact_name: user.emergency_contact_name,
        emergency_contact_phone: user.emergency_contact_phone,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login' });
  }
});

// Logout
router.post('/logout', authRequired, async (req, res) => {
  try {
    await db.logAudit(`User logged out`, req.user.username, req.ip);
    return res.json({ message: 'Logout logged successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ message: 'Server error during logout' });
  }
});

// Get profile
router.get('/me', authRequired, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT id, username, role, full_name, phone, barangay, purok_sitio, blood_type, allergies, medical_conditions, emergency_contact_name, emergency_contact_phone, avatar, created_at FROM users WHERE id = ?', [req.user.id]);
    const user = rows[0];
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json(user);
  } catch (error) {
    console.error('Fetch me error:', error);
    return res.status(500).json({ message: 'Server error while fetching profile' });
  }
});

// Update profile
router.put('/profile', authRequired, async (req, res) => {
  const { full_name, phone, barangay, avatar, purok_sitio, blood_type, allergies, medical_conditions, emergency_contact_name, emergency_contact_phone } = req.body;

  if (!full_name || !phone || !barangay) {
    return res.status(400).json({ message: 'Full name, phone, and barangay are required' });
  }

  try {
    await db.execute(`
      UPDATE users 
      SET full_name = ?, phone = ?, barangay = ?, avatar = ?,
          purok_sitio = ?, blood_type = ?, allergies = ?, medical_conditions = ?,
          emergency_contact_name = ?, emergency_contact_phone = ?
      WHERE id = ?
    `, [
      full_name.trim(),
      phone.trim(),
      barangay.trim(),
      avatar || null,
      purok_sitio || null,
      blood_type || null,
      allergies || null,
      medical_conditions || null,
      emergency_contact_name || null,
      emergency_contact_phone || null,
      req.user.id
    ]);

    await db.logAudit(`Profile details updated`, req.user.username, req.ip);
    return res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({ message: 'Server error while updating profile' });
  }
});

// Change Password
router.put('/change-password', authRequired, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current password and new password are required' });
  }

  try {
    const [rows] = await db.execute('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    const user = rows[0];
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const passwordMatch = bcrypt.compareSync(currentPassword, user.password_hash);
    if (!passwordMatch) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    const salt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync(newPassword, salt);

    await db.execute('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.id]);
    await db.logAudit(`Password changed successfully`, req.user.username, req.ip);
    return res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ message: 'Server error while updating password' });
  }
});

// Update user live location coordinates (responders)
router.put('/location', authRequired, async (req, res) => {
  const { latitude, longitude } = req.body;
  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({ message: 'Latitude and longitude are required' });
  }
  try {
    await db.execute('UPDATE users SET current_lat = ?, current_lng = ? WHERE id = ?', [
      latitude ? parseFloat(latitude) : null,
      longitude ? parseFloat(longitude) : null,
      req.user.id
    ]);
    return res.json({ message: 'Location updated successfully' });
  } catch (error) {
    console.error('Update location error:', error);
    return res.status(500).json({ message: 'Server error while updating location' });
  }
});

// Admin: Get Pending Users
router.get('/pending-users', authRequired, requireRole('Admin'), async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT id, username, full_name, age, phone, barangay, id_type, id_photo_path, selfie_photo_path, created_at 
      FROM users 
      WHERE is_verified = 0 AND role = 'Resident'
      ORDER BY created_at ASC
    `);
    return res.json(rows);
  } catch (error) {
    console.error('Fetch pending users error:', error);
    return res.status(500).json({ message: 'Server error while fetching pending users' });
  }
});

// Admin: Verify User
router.put('/verify-user/:userId', authRequired, requireRole('Admin'), async (req, res) => {
  try {
    const { action } = req.body; // 'approve' or 'reject'
    const userId = req.params.userId;

    // Fetch user details first to get email and name for notification
    const [rows] = await db.execute('SELECT full_name, email FROM users WHERE id = ?', [userId]);
    const targetUser = rows[0];

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (action === 'approve') {
      await db.execute('UPDATE users SET is_verified = 1 WHERE id = ?', [userId]);
      await db.logAudit(`Verified user account ID: ${userId}`, req.user.username, req.ip);

      // Send Approval Email
      if (targetUser.email) {
        try {
          const transporter = await getTransporter();
          const senderEmail = process.env.SMTP_USER || 'no-reply@jamindan.gov.ph';
          await transporter.sendMail({
            from: `"Jamindan Emergency IT" <${senderEmail}>`,
            to: targetUser.email,
            subject: 'Account Approved - Jamindan Emergency Response',
            html: `
              <h3>Welcome to Jamindan Emergency Response!</h3>
              <p>Hello ${targetUser.full_name},</p>
              <p>Great news! Your account registration has been officially verified and approved by our administrators.</p>
              <p>You can now log into the mobile app to access emergency services, view responder locations, and receive community alerts.</p>
              <br>
              <p>Stay safe!</p>
              <p><strong>- Jamindan Emergency IT Team</strong></p>
            `
          });
          console.log(`Approval email sent to ${targetUser.email}`);
        } catch (emailErr) {
          console.error('Failed to send approval email:', emailErr);
        }
      }

      return res.json({ message: 'User approved successfully.' });
    } else if (action === 'reject') {
      await db.execute('DELETE FROM users WHERE id = ?', [userId]);
      await db.logAudit(`Rejected and deleted user account ID: ${userId}`, req.user.username, req.ip);

      // Send Rejection Email
      if (targetUser.email) {
        try {
          const transporter = await getTransporter();
          const senderEmail = process.env.SMTP_USER || 'no-reply@jamindan.gov.ph';
          await transporter.sendMail({
            from: `"Jamindan Emergency IT" <${senderEmail}>`,
            to: targetUser.email,
            subject: 'Registration Update - Jamindan Emergency Response',
            html: `
              <h3>Registration Update</h3>
              <p>Hello ${targetUser.full_name},</p>
              <p>We are writing to inform you that your recent account registration was unable to be verified and has been rejected by our administrators.</p>
              <p>This is usually due to one of the following reasons:</p>
              <ul>
                <li>The ID photo uploaded was blurry or unreadable.</li>
                <li>The Selfie photo did not clearly match the provided ID.</li>
                <li>The personal information provided was incomplete or invalid.</li>
              </ul>
              <p>Please return to the app and submit a new registration with clear, well-lit photos.</p>
              <br>
              <p>Thank you,</p>
              <p><strong>- Jamindan Emergency IT Team</strong></p>
            `
          });
          console.log(`Rejection email sent to ${targetUser.email}`);
        } catch (emailErr) {
          console.error('Failed to send rejection email:', emailErr);
        }
      }

      return res.json({ message: 'User rejected and removed from system.' });
    } else {
      return res.status(400).json({ message: 'Invalid action.' });
    }
  } catch (error) {
    console.error('Verify user error:', error);
    return res.status(500).json({ message: 'Server error while verifying user.' });
  }
});

// ==========================================
// PASSWORD RESET ROUTES
// ==========================================

// Create reusable transporter (Ethereal Email for testing)
async function getTransporter() {
  // Try to use a real SMTP if provided in .env
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_PORT == 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  
  // Fallback to Ethereal Email (fake testing inbox)
  const testAccount = await nodemailer.createTestAccount();
  console.log('Created Ethereal Email test account for testing Password Reset!');
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  });
};

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required.' });

  try {
    const [users] = await db.query('SELECT id, full_name, username, email FROM users WHERE username = ? OR email = ? LIMIT 1', [email, email]);
    const user = users[0];

    if (!user) {
      return res.status(404).json({ message: 'No account found with that username or email.' });
    }

    if (!user.email) {
      return res.status(400).json({ message: 'Your old account does not have an email address attached. Please create a new account.' });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    await db.execute('INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)', [email, token, expiresAt]);

    // Dynamically build the link so it works on mobile via Pinggy/Cloudflare
    const clientUrl = req.headers.origin || process.env.CLIENT_ORIGIN || 'http://localhost:5173';
    const resetLink = `${clientUrl}/reset-password/${token}`;

    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: '"Jamindan Emergency IT" <jamindan.emergency@gmail.com>',
      to: user.email,
      subject: 'Password Reset Request',
      text: `Hello ${user.full_name},\n\nYou requested a password reset. Click the link below to reset it:\n\n${resetLink}\n\nThis link is valid for 1 hour.\n\nIf you did not request this, please ignore this email.`,
      html: `
        <h3>Password Reset</h3>
        <p>Hello ${user.full_name},</p>
        <p>You requested a password reset. Click the button below to reset it:</p>
        <a href="${resetLink}" style="display:inline-block;padding:10px 20px;background:#c0392b;color:#fff;text-decoration:none;border-radius:5px;">Reset Password</a>
        <p><br>If the button doesn't work (or if this email is in your Spam folder), copy and paste the following link into your browser:</p>
        <p style="word-break: break-all; color: #3498db;">${resetLink}</p>
        <p><br>This link is valid for 1 hour.</p>
        <p>If you did not request this, please ignore this email.</p>
      `
    });

    console.log('Password Reset Email sent: %s', info.messageId);
    
    // IMPORTANT: If using Ethereal, print the link so the dev can click and view the fake email
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('-------------------------------------------');
      console.log('PREVIEW FAKE EMAIL HERE: %s', previewUrl);
      console.log('-------------------------------------------');
    }

    res.json({ message: 'If that email exists in our system, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Failed to process request.' });
  }
});

router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  
  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Token and new password are required.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  }

  try {
    // 1. Verify token exists and is not expired
    const [rows] = await db.query('SELECT email FROM password_resets WHERE token = ? AND expires_at > NOW() ORDER BY id DESC LIMIT 1', [token]);
    
    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired reset token. Please request a new one.' });
    }

    const email = rows[0].email;

    // 2. Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 3. Update User
    // (The email passed in was actually the username they used to register)
    const [updateResult] = await db.execute('UPDATE users SET password_hash = ? WHERE username = ?', [hashedPassword, email]);

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found to update.' });
    }

    // 4. Delete the used token
    await db.execute('DELETE FROM password_resets WHERE email = ?', [email]);

    await db.logAudit(`Password reset via email for: ${email}`, 'System', req.ip);

    res.json({ message: 'Password successfully reset. You can now log in.' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error while resetting password.' });
  }
});

module.exports = router;
