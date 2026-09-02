const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authRequired, requireRole } = require('../middleware/auth');
const webpush = require('web-push');

try {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      process.env.VAPID_EMAIL || 'mailto:test@example.com',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  } else {
    console.warn('VAPID keys not set. Push notifications will be disabled.');
  }
} catch (err) {
  console.error('Failed to initialize webpush:', err.message);
}

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

// ADMIN ONLY: Mass Broadcast Notification
router.post('/broadcast', requireRole(['Admin']), async (req, res) => {
  const { title, message } = req.body;
  if (!title || !message) {
    return res.status(400).json({ message: 'Title and message are required' });
  }

  try {
    const [users] = await db.query('SELECT id, push_subscription FROM users WHERE is_active = 1');
    
    let sentCount = 0;
    const payload = JSON.stringify({
      title: title,
      body: message,
      icon: '/jamindan-seal.png',
      url: '/'
    });

    for (const u of users) {
      if (u.push_subscription) {
        try {
          const subscription = JSON.parse(u.push_subscription);
          await webpush.sendNotification(subscription, payload);
          sentCount++;
        } catch (err) {
          console.warn(`Failed to push to user ${u.id}`);
        }
      }
      
      // Also save to database notifications table for them to see in-app
      await db.execute(
        'INSERT INTO notifications (user_id, title, message, reference_type, reference_id) VALUES (?, ?, ?, ?, ?)',
        [u.id, title, message, 'broadcast', null]
      );
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
      AND (
        6371000 * acos(
          cos(radians(?)) * cos(radians(current_lat)) * cos(radians(current_lng) - radians(?)) + 
          sin(radians(?)) * sin(radians(current_lat))
        )
      ) <= ?
    `, [lat, lng, lat, radius_meters]);

    let sentCount = 0;
    const payload = JSON.stringify({
      title: title,
      body: message,
      icon: '/jamindan-seal.png',
      url: '/'
    });

    for (const u of users) {
      // Create in-app notification
      await db.execute('INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)', [u.id, title, message]);
      
      // Send WebPush notification
      if (u.push_subscription) {
        try {
          const subscription = JSON.parse(u.push_subscription);
          await webpush.sendNotification(subscription, payload);
          sentCount++;
        } catch (err) {
          console.warn(`Failed to push to user ${u.id}`);
        }
      }
    }

    await db.logAudit(`Broadcasted evacuation alert to ${users.length} users in geofence`, req.user.username, req.ip);
    res.json({ message: 'Evacuation broadcast sent successfully', target_users: users.length, pushes_sent: sentCount });

  } catch (error) {
    console.error('Evacuation broadcast error:', error);
    res.status(500).json({ message: 'Failed to send evacuation broadcast' });
  }
});

module.exports = router;
