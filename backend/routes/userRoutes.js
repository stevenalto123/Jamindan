const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authRequired, requireRole } = require('../middleware/auth');
const multer = require('multer');
const { storage } = require('../config/cloudinary');

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Apply auth to all routes in this file
router.use(authRequired);

// Create new user (Admin only)
router.post('/', requireRole(['Admin']), upload.fields([
  { name: 'id_photo', maxCount: 1 },
  { name: 'selfie_photo', maxCount: 1 }
]), async (req, res) => {
  const { username, password, full_name, phone, barangay, role, agency_type } = req.body;

  if (!username || !password || !full_name || !phone || !barangay || !role) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const validRoles = ['Admin', 'Responder', 'Resident'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: 'Invalid role selection' });
  }

  // Input Validation
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  if (!usernameRegex.test(username.trim())) {
    return res.status(400).json({ message: 'Username must be 3-20 characters long and contain only letters, numbers, or underscores' });
  }

  if (!/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long and contain at least one uppercase letter and one number.' });
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

    const bcrypt = require('bcryptjs');
    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);

    const finalAgency = role === 'Responder' ? (agency_type || null) : null;
    
    const id_photo_path = req.files && req.files['id_photo'] ? req.files['id_photo'][0].path : null;
    const selfie_photo_path = req.files && req.files['selfie_photo'] ? req.files['selfie_photo'][0].path : null;
    // Note: Admin-created users are auto-verified
    const is_verified = 1;

    await db.execute(`
      INSERT INTO users (username, password_hash, role, agency_type, full_name, phone, barangay, id_photo_path, selfie_photo_path, is_verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [username.trim().toLowerCase(), password_hash, role, finalAgency, full_name.trim(), phone.trim(), barangay.trim(), id_photo_path, selfie_photo_path, is_verified]);

    await db.logAudit(`User account created by admin: @${username.trim().toLowerCase()} (Role: ${role}, Agency: ${finalAgency || 'N/A'})`, req.user.username, req.ip);
    return res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({ message: 'Server error while creating user' });
  }
});

// Get all users (with search, role filter, and pagination)
router.get('/', requireRole(['Admin', 'Responder']), async (req, res) => {
  const { search, role, is_on_duty, page = 1, limit = 10 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    let baseQuery = 'FROM users';
    const params = [];
    const conditions = [];

    // Search query
    if (search) {
      conditions.push('(username LIKE ? OR full_name LIKE ? OR phone LIKE ? OR barangay LIKE ?)');
      const wildCard = `%${search}%`;
      params.push(wildCard, wildCard, wildCard, wildCard);
    }

    // Role filter
    if (role) {
      conditions.push('role = ?');
      params.push(role);
    }

    // Duty filter
    if (is_on_duty !== undefined) {
      conditions.push('is_on_duty = ?');
      params.push(is_on_duty);
    }

    if (conditions.length > 0) {
      baseQuery += ' WHERE ' + conditions.join(' AND ');
    }

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) as count ${baseQuery}`;
    const [countResult] = await db.query(countQuery, params);
    const totalCount = countResult[0].count;

    // Get paginated users
    const dataQuery = `
      SELECT id, username, role, agency_type, full_name, age, date_of_birth, phone, barangay, avatar, is_active, is_on_duty, current_lat, current_lng, created_at, id_photo_path, selfie_photo_path, id_type
      ${baseQuery}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    const dataParams = [...params, parseInt(limit), offset];
    const [users] = await db.query(dataQuery, dataParams);

    return res.json({
      users,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Fetch users list error:', error);
    return res.status(500).json({ message: 'Server error while fetching users list' });
  }
});

// Get single user details
router.get('/:id/profile', requireRole(['Admin']), async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Fetch user basic details
    const [userRows] = await db.execute(`
      SELECT id, username, email, role, agency_type, full_name, age, date_of_birth, phone, barangay, purok_sitio, 
             blood_type, allergies, medical_conditions, emergency_contact_name, emergency_contact_phone, 
             avatar, is_active, is_on_duty, created_at, id_photo_path, selfie_photo_path, id_type
      FROM users 
      WHERE id = ?
    `, [id]);
    
    if (userRows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const user = userRows[0];

    // 2. Fetch incident history depending on role
    let incidents = [];
    if (user.role === 'Resident') {
      const [incidentRows] = await db.execute(`
        SELECT id, type, status, location_address, created_at
        FROM incidents
        WHERE reporter_id = ?
        ORDER BY created_at DESC
      `, [id]);
      incidents = incidentRows;
    } else if (user.role === 'Responder' || user.role === 'Admin') {
      const [incidentRows] = await db.execute(`
        SELECT id, type, status, location_address, created_at
        FROM incidents
        WHERE responder_id = ?
        ORDER BY created_at DESC
      `, [id]);
      incidents = incidentRows;
    }

    return res.json({
      user,
      incidents,
      stats: {
        totalIncidents: incidents.length,
        resolvedIncidents: incidents.filter(i => i.status === 'Resolved').length
      }
    });

  } catch (error) {
    console.error('Fetch user profile error:', error);
    return res.status(500).json({ message: 'Server error while fetching user profile' });
  }
});

// Update user details & role
router.put('/:id', requireRole(['Admin']), async (req, res) => {
  const { id } = req.params;
  const { full_name, phone, barangay, role, agency_type, date_of_birth, age } = req.body;

  if (!full_name || !phone || !barangay || !role) {
    return res.status(400).json({ message: 'Full name, phone, barangay, and role are required' });
  }

  if (age !== null && age !== undefined && age !== '' && Number(age) < 18) {
    return res.status(400).json({ message: 'User must be at least 18 years old.' });
  }

  const validRoles = ['Admin', 'Responder', 'Resident'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: 'Invalid role selection' });
  }

  try {
    // If updating current admin's role, verify not losing admin rights
    if (parseInt(id) === req.user.id && role !== 'Admin') {
      return res.status(400).json({ message: 'You cannot demote your own account role.' });
    }

    const [rows] = await db.execute('SELECT username FROM users WHERE id = ?', [id]);
    const targetUser = rows[0];

    const finalAgency = role === 'Responder' ? (agency_type || null) : null;

    let query = `UPDATE users SET full_name = ?, phone = ?, barangay = ?, role = ?, agency_type = ?`;
    let params = [full_name.trim(), phone.trim(), barangay.trim(), role, finalAgency];

    if (date_of_birth !== undefined) {
      query += `, date_of_birth = ?, age = ?`;
      let finalAge = 18;
      if (age !== null && age !== undefined && age !== '') {
        finalAge = Number(age);
      }
      params.push(date_of_birth || null, finalAge);
    }

    query += ` WHERE id = ?`;
    params.push(id);

    await db.execute(query, params);

    await db.logAudit(`User details/role updated for @${targetUser ? targetUser.username : id} (Role: ${role}, Agency: ${finalAgency || 'N/A'})`, req.user.username, req.ip);
    return res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('User update error:', error);
    return res.status(500).json({ message: 'Server error while updating user: ' + error.message });
  }
});

// Toggle user activation status (Deactivate / Activate)
router.put('/:id/status', requireRole(['Admin']), async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body; // Expecting 1 (active) or 0 (deactive)

  if (is_active !== 0 && is_active !== 1) {
    return res.status(400).json({ message: 'Invalid status selection' });
  }

  try {
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: 'You cannot deactivate your own account.' });
    }

    const [rows] = await db.execute('SELECT username FROM users WHERE id = ?', [id]);
    const targetUser = rows[0];

    await db.execute('UPDATE users SET is_active = ? WHERE id = ?', [is_active, id]);
    const action = is_active === 1 ? 'activated' : 'deactivated';
    
    await db.logAudit(`User account ${action} for @${targetUser ? targetUser.username : id}`, req.user.username, req.ip);
    return res.json({ message: `User account has been ${action}.` });
  } catch (error) {
    console.error('Toggle status error:', error);
    return res.status(500).json({ message: 'Server error while modifying user activation' });
  }
});

// Delete user (Admin only)
router.delete('/:id', requireRole(['Admin']), async (req, res) => {
  const { id } = req.params;

  try {
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own account.' });
    }

    // Check if user exists
    const [rows] = await db.execute('SELECT username, role FROM users WHERE id = ?', [id]);
    const user = rows[0];
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If deleting an admin, ensure they are not the last admin
    if (user.role === 'Admin') {
      const [adminRows] = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'Admin' AND is_active = 1");
      const adminCount = adminRows[0].count;
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot delete the only remaining active Administrator.' });
      }
    }

    await db.execute('DELETE FROM users WHERE id = ?', [id]);
    await db.logAudit(`User account deleted permanently for @${user.username || id}`, req.user.username, req.ip);
    return res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ message: 'Server error while deleting user' });
  }
});

module.exports = router;
