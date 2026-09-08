const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authRequired, requireRole } = require('../middleware/auth');

// Dashboard requires Admin role
router.use(authRequired, requireRole('Admin'));

// GET Summary KPIs
router.get('/summary', async (req, res) => {
  try {
    const [totalRows] = await db.query('SELECT COUNT(*) as count FROM incidents');
    const [resolvedRows] = await db.query("SELECT COUNT(*) as count FROM incidents WHERE status = 'Resolved'");
    const [activeRows] = await db.query("SELECT COUNT(*) as count FROM incidents WHERE status != 'Resolved'");
    
    // Average response time: difference between created_at and first 'En Route' status
    const [responseRows] = await db.query(`
      SELECT AVG(TIMESTAMPDIFF(MINUTE, i.created_at, h.created_at)) as avg_mins
      FROM incidents i
      JOIN incident_status_history h ON i.id = h.incident_id
      WHERE h.status = 'En Route'
      AND h.id = (
        SELECT MIN(id) FROM incident_status_history WHERE incident_id = i.id AND status = 'En Route'
      )
    `);

    return res.json({
      total: totalRows[0].count,
      resolved: resolvedRows[0].count,
      active: activeRows[0].count,
      avgResponseMinutes: responseRows[0].avg_mins ? Math.round(responseRows[0].avg_mins) : 0
    });
  } catch (error) {
    console.error('Analytics summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET Incidents by Type (for Bar Chart)
router.get('/by-type', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT type as name, COUNT(*) as value 
      FROM incidents 
      GROUP BY type 
      ORDER BY value DESC
    `);
    return res.json(rows);
  } catch (error) {
    console.error('Analytics by-type error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET Incident Heatmap Data
router.get('/heatmap', async (req, res) => {
  try {
    // Return an array of [lat, lng, intensity]
    // Intensity can be 1 for now
    const [rows] = await db.query(`
      SELECT location_lat, location_lng
      FROM incidents
      WHERE location_lat IS NOT NULL AND location_lng IS NOT NULL
    `);
    
    const heatData = rows.map(r => [r.location_lat, r.location_lng, 1]);
    return res.json(heatData);
  } catch (error) {
    console.error('Analytics heatmap error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
