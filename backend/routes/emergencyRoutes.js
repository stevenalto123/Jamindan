const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authRequired, requireRole } = require('../middleware/auth');

router.use(authRequired);

// GET all evacuation centers
router.get('/evacuation-centers', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM evacuation_centers ORDER BY status DESC, name ASC');
    return res.json(rows);
  } catch (error) {
    console.error('Fetch evacuation centers error:', error);
    return res.status(500).json({ message: 'Server error while fetching evacuation centers' });
  }
});

// GET all hotlines
router.get('/hotlines', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM hotlines ORDER BY barangay ASC, agency_name ASC');
    return res.json(rows);
  } catch (error) {
    console.error('Fetch hotlines error:', error);
    return res.status(500).json({ message: 'Server error while fetching hotlines' });
  }
});

// LOG a hotline call intent (Accessible by Residents and Responders)
router.post('/hotlines/log', async (req, res) => {
  const { hotline_name, hotline_number } = req.body;
  if (!hotline_name || !hotline_number) {
    return res.status(400).json({ message: 'Missing hotline information' });
  }
  try {
    await db.execute(
      'INSERT INTO call_logs (caller_id, hotline_name, hotline_number) VALUES (?, ?, ?)',
      [req.user.id, hotline_name, hotline_number]
    );
    return res.status(201).json({ message: 'Call intent logged' });
  } catch (error) {
    console.error('Log hotline call error:', error);
    return res.status(500).json({ message: 'Server error while logging call' });
  }
});

// ADMIN ONLY - GET all call logs
router.get('/hotlines/logs', requireRole(['Admin']), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.*, u.full_name as caller_name 
      FROM call_logs c
      JOIN users u ON c.caller_id = u.id
      ORDER BY c.called_at DESC
      LIMIT 100
    `);
    return res.json(rows);
  } catch (error) {
    console.error('Fetch call logs error:', error);
    return res.status(500).json({ message: 'Server error while fetching call logs' });
  }
});

const VALID_EVAC_STATUSES = ['Open', 'Full', 'Closed', 'Standby'];

// ADMIN ONLY - Add evacuation center
router.post('/evacuation-centers', requireRole(['Admin']), async (req, res) => {
  const { name, location, capacity, status, latitude, longitude } = req.body;
  if (!name || !String(name).trim() || !location || !String(location).trim() || capacity === undefined || capacity === '') {
    return res.status(400).json({ message: 'Name, location, and capacity are required' });
  }
  const parsedCapacity = parseInt(capacity, 10);
  if (!Number.isInteger(parsedCapacity) || parsedCapacity < 1) {
    return res.status(400).json({ message: 'Capacity must be a positive whole number.' });
  }
  const nextStatus = status || 'Closed';
  if (!VALID_EVAC_STATUSES.includes(nextStatus)) {
    return res.status(400).json({ message: 'Invalid evacuation center status.' });
  }
  try {
    await db.execute(
      'INSERT INTO evacuation_centers (name, location, capacity, status, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?)',
      [name.trim(), location.trim(), parsedCapacity, nextStatus, latitude || null, longitude || null]
    );
    return res.status(201).json({ message: 'Evacuation center added successfully' });
  } catch (error) {
    console.error('Add evacuation center error:', error);
    return res.status(500).json({ message: 'Server error while adding evacuation center' });
  }
});

// ADMIN ONLY - Update evacuation center
router.put('/evacuation-centers/:id', requireRole(['Admin']), async (req, res) => {
  const { name, location, capacity, current_headcount, status, latitude, longitude } = req.body;
  if (!name || !String(name).trim() || !location || !String(location).trim() || capacity === undefined || capacity === '') {
    return res.status(400).json({ message: 'Name, location, and capacity are required' });
  }
  const parsedCapacity = parseInt(capacity, 10);
  const parsedHeadcount = current_headcount !== undefined && current_headcount !== '' ? parseInt(current_headcount, 10) : 0;
  if (!Number.isInteger(parsedCapacity) || parsedCapacity < 1) {
    return res.status(400).json({ message: 'Capacity must be a positive whole number.' });
  }
  if (!Number.isInteger(parsedHeadcount) || parsedHeadcount < 0) {
    return res.status(400).json({ message: 'Headcount must be a non-negative whole number.' });
  }
  if (status && !VALID_EVAC_STATUSES.includes(status)) {
    return res.status(400).json({ message: 'Invalid evacuation center status.' });
  }
  try {
    const [result] = await db.execute(
      'UPDATE evacuation_centers SET name = ?, location = ?, capacity = ?, current_headcount = ?, status = ?, latitude = ?, longitude = ? WHERE id = ?',
      [name.trim(), location.trim(), parsedCapacity, parsedHeadcount, status || 'Closed', latitude || null, longitude || null, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Evacuation center not found' });
    }
    return res.json({ message: 'Evacuation center updated successfully' });
  } catch (error) {
    console.error('Update evacuation center error:', error);
    return res.status(500).json({ message: 'Server error while updating evacuation center' });
  }
});

// ADMIN ONLY - Delete evacuation center
router.delete('/evacuation-centers/:id', requireRole(['Admin']), async (req, res) => {
  try {
    const [result] = await db.execute('DELETE FROM evacuation_centers WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Evacuation center not found' });
    }
    return res.json({ message: 'Evacuation center deleted successfully' });
  } catch (error) {
    console.error('Delete evacuation center error:', error);
    return res.status(500).json({ message: 'Server error while deleting evacuation center' });
  }
});

// ADMIN ONLY - Add hotline
router.post('/hotlines', requireRole(['Admin']), async (req, res) => {
  const { agency_name, contact_number, barangay } = req.body;
  if (!agency_name || !contact_number) {
    return res.status(400).json({ message: 'Agency name and contact number are required' });
  }
  try {
    await db.execute(
      'INSERT INTO hotlines (agency_name, contact_number, barangay) VALUES (?, ?, ?)',
      [agency_name, contact_number, barangay || null]
    );
    return res.status(201).json({ message: 'Hotline added successfully' });
  } catch (error) {
    console.error('Add hotline error:', error);
    return res.status(500).json({ message: 'Server error while adding hotline' });
  }
});

// ADMIN ONLY - Update hotline
router.put('/hotlines/:id', requireRole(['Admin']), async (req, res) => {
  const { agency_name, contact_number, barangay } = req.body;
  if (!agency_name || !contact_number) {
    return res.status(400).json({ message: 'Agency name and contact number are required' });
  }
  try {
    await db.execute(
      'UPDATE hotlines SET agency_name = ?, contact_number = ?, barangay = ? WHERE id = ?',
      [agency_name, contact_number, barangay || null, req.params.id]
    );
    return res.json({ message: 'Hotline updated successfully' });
  } catch (error) {
    console.error('Update hotline error:', error);
    return res.status(500).json({ message: 'Server error while updating hotline' });
  }
});

// ADMIN ONLY - Delete hotline
router.delete('/hotlines/:id', requireRole(['Admin']), async (req, res) => {
  try {
    await db.execute('DELETE FROM hotlines WHERE id = ?', [req.params.id]);
    return res.json({ message: 'Hotline deleted successfully' });
  } catch (error) {
    console.error('Delete hotline error:', error);
    return res.status(500).json({ message: 'Server error while deleting hotline' });
  }
});

module.exports = router;
