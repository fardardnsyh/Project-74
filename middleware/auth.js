const jwt = require('jsonwebtoken');
require('dotenv').config();

function auth(req, res, next) {
  // Get token from Authorization header
  const token = req.header('x-auth-token');

  // Check if not token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Check if token is in "Bearer <token>" format
  if (!token.startsWith('Bearer ')) {
    return res.status(401).json({ msg: 'Invalid token format' });
  }

  try {
    // Extract the token string (remove "Bearer ")
    const tokenString = token.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(tokenString, process.env.JWT_SECRET);

    // If token is valid, add user information to the request
    req.user = decoded.user;
    next(); // Move to the next middleware or route handler
  } catch (err) {
    console.error(err);
    res.status(401).json({ msg: 'Token is not valid' });
  }
}

module.exports = auth;
