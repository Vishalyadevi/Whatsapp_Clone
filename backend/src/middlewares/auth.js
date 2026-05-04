const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
    req.userId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token is not valid' });
  }
};

module.exports = auth;
