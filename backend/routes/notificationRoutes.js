const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authRequired, requireRole } = require('../middleware/auth');
const webpush = require('web-push');

try {
  const pubKey = process.env.VAPID_PUBLIC_KEY || 'BJd5fK6r2z9Z39nPfgkV3kKcE9K3K7nvIAC7GFQdgZodVaVz-DRXaCVUoeb3VSjQxQCgJ3jPiDKm6cOI1PuU-oM';
  const privKey = process.env.VAPID_PRIVATE_KEY || 'gi6UKdgvY7oL2TkiLWuDJPBtBkk0V4M--mXocHO7cF0';
  
  if (pubKey && privKey) {
    webpush.setVapidDetails(
      process.env.VAPID_EMAIL || 'mailto:admin@jamindan.gov.ph',
      pubKey,
      privKey
    );
  } else {
    console.warn('VAPID keys not set in notificationRoutes. Push disabled.');
  }
} catch (err) {
  console.error('Failed to initialize webpush:', err.message);
}

// Get latest active emergency broadcast (within last 4 hours) - Public so emergency siren sounds without auth barrier
router.get('/active-broadcast', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, title, message, reference_type, created_at FROM notifications 
      WHERE reference_type LIKE 'broadcast%' 
      AND created_at >= NOW() - INTERVAL 4 HOUR
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    
    if (rows && rows.length > 0) {
      const b = rows[0];
      const severity = b.reference_type && b.reference_type.includes(':') 
        ? b.reference_type.split(':')[1] 
        : 'extreme';
      return res.json({ active: true, broadcast: { ...b, severity } });
    }
    return res.json({ active: false, broadcast: null });
  } catch (error) {
    console.error('Fetch active broadcast error:', error);
    return res.status(500).json({ message: 'Server error while checking active broadcast' });
  }
});

router.use(authRequired);

// Get notifications for current user
router.get('/', async (req, res) => {
  try {
    const [list] = await db.execute(`
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 50
    `, [req.user.id]);
    
    return res.json(list);
  } catch (error) {
    console.error('Fetch notifications error:', error);
    return res.status(500).json({ message: 'Server error while fetching notifications' });
  }
});

// Mark single notification as read
router.put('/:id/read', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.execute('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Notification not found or access denied' });
    }
    return res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    return res.status(500).json({ message: 'Server error while marking notification as read' });
  }
});

// Mark all notifications as read for current user
router.put('/read-all', async (req, res) => {
  try {
    await db.execute('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
    return res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    return res.status(500).json({ message: 'Server error while marking all as read' });
  }
});

// ADMIN ONLY: Mass Broadcast Notification (supports NDRRMC Extreme, Severe, and Advisory)
router.post('/broadcast', requireRole(['Admin']), async (req, res) => {
  const { title, message, severity = 'extreme', target_area = 'Municipality of Jamindan (All Barangays)' } = req.body;
  if (!title || !message) {
    return res.status(400).json({ message: 'Title and message are required' });
  }

  try {
    const [users] = await db.query('SELECT id, push_subscription FROM users WHERE is_active = 1');
    
    let sentCount = 0;
    const alertPrefix = severity === 'extreme' 
      ? '🚨 NDRRMC EMERGENCY ALERT: EXTREME' 
      : (severity === 'severe' ? '⚠️ EMERGENCY ALERT: SEVERE' : '📢 MUNICIPAL ADVISORY');

    const formattedBody = `[${target_area}] ${message}`;

    const payload = JSON.stringify({
      title: `${alertPrefix} - ${title}`,
      body: formattedBody,
      icon: '/jamindan-seal.png',
      url: `/?broadcast=1&title=${encodeURIComponent(title)}&msg=${encodeURIComponent(message)}&severity=${encodeURIComponent(severity)}&area=${encodeURIComponent(target_area)}`
    });

    if (users.length > 0) {
      // Bulk insert notifications for all active users in a single query
      const insertValues = users.map(u => [u.id, title, formattedBody, `broadcast:${severity}`, null]);
      await db.query(
        'INSERT INTO notifications (user_id, title, message, reference_type, reference_id) VALUES ?',
        [insertValues]
      );

      // Dispatch Web Push in parallel
      const pushPromises = users
        .filter(u => u.push_subscription)
        .map(async (u) => {
          try {
            const subscription = JSON.parse(u.push_subscription);
            await webpush.sendNotification(subscription, payload);
            return true;
          } catch (err) {
            console.warn(`Failed to push to user ${u.id}:`, err.message);
            return false;
          }
        });

      const pushResults = await Promise.allSettled(pushPromises);
      sentCount = pushResults.filter(r => r.status === 'fulfilled' && r.value === true).length;
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('new-broadcast', { 
        title, 
        message, 
        severity, 
        target_area, 
        created_at: new Date().toISOString() 
      });
    }

    return res.json({ message: `Broadcast sent to ${sentCount} devices successfully.` });
  } catch (error) {
    console.error('Broadcast error:', error);
    return res.status(500).json({ message: 'Server error while broadcasting' });
  }
});

// ADMIN ONLY: Geofenced Mass Evacuation Alert
router.post('/broadcast-evacuation', requireRole(['Admin']), async (req, res) => {
  const { title, message, lat, lng, radius_meters } = req.body;
  if (!title || !message || lat === undefined || lng === undefined || !radius_meters) {
    return res.status(400).json({ message: 'Title, message, lat, lng, and radius_meters are required' });
  }

  try {
    // Haversine formula to find users within radius
    const [users] = await db.query(`
      SELECT id, push_subscription 
      FROM users 
      WHERE is_active = 1 
      AND current_lat IS NOT NULL 
      AND current_lng IS NOT NULL
      AND id != ?
      AND (
        6371000 * acos(
          cos(radians(?)) * cos(radians(current_lat)) * cos(radians(current_lng) - radians(?)) + 
          sin(radians(?)) * sin(radians(current_lat))
        )
      ) <= ?
    `, [req.user.id, lat, lng, lat, radius_meters]);

    let sentCount = 0;
    const payload = JSON.stringify({
      title: title,
      body: message,
      icon: '/jamindan-seal.png',
      url: `/?broadcast=1&title=${encodeURIComponent(title)}&msg=${encodeURIComponent(message)}`
    });

    if (users.length > 0) {
      // Bulk insert notifications for all users in geofence
      const insertValues = users.map(u => [u.id, title, message, 'evacuation', null]);
      await db.query(
        'INSERT INTO notifications (user_id, title, message, reference_type, reference_id) VALUES ?',
        [insertValues]
      );

      // Dispatch WebPush in parallel
      const pushPromises = users
        .filter(u => u.push_subscription)
        .map(async (u) => {
          try {
            const subscription = JSON.parse(u.push_subscription);
            await webpush.sendNotification(subscription, payload);
            return true;
          } catch (err) {
            console.warn(`Failed to push to user ${u.id}:`, err.message);
            return false;
          }
        });

      const pushResults = await Promise.allSettled(pushPromises);
      sentCount = pushResults.filter(r => r.status === 'fulfilled' && r.value === true).length;
    }

    await db.logAudit(`Broadcasted evacuation alert to ${users.length} users in geofence`, req.user.username, req.ip);
    
    const io = req.app.get('io');
    if (io) {
      io.emit('new-broadcast', { title, message, type: 'evacuation' });
    }

    res.json({ message: 'Evacuation broadcast sent successfully', target_users: users.length, pushes_sent: sentCount });

  } catch (error) {
    console.error('Evacuation broadcast error:', error);
    res.status(500).json({ message: 'Failed to send evacuation broadcast' });
  }
});

// Resident Safety Check-In ("I Am Safe" / "At Evacuation Center" / "Needs Assistance")
router.post('/safety-checkin', async (req, res) => {
  const { status = 'Safe', note = '' } = req.body;
  const validStatuses = ['Safe', 'At Evacuation Center', 'Needs Assistance'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid safety status' });
  }

  try {
    await db.execute(
      `INSERT INTO safety_checkins (user_id, status, note, updated_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE status = VALUES(status), note = VALUES(note), updated_at = CURRENT_TIMESTAMP`,
      [req.user.id, status, note ? note.trim().slice(0, 250) : null]
    );

    const io = req.app.get('io');
    if (io) {
      io.emit('safety-checkin-updated', {
        userId: req.user.id,
        status,
        updatedAt: new Date().toISOString()
      });
    }

    return res.json({ message: `Safety status updated to "${status}".`, status });
  } catch (error) {
    console.error('Safety check-in error:', error);
    return res.status(500).json({ message: 'Server error while saving safety check-in' });
  }
});

// Get Safety Check-In Summary & Current User Status
router.get('/safety-checkins', async (req, res) => {
  try {
    const [counts] = await db.query(`
      SELECT 
        SUM(CASE WHEN status = 'Safe' THEN 1 ELSE 0 END) as safeCount,
        SUM(CASE WHEN status = 'At Evacuation Center' THEN 1 ELSE 0 END) as evacuatedCount,
        SUM(CASE WHEN status = 'Needs Assistance' THEN 1 ELSE 0 END) as needsHelpCount
      FROM safety_checkins
    `);

    const [myRows] = await db.query(
      'SELECT status, note, updated_at FROM safety_checkins WHERE user_id = ?',
      [req.user.id]
    );

    let recentCheckins = [];
    if (req.user.role === 'Admin' || req.user.role === 'Responder') {
      const [recentRows] = await db.query(`
        SELECT s.id, s.status, s.note, s.updated_at,
               u.full_name, u.barangay, u.phone
        FROM safety_checkins s
        JOIN users u ON s.user_id = u.id
        ORDER BY 
          CASE WHEN s.status = 'Needs Assistance' THEN 1 ELSE 2 END ASC,
          s.updated_at DESC
        LIMIT 15
      `);
      recentCheckins = recentRows;
    }

    return res.json({
      summary: {
        safeCount: Number(counts[0]?.safeCount || 0),
        evacuatedCount: Number(counts[0]?.evacuatedCount || 0),
        needsHelpCount: Number(counts[0]?.needsHelpCount || 0)
      },
      myCheckin: myRows[0] || null,
      recentCheckins
    });
  } catch (error) {
    console.error('Fetch safety checkins error:', error);
    return res.status(500).json({ message: 'Server error while fetching safety check-ins' });
  }
});

module.exports = router;
