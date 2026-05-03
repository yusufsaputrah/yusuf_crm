/**
 * @file authMiddleware.js
 * @description JWT authentication middleware and role-based authorization guards.
 */

const jwt = require('jsonwebtoken');

/**
 * Verifies JWT token from Authorization header.
 * Attaches decoded user payload to req.user.
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

/**
 * Authorization guard — allows only 'manager' role.
 */
const authorizeManager = (req, res, next) => {
  if (req.user.role !== 'manager') {
    return res.status(403).json({ success: false, message: 'Access denied. Manager role required.' });
  }
  next();
};

/**
 * Authorization guard — allows both 'sales' and 'manager' roles.
 */
const authorizeSalesOrManager = (req, res, next) => {
  if (!['sales', 'manager'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }
  next();
};

module.exports = { authenticate, authorizeManager, authorizeSalesOrManager };
