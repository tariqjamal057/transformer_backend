const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // Owner has access to everything
    if (req.user.role === 'OWNER') {
      return next();
    }

    // e.g. /api/users -> users
    const requestedModule = req.baseUrl.split('/').pop();

    if (req.user.pages && req.user.pages.includes(requestedModule)) {
      return next();
    }

    return res.status(403).json({ error: 'Forbidden: You do not have access to this resource.' });

  } catch (error) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

module.exports = { auth };
