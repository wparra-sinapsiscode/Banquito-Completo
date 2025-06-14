const jwt = require('jsonwebtoken');

class JWTUtil {
  generateToken(payload) {
    return jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );
  }

  generateRefreshToken(payload) {
    return jwt.sign(
      payload,
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Token inválido');
    }
  }

  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      throw new Error('Refresh token inválido');
    }
  }

  decodeToken(token) {
    return jwt.decode(token);
  }
}

module.exports = new JWTUtil();