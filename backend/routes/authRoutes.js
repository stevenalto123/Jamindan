const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { authRequired } = require('../middleware/auth');

// Register Resident
router.post('/register', async (req, res) => {
  const { username, password, full_name, phone, barangay } = req.body;

  if (!username || !password || !full_name || !phone || !barangay) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // Input Validation
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  if (!usernameRegex.test(username.trim())) {
    return res.status(400).json({ message: 'Username must be 3-20 characters long and contain only letters, numbers, or underscores' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  const phoneRegex = /^09\d{9}$/;
  if (!phoneRegex.test(phone.trim())) {
    return res.status(400).json({ message: 'Phone number must be a valid 11-digit Philippine mobile number starting with 09' });
  }

  try {
    // Check if username exists
    const [existing] = await db.execute('SELECT id FROM users WHERE username = ?', [username.trim().toLowerCase()]);
    const existingUser = existing[0];
    if (existingUser) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);

    await db.execute(`
      INSERT INTO users (username, password_hash, role, full_name, phone, barangay)
      VALUES (?, ?, 'Resident', ?, ?, ?)
    `, [username.trim().toLowerCase(), password_hash, full_name.trim(), phone.trim(), barangay.trim()]);

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
    const [rows] = await db.execute('SELECT id, username, role, full_name, phone, barangay, avatar, created_at FROM users WHERE id = ?', [req.user.id]);
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
  const { full_name, phone, barangay, avatar } = req.body;

  if (!full_name || !phone || !barangay) {
    return res.status(400).json({ message: 'Full name, phone, and barangay are required' });
  }

  try {
    await db.execute(`
      UPDATE users 
      SET full_name = ?, phone = ?, barangay = ?, avatar = ?
      WHERE id = ?
    `, [full_name.trim(), phone.trim(), barangay.trim(), avatar || null, req.user.id]);

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

module.exports = router;
