const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const auth = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // Fetch user details to get the name
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { name: true, role: true, pages: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found.' });
    }
    
    req.user.name = user.name;
    req.user.role = user.role; // Update role in case it was changed
    req.user.pages = user.pages; // Update pages in case they were changed

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

module.exports = auth;
