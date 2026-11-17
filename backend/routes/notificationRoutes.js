const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authRequired, requireRole } = require('../middleware/auth');
const { webpush } = require('../config/push');

// Get latest active emergency broadcast (within last 4 hours) - Public so emergency siren sounds without auth barrier
router.get('/active-broadcast', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, title, message, reference_type, created_at FROM notifications 
      WHERE reference_type LIKE 'broadcast:%' 
      AND created_at >= NOW() - INTERVAL 4 HOUR
      ORDER BY id DESC 
      LIMIT 1
    `);
    
    if (rows && rows.length > 0) {
      const b = rows[0];
      const parts = (b.reference_type || '').split(':');
      const severity = parts[1] || 'extreme';
      const broadcastKey = parts[2] || String(b.id);

      let target_area = 'Municipality of Jamindan (All Barangays)';
      let cleanMessage = b.message;
      const match = b.message && b.message.match(/^\[(.*?)\]\s*([\s\S]*)$/);
      if (match) {
        target_area = match[1];
        cleanMessage = match[2];
      }

      return res.json({ 
        active: true, 
        broadcast: { 
          id: broadcastKey,
          dbId: b.id,
          title: b.title,
          message: cleanMessage,
          severity,
          target_area,
          created_at: b.created_at
        } 
      });
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

// Mark broadcast as read for current user by batch key or id
router.put('/broadcast/:key/read', async (req, res) => {
  const { key } = req.params;
  try {
    await db.execute(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND (reference_type LIKE ? OR id = ?)',
      [req.user.id, `%:${key}`, /^\d+$/.test(key) ? Number(key) : -1]
    );
    return res.json({ message: 'Broadcast marked as read' });
  } catch (error) {
    console.error('Mark broadcast read error:', error);
    return res.status(500).json({ message: 'Server error while marking broadcast as read' });
  }
});

// Official 30 Barangays in Jamindan for targeted emergency alerts
const JAMINDAN_BARANGAYS = [
  'Agambulong', 'Agbun-od', 'Agcagay', 'Aglibacao', 'Agloloway', 
  'Bayebaye', 'Caridad', 'Esperanza', 'Fe', 'Ganzon', 
  'Guintas', 'Igang', 'Jaena Norte', 'Jaena Sur', 'Jagnaya', 
  'Lapaz', 'Linambasan', 'Lucero', 'Maantol', 'Masgrau', 
  'Milan', 'Molet', 'Pangabat', 'Pangabuan', 'Pasol-o', 
  'Poblacion', 'San Jose', 'San Juan', 'San Vicente', 'Santo Rosario'
];

const matchesBarangayInText = (text, brgy) => {
  if (!text || !brgy) return false;
  const clean = brgy.trim().replace(/^Barangay\s+/i, '').trim();
  if (!clean) return false;
  const escaped = clean.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`(^|\\b|\\W)${escaped}(\\b|\\W|$)`, 'i');
  return regex.test(text);
};

const isUserInTargetArea = (user, target_area) => {
  // Admins and Responders ALWAYS receive broadcasts for command situational awareness & dispatch
  if (!user || user.role === 'Admin' || user.role === 'Responder') {
    return true;
  }

  if (!target_area) return true;

  const areaStr = String(target_area).trim();
  const areaLower = areaStr.toLowerCase();

  // If municipal-wide or targeting all barangays, everyone receives it
  if (
    areaLower.includes('all barangays') || 
    areaLower === 'municipality of jamindan' ||
    areaLower === 'all'
  ) {
    return true;
  }

  // Resident's registered barangay
  const userBarangay = (user.barangay || '').trim();
  if (!userBarangay) {
    // If resident has no barangay set on profile, default to true so life-saving alerts aren't missed
    return true;
  }

  // Check if resident's barangay matches target area or cluster
  if (matchesBarangayInText(areaStr, userBarangay)) {
    return true;
  }

  // If the target area specifically names other known Jamindan barangay(s), and this resident is not in any of them
  const mentionsAnyKnownBarangay = JAMINDAN_BARANGAYS.some(b => matchesBarangayInText(areaStr, b));
  if (!mentionsAnyKnownBarangay) {
    // Target is a general landmark or road without a specific barangay named -> notify all residents
    return true;
  }

  return false;
};

// ADMIN ONLY: Mass Broadcast Notification (supports NDRRMC Extreme, Severe, and Advisory with Strict Area Targeting)
router.post('/broadcast', requireRole(['Admin']), async (req, res) => {
  const { title, message, severity = 'extreme', target_area = 'Municipality of Jamindan (All Barangays)' } = req.body;
  if (!title || !message) {
    return res.status(400).json({ message: 'Title and message are required' });
  }

  try {
    const [users] = await db.query('SELECT id, role, barangay, push_subscription FROM users WHERE is_active = 1');
    const targetedUsers = users.filter(u => isUserInTargetArea(u, target_area));
    const batchKey = Date.now().toString(36);
    
    let sentCount = 0;
    const alertPrefix = severity === 'extreme' 
      ? '🚨 NDRRMC EMERGENCY ALERT: EXTREME' 
      : (severity === 'severe' ? '⚠️ EMERGENCY ALERT: SEVERE' : '📢 MUNICIPAL ADVISORY');

    const formattedBody = `[${target_area}] ${message}`;

    const payload = JSON.stringify({
      title: `${alertPrefix} - ${title}`,
      body: formattedBody,
      icon: '/logo.png',
      url: `/?broadcast=1&b_id=${encodeURIComponent(batchKey)}&title=${encodeURIComponent(title)}&msg=${encodeURIComponent(message)}&severity=${encodeURIComponent(severity)}&area=${encodeURIComponent(target_area)}`
    });

    let broadcastId = batchKey;
    if (targetedUsers.length > 0) {
      // Bulk insert notifications ONLY for targeted users (and Responders/Admins)
      const insertValues = targetedUsers.map(u => [u.id, title, formattedBody, `broadcast:${severity}:${batchKey}`, null]);
      await db.query(
        'INSERT INTO notifications (user_id, title, message, reference_type, reference_id) VALUES ?',
        [insertValues]
      );

      // Dispatch Web Push in parallel strictly to targeted users
      const pushPromises = targetedUsers
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
        id: broadcastId,
        title, 
        message, 
        severity, 
        target_area, 
        created_at: new Date().toISOString() 
      });
    }

    try {
      await db.logAudit(
        `Transmitted NDRRMC Mass Broadcast: "${title}" (${severity.toUpperCase()}) for ${target_area} (${targetedUsers.length} users targeted)`,
        req.user.username,
        req.ip
      );
    } catch (aErr) {}

    // Automatically activate resident safety check-in on emergency broadcasts
    if (severity === 'extreme' || severity === 'severe') {
      try {
        await db.query(`
          INSERT INTO system_settings (setting_key, setting_value)
          VALUES ('safety_checkin_active', 'true')
          ON DUPLICATE KEY UPDATE setting_value = 'true'
        `);
        if (io) {
          io.emit('safety-checkin-mode-changed', { active: true, reason: 'broadcast' });
          io.emit('safety-checkin-updated');
        }
      } catch (e) {
        console.warn('Could not auto-activate safety check-in:', e);
      }
    }

    return res.json({ 
      success: true,
      broadcastId,
      message: `Broadcast transmitted to ${sentCount} devices successfully.` 
    });
  } catch (error) {
    console.error('Broadcast error:', error);
    return res.status(500).json({ message: 'Server error while broadcasting' });
  }
});

// ADMIN ONLY: Cancel / Stand Down Active Mass Broadcast Across All Devices
router.post('/broadcast/clear', requireRole(['Admin']), async (req, res) => {
  try {
    // 1. Immediately notify all connected devices via Socket.IO so all siren audio & modals silence instantly
    const io = req.app.get('io');
    if (io) {
      io.emit('broadcast-cancelled', { 
        reason: 'Stand down issued by NDRRMC Operations Center',
        clearedAt: new Date().toISOString()
      });
      io.emit('safety-checkin-mode-changed', { active: false, reason: 'broadcast_cleared' });
      io.emit('safety-checkin-updated');
    }

    // 2. End all active broadcasts in DB
    const [result] = await db.query(`
      UPDATE notifications 
      SET reference_type = REPLACE(reference_type, 'broadcast:', 'broadcast_ended:') 
      WHERE reference_type LIKE 'broadcast:%' 
      AND created_at >= NOW() - INTERVAL 24 HOUR
    `);

    // Reset safety check-in
    try {
      await db.query(`
        INSERT INTO system_settings (setting_key, setting_value)
        VALUES ('safety_checkin_active', 'false')
        ON DUPLICATE KEY UPDATE setting_value = 'false'
      `);
    } catch (sErr) {}

    try {
      await db.logAudit('Admin issued Stand Down: Active NDRRMC Emergency Broadcast ended and silenced', req.user.username, req.ip);
    } catch (aErr) {}

    return res.json({ 
      success: true, 
      message: 'Active emergency broadcast stood down and silenced across all devices.',
      affectedRows: result.affectedRows 
    });
  } catch (error) {
    console.error('Clear broadcast error:', error);
    return res.status(500).json({ message: 'Server error while clearing broadcast' });
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
          LEAST(1.0, GREATEST(-1.0,
            cos(radians(?)) * cos(radians(current_lat)) * cos(radians(current_lng) - radians(?)) + 
            sin(radians(?)) * sin(radians(current_lat))
          ))
        )
      ) <= ?
    `, [req.user.id, lat, lng, lat, radius_meters]);

    let sentCount = 0;
    const evacId = `evac_${Date.now()}`;
    const payload = JSON.stringify({
      title: title,
      body: message,
      icon: '/logo.png',
      url: `/?broadcast=1&b_id=${encodeURIComponent(evacId)}&title=${encodeURIComponent(title)}&msg=${encodeURIComponent(message)}&severity=extreme`
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
      io.emit('new-broadcast', {
        id: evacId,
        title,
        message,
        type: 'evacuation',
        severity: 'extreme',
        target_area: req.body.target_area || 'Evacuation Zone'
      });
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

    // Check if safety check-in is currently active (respects explicit setting in system_settings)
    let isCheckinActive = false;
    try {
      const [settingRows] = await db.query(
        "SELECT setting_value FROM system_settings WHERE setting_key = 'safety_checkin_active'"
      );
      if (settingRows && settingRows.length > 0) {
        isCheckinActive = settingRows[0].setting_value === 'true';
      } else {
        // Fallback: If not explicitly configured yet, check if there is an active emergency broadcast
        const [activeBroadcasts] = await db.query(`
          SELECT id FROM notifications 
          WHERE reference_type LIKE 'broadcast:%' 
          AND created_at >= NOW() - INTERVAL 4 HOUR
          LIMIT 1
        `);
        if (activeBroadcasts && activeBroadcasts.length > 0) {
          isCheckinActive = true;
        }
      }
    } catch (sErr) {
      console.warn('Could not check safety check-in active status:', sErr.message);
    }

    let recentCheckins = [];
    if (req.user.role === 'Admin' || req.user.role === 'Responder') {
      const [recentRows] = await db.query(`
        SELECT s.id, s.user_id, s.status, s.note, s.updated_at,
               u.full_name, u.barangay, u.phone
        FROM safety_checkins s
        JOIN users u ON s.user_id = u.id
        ORDER BY 
          CASE 
            WHEN s.status = 'Needs Assistance' THEN 1 
            WHEN s.status = 'At Evacuation Center' THEN 2 
            ELSE 3 
          END ASC,
          s.updated_at DESC
        LIMIT 200
      `);
      recentCheckins = recentRows;
    }

    return res.json({
      isCheckinActive,
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

// ADMIN / RESPONDER: Manually toggle Safety Check-In mode (Active / Inactive)
router.post('/safety-checkin/toggle', requireRole(['Admin', 'Responder']), async (req, res) => {
  const { active } = req.body;
  const isActive = Boolean(active);
  const stringValue = isActive ? 'true' : 'false';

  try {
    await db.query(`
      INSERT INTO system_settings (setting_key, setting_value)
      VALUES ('safety_checkin_active', ?)
      ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
    `, [stringValue]);

    await db.logAudit(
      `${isActive ? 'Activated' : 'Deactivated'} Resident Safety Check-In`,
      req.user.username,
      req.ip
    );

    const io = req.app.get('io');
    if (io) {
      io.emit('safety-checkin-mode-changed', {
        active: isActive,
        updatedBy: req.user.full_name || req.user.username,
        updatedAt: new Date().toISOString()
      });
      io.emit('safety-checkin-updated');
    }

    return res.json({
      message: `Resident Safety Check-In ${isActive ? 'activated' : 'deactivated'} successfully.`,
      isCheckinActive: isActive
    });
  } catch (error) {
    console.error('Safety check-in toggle error:', error);
    return res.status(500).json({ message: 'Server error while updating safety check-in status' });
  }
});

// ADMIN / RESPONDER: Update a resident's safety check-in status (e.g., mark Needs Assistance as Safe after rescue)
router.put('/safety-checkins/:id/status', requireRole(['Admin', 'Responder']), async (req, res) => {
  const { status = 'Safe' } = req.body;
  const validStatuses = ['Safe', 'At Evacuation Center', 'Needs Assistance'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid safety status' });
  }

  const rawId = req.params.id;
  const targetId = parseInt(rawId, 10);
  if (!rawId || isNaN(targetId) || targetId <= 0) {
    return res.status(400).json({ message: 'Invalid resident check-in ID parameter' });
  }

  try {
    // Match by checkin id OR user_id to ensure reliable updates regardless of frontend parameter passed
    const [result] = await db.query(
      'UPDATE safety_checkins SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? OR user_id = ?',
      [status, targetId, targetId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Resident check-in record not found' });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('safety-checkin-updated', { id: targetId, status, updatedAt: new Date().toISOString() });
    }
    return res.json({ message: `Resident status updated to ${status}` });
  } catch (error) {
    console.error('Update resident checkin status error:', error);
    return res.status(500).json({ message: error.message || 'Server error while updating resident safety status' });
  }
});

module.exports = router;
