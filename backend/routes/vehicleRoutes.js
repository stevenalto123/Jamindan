const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authRequired, requireRole } = require('../middleware/authMiddleware');

// Get all vehicles
router.get('/', authRequired, requireRole(['Admin', 'Responder']), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM vehicles ORDER BY created_at DESC');
    return res.json({ vehicles: rows });
  } catch (error) {
    console.error('Fetch vehicles error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Add a new vehicle (Admin only)
router.post('/', authRequired, requireRole('Admin'), async (req, res) => {
  const { name, type, agency } = req.body;
  if (!name || !type || !agency) {
    return res.status(400).json({ message: 'Name, type, and agency are required.' });
  }
  
  try {
    await db.query(
      'INSERT INTO vehicles (name, type, agency) VALUES (?, ?, ?)',
      [name, type, agency]
    );
    await db.logAudit(`Added new vehicle: ${name} (${type}) for ${agency}`, req.user.username, req.ip);
    return res.status(201).json({ message: 'Vehicle added successfully' });
  } catch (error) {
    console.error('Add vehicle error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Update vehicle status (Admin only)
router.put('/:id/status', authRequired, requireRole('Admin'), async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  
  if (!['Available', 'Dispatched', 'Maintenance'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status.' });
  }

  try {
    const [result] = await db.query('UPDATE vehicles SET status = ? WHERE id = ?', [status, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    await db.logAudit(`Updated vehicle ID ${id} status to ${status}`, req.user.username, req.ip);
    return res.json({ message: 'Status updated successfully' });
  } catch (error) {
    console.error('Update vehicle status error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Delete a vehicle (Admin only)
router.delete('/:id', authRequired, requireRole('Admin'), async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM vehicles WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    await db.logAudit(`Deleted vehicle ID ${id}`, req.user.username, req.ip);
    return res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Delete vehicle error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
