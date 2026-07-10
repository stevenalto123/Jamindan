const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authRequired, requireRole } = require('../middleware/auth');

router.use(authRequired);

// Get Admin/Responder Dashboard Stats
router.get('/stats', requireRole(['Admin', 'Responder']), async (req, res) => {
  try {
    const [totalUsersRows] = await db.query('SELECT COUNT(*) as count FROM users');
    const totalUsers = totalUsersRows[0].count;

    const [totalReportsRows] = await db.query('SELECT COUNT(*) as count FROM incidents');
    const totalReports = totalReportsRows[0].count;

    const [activeIncidentsRows] = await db.query("SELECT COUNT(*) as count FROM incidents WHERE status != 'Resolved'");
    const activeIncidents = activeIncidentsRows[0].count;

    const [respondersOnDutyRows] = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'Responder' AND is_active = 1");
    const respondersOnDuty = respondersOnDutyRows[0].count;

    const [pendingReportsRows] = await db.query("SELECT COUNT(*) as count FROM incidents WHERE status = 'Pending'");
    const pendingReports = pendingReportsRows[0].count;

    const [resolvedReportsRows] = await db.query("SELECT COUNT(*) as count FROM incidents WHERE status = 'Resolved'");
    const resolvedReports = resolvedReportsRows[0].count;

    // Weekly incident trend chart data (last 7 days)
    const weeklyTrends = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const [rows] = await db.query("SELECT COUNT(*) as count FROM incidents WHERE DATE(created_at) = ?", [dateStr]);
      weeklyTrends.push({
        date: dateStr,
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        count: rows[0] ? rows[0].count : 0
      });
    }

    // Recent incident reports (limit 5)
    const [recentIncidents] = await db.query(`
      SELECT i.*, u.full_name as reporter_name, u.barangay as reporter_barangay
      FROM incidents i
      JOIN users u ON i.reporter_id = u.id
      ORDER BY i.created_at DESC
      LIMIT 5
    `);

    return res.json({
      metrics: {
        totalUsers,
        totalReports,
        activeIncidents,
        respondersOnDuty,
        pendingReports,
        resolvedReports
      },
      weeklyTrends,
      recentIncidents
    });

  } catch (error) {
    console.error('Fetch dashboard stats error:', error);
    return res.status(500).json({ message: 'Server error while fetching dashboard stats' });
  }
});

// Get Resident Dashboard Stats
router.get('/resident', requireRole(['Resident']), async (req, res) => {
  try {
    const reporterId = req.user.id;

    const [totalRows] = await db.query('SELECT COUNT(*) as count FROM incidents WHERE reporter_id = ?', [reporterId]);
    const totalReported = totalRows[0].count;

    const [activeRows] = await db.query("SELECT COUNT(*) as count FROM incidents WHERE reporter_id = ? AND status != 'Resolved'", [reporterId]);
    const activeReported = activeRows[0].count;

    const [resolvedRows] = await db.query("SELECT COUNT(*) as count FROM incidents WHERE reporter_id = ? AND status = 'Resolved'", [reporterId]);
    const resolvedReported = resolvedRows[0].count;

    // Recent reports submitted by this resident (limit 5)
    const [recentReports] = await db.query(`
      SELECT * FROM incidents
      WHERE reporter_id = ?
      ORDER BY created_at DESC
      LIMIT 5
    `, [reporterId]);

    // Latest advisories (limit 3)
    const [latestAdvisories] = await db.query(`
      SELECT n.*, u.full_name as author_name
      FROM news n
      JOIN users u ON n.author_id = u.id
      WHERE n.category = 'Advisories'
      ORDER BY n.created_at DESC
      LIMIT 3
    `);

    return res.json({
      metrics: {
        totalReported,
        activeReported,
        resolvedReported
      },
      recentReports,
      latestAdvisories
    });

  } catch (error) {
    console.error('Fetch resident dashboard stats error:', error);
    return res.status(500).json({ message: 'Server error while fetching resident stats' });
  }
});

// Get System Audit Logs (Admin / Responder only)
router.get('/logs', requireRole(['Admin', 'Responder']), async (req, res) => {
  try {
    const [logs] = await db.query(`
      SELECT id, action, username, ip, created_at FROM audit_logs
      ORDER BY created_at DESC
      LIMIT 100
    `);
    return res.json(logs);
  } catch (error) {
    console.error('Fetch audit logs error:', error);
    return res.status(500).json({ message: 'Server error while fetching audit logs' });
  }
});

module.exports = router;
