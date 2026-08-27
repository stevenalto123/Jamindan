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

module.exports = router;
