const jwt = require('jsonwebtoken');
const db = require('../config/db');

const authRequired = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization header missing' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    
    // Verify user still exists, is active, and (if Resident) is verified in DB
    const [rows] = await db.execute('SELECT id, username, role, agency_type, is_active, is_verified FROM users WHERE id = ?', [decoded.id]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }
    if (!user.is_active) {
      return res.status(403).json({ message: 'Account is deactivated. Please contact administrator.' });
    }
    if (user.role === 'Resident' && !user.is_verified) {
      return res.status(403).json({ message: 'Account pending verification.' });
    }

    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      agency_type: user.agency_type
    };
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const requireRole = (allowedRoles) => {
  const roles = (Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]).map(r => String(r).toLowerCase());
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const userRole = String(req.user.role || '').toLowerCase();
    if (!roles.includes(userRole)) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }
    next();
  };
};

module.exports = {
  authRequired,
  requireRole
};
