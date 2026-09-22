const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authRequired } = require('../middleware/auth');

// @route   POST /api/push/subscribe
// @desc    Save a user's web push subscription
// @access  Private
router.post('/subscribe', authRequired, async (req, res) => {
  const { subscription } = req.body;
  const userId = req.user.id;

  if (!subscription) {
    return res.status(400).json({ message: 'Subscription object required' });
  }

  try {
    const subscriptionString = JSON.stringify(subscription);
    
    // Prevent phantom notifications: Remove this device's token from any other accounts it was previously logged into
    await db.execute('UPDATE users SET push_subscription = NULL WHERE push_subscription = ?', [subscriptionString]);

    const [result] = await db.execute(
      'UPDATE users SET push_subscription = ? WHERE id = ?',
      [subscriptionString, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'Push subscription saved successfully' });
  } catch (error) {
    console.error('Push subscribe error:', error);
    res.status(500).json({ message: 'Server error saving push subscription' });
  }
});



router.get('/test', authRequired, async (req, res) => { try { const [rows] = await db.query('SELECT push_subscription FROM users WHERE id = ?', [req.user.id]); if (!rows[0] || !rows[0].push_subscription) return res.status(400).json({message:'No sub'}); const webpush = require('web-push'); webpush.setVapidDetails(process.env.VAPID_EMAIL || 'mailto:admin@jamindan.gov.ph', process.env.VAPID_PUBLIC_KEY || 'BJd5fK6r2z9Z39nPfgkV3kKcE9K3K7nvIAC7GFQdgZodVaVz-DRXaCVUoeb3VSjQxQCgJ3jPiDKm6cOI1PuU-oM', process.env.VAPID_PRIVATE_KEY || 'gi6UKdgvY7oL2TkiLWuDJPBtBkk0V4M--mXocHO7cF0'); await webpush.sendNotification(JSON.parse(rows[0].push_subscription), JSON.stringify({title:'Test', body:'This is a test notification'})); res.json({message:'Sent'}); } catch(e) { console.error(e); res.status(500).json({error: e.message}); } });

module.exports = router;