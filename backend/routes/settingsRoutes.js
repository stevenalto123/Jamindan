const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authRequired, requireRole } = require('../middleware/auth');

// Get all system settings
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT setting_key, setting_value FROM system_settings');
    const settings = {};
    rows.forEach(row => {
      settings[row.setting_key] = row.setting_value === 'true' ? true : (row.setting_value === 'false' ? false : row.setting_value);
    });
    res.json(settings);
  } catch (error) {
    console.error('Settings fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch settings' });
  }
});

// Update a system setting
router.post('/', authRequired, requireRole(['Admin']), async (req, res) => {
  const { setting_key, setting_value } = req.body;
  
  if (!setting_key || setting_value === undefined) {
    return res.status(400).json({ message: 'setting_key and setting_value are required' });
  }

  try {
    const stringValue = typeof setting_value === 'boolean' ? (setting_value ? 'true' : 'false') : String(setting_value);
    
    // Update or Insert
    await db.query(`
      INSERT INTO system_settings (setting_key, setting_value)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
    `, [setting_key, stringValue]);

    await db.logAudit(`Changed setting ${setting_key} to ${stringValue}`, req.user.username, req.ip);
    
    res.json({ message: 'Setting updated successfully' });
  } catch (error) {
    console.error('Settings update error:', error);
    res.status(500).json({ message: 'Failed to update setting' });
  }
});

module.exports = router;
