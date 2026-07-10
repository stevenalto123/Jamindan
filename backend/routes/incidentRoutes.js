const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const { authRequired, requireRole } = require('../middleware/auth');

// Make sure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only JPEG, JPG, and PNG images up to 5MB are allowed!'));
  }
});

// Helper: Generate Unique Incident Code
const generateIncidentCode = async () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
  // Count reports for current month in MySQL
  const [rows] = await db.query(
    "SELECT COUNT(*) as count FROM incidents WHERE DATE_FORMAT(created_at, '%Y-%m') = ?",
    [`${year}-${month}`]
  );
  const count = rows[0] ? rows[0].count : 0;
  const nextNum = String(count + 1).padStart(4, '0');
  return `#${year}-${month}-${nextNum}`;
};

// Create Incident Report (Residents only)
router.post('/', authRequired, requireRole(['Resident']), upload.single('photo'), async (req, res) => {
  const { type, description, location_lat, location_lng } = req.body;

  if (!type || !description) {
    return res.status(400).json({ message: 'Type and description are required' });
  }

  try {
    const code = await generateIncidentCode();
    const photo_path = req.file ? `/uploads/${req.file.filename}` : null;
    const lat = location_lat ? parseFloat(location_lat) : null;
    const lng = location_lng ? parseFloat(location_lng) : null;

    const incidentId = await db.transaction(async (conn) => {
      // 1. Create Incident
      const [incidentResult] = await conn.execute(`
        INSERT INTO incidents (code, reporter_id, type, description, photo_path, location_lat, location_lng, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')
      `, [code, req.user.id, type, description, photo_path, lat, lng]);

      const insId = incidentResult.insertId;

      // 2. Insert Status History Log
      await conn.execute(`
        INSERT INTO incident_status_history (incident_id, status, comment, updated_by)
        VALUES (?, 'Pending', 'Incident report submitted.', ?)
      `, [insId, req.user.id]);

      // 3. Notify Admins
      const [admins] = await conn.query("SELECT id FROM users WHERE role = 'Admin' AND is_active = 1");
      const [residentRows] = await conn.query("SELECT full_name FROM users WHERE id = ?", [req.user.id]);
      const resident = residentRows[0];

      for (const admin of admins) {
        await conn.execute(`
          INSERT INTO notifications (user_id, title, message, reference_type, reference_id)
          VALUES (?, 'New Emergency Report', ?, 'incident', ?)
        `, [
          admin.id,
          `A new ${type} report (${code}) has been reported by ${resident ? resident.full_name : 'a Resident'}.`,
          insId
        ]);
      }

      return insId;
    });

    await db.logAudit(`Incident reported: ${code} (${type})`, req.user.username, req.ip);
    return res.status(201).json({
      message: 'Report submitted successfully!',
      code,
      incidentId
    });

  } catch (error) {
    console.error('Incident creation error:', error);
    return res.status(500).json({ message: 'Server error while submitting report' });
  }
});

// List Incidents
router.get('/', authRequired, async (req, res) => {
  const { status, type, search } = req.query;

  try {
    let query = `
      SELECT i.*, u.full_name as reporter_name, u.phone as reporter_phone, u.barangay as reporter_barangay
      FROM incidents i
      JOIN users u ON i.reporter_id = u.id
    `;
    const params = [];
    const conditions = [];

    // Filter by ownership
    if (req.user.role === 'Resident') {
      conditions.push('i.reporter_id = ?');
      params.push(req.user.id);
    }

    // Filter by status
    if (status) {
      conditions.push('i.status = ?');
      params.push(status);
    }

    // Filter by type
    if (type) {
      conditions.push('i.type = ?');
      params.push(type);
    }

    // Search query (for admin/responder)
    if (search && req.user.role !== 'Resident') {
      conditions.push('(u.full_name LIKE ? OR i.code LIKE ? OR u.barangay LIKE ? OR i.description LIKE ?)');
      const wildCard = `%${search}%`;
      params.push(wildCard, wildCard, wildCard, wildCard);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY i.created_at DESC';

    const [incidents] = await db.query(query, params);
    return res.json(incidents);

  } catch (error) {
    console.error('List incidents error:', error);
    return res.status(500).json({ message: 'Server error while fetching incidents' });
  }
});

// Get Incident Detail (with status history timeline)
router.get('/:id', authRequired, async (req, res) => {
  const { id } = req.params;

  try {
    const [incidentRows] = await db.query(`
      SELECT i.*, u.full_name as reporter_name, u.phone as reporter_phone, u.barangay as reporter_barangay
      FROM incidents i
      JOIN users u ON i.reporter_id = u.id
      WHERE i.id = ?
    `, [id]);

    const incident = incidentRows[0];

    if (!incident) {
      return res.status(404).json({ message: 'Incident report not found' });
    }

    // Security check: Residents can only view their own
    if (req.user.role === 'Resident' && incident.reporter_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const [history] = await db.query(`
      SELECT h.*, u.full_name as updated_by_name, u.role as updated_by_role
      FROM incident_status_history h
      JOIN users u ON h.updated_by = u.id
      WHERE h.incident_id = ?
      ORDER BY h.created_at ASC
    `, [id]);

    return res.json({ incident, history });

  } catch (error) {
    console.error('Fetch incident detail error:', error);
    return res.status(500).json({ message: 'Server error while fetching incident detail' });
  }
});

// Update Incident Status (Admin / Responder only)
router.put('/:id/status', authRequired, requireRole(['Admin', 'Responder']), async (req, res) => {
  const { id } = req.params;
  const { status, comment } = req.body;

  const validStatuses = ['Pending', 'Under Review', 'In Progress', 'Resolved'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  try {
    const [incidentRows] = await db.query('SELECT code, reporter_id, status FROM incidents WHERE id = ?', [id]);
    const incident = incidentRows[0];
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    if (incident.status === status) {
      return res.status(400).json({ message: `Incident is already marked as ${status}` });
    }

    await db.transaction(async (conn) => {
      // 1. Update status
      await conn.execute('UPDATE incidents SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);

      // 2. Insert into history
      await conn.execute(`
        INSERT INTO incident_status_history (incident_id, status, comment, updated_by)
        VALUES (?, ?, ?, ?)
      `, [id, status, comment || `Status updated to ${status}.`, req.user.id]);

      // 3. Notify resident
      await conn.execute(`
        INSERT INTO notifications (user_id, title, message, reference_type, reference_id)
        VALUES (?, ?, ?, 'incident', ?)
      `, [
        incident.reporter_id,
        'Report Status Update',
        `Your incident report ${incident.code} has been updated to "${status}".`,
        id
      ]);
    });

    await db.logAudit(`Incident status updated to [${status}] for ${incident.code}`, req.user.username, req.ip);
    return res.json({ message: `Incident status updated to ${status} successfully.` });

  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({ message: 'Server error while updating status' });
  }
});

// Delete Incident Report (Admin only)
router.delete('/:id', authRequired, requireRole(['Admin']), async (req, res) => {
  const { id } = req.params;

  try {
    const [incidentRows] = await db.query('SELECT code FROM incidents WHERE id = ?', [id]);
    const incident = incidentRows[0];
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    await db.execute("DELETE FROM notifications WHERE reference_type = 'incident' AND reference_id = ?", [id]);
    await db.execute('DELETE FROM incident_status_history WHERE incident_id = ?', [id]);
    await db.execute('DELETE FROM incidents WHERE id = ?', [id]);

    await db.logAudit(`Incident report deleted permanently: ${incident.code}`, req.user.username, req.ip);
    return res.json({ message: 'Incident report deleted successfully.' });
  } catch (error) {
    console.error('Delete incident error:', error);
    return res.status(500).json({ message: 'Server error while deleting incident' });
  }
});

module.exports = router;
