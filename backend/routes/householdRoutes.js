const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authRequired } = require('../middleware/auth');

router.use(authRequired);

// Get all household members for current logged-in user
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM household_members WHERE user_id = ? ORDER BY id ASC', [req.user.id]);
    return res.json(rows);
  } catch (error) {
    console.error('Fetch household error:', error);
    return res.status(500).json({ message: 'Server error while fetching household members' });
  }
});

// Add household member
router.post('/', async (req, res) => {
  const { full_name, age, gender, medical_notes } = req.body;
  if (!full_name || !age || !gender) {
    return res.status(400).json({ message: 'Full name, age, and gender are required' });
  }
  try {
    await db.execute(
      'INSERT INTO household_members (user_id, full_name, age, gender, medical_notes) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, full_name, parseInt(age), gender, medical_notes || null]
    );
    return res.status(201).json({ message: 'Household member added successfully' });
  } catch (error) {
    console.error('Add household member error:', error);
    return res.status(500).json({ message: 'Server error while adding household member' });
  }
});

// Delete household member
router.delete('/:id', async (req, res) => {
  try {
    // Verify ownership
    const [check] = await db.execute('SELECT id FROM household_members WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (check.length === 0) {
      return res.status(404).json({ message: 'Member not found or unauthorized' });
    }
    await db.execute('DELETE FROM household_members WHERE id = ?', [req.params.id]);
    return res.json({ message: 'Household member removed successfully' });
  } catch (error) {
    console.error('Delete household member error:', error);
    return res.status(500).json({ message: 'Server error while removing household member' });
  }
});

module.exports = router;
