const jwt = require('jsonwebtoken');
const config = require('config');

const privateKey = config.get('privateKey');

const auth = (req, res, next) => {
  const token = req.header('x-auth-token');

  if (!token) {
    return res.status(401).json({ msg: 'No token, Authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, privateKey);
    req.user = decoded.user;
    next();
  } catch (err) {
    return res.status(401).json({ msg: 'Token is not valid' });
  }
};

module.exports = { auth };
