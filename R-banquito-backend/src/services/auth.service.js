const bcrypt = require('bcryptjs');
const { User } = require('../models');
const jwt = require('../utils/jwt');
const logger = require('../utils/logger');

class AuthService {
  async login(username, password) {
    try {
      const user = await User.findOne({ 
        where: { username },
        include: ['member']
      });
      
      if (!user) {
        throw new Error('Credenciales inválidas');
      }
      
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      
      if (!isValidPassword) {
        throw new Error('Credenciales inválidas');
      }
      
      const payload = {
        userId: user.id,
        username: user.username,
        role: user.role
      };
      
      const token = jwt.generateToken(payload);
      const refreshToken = jwt.generateRefreshToken(payload);
      
      logger.info(`Usuario ${username} inició sesión exitosamente`);
      
      return {
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          name: user.name,
          memberId: user.member_id
        },
        token,
        refreshToken
      };
    } catch (error) {
      logger.error('Error en login:', error.message);
      throw error;
    }
  }

  async hashPassword(password) {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    return await bcrypt.hash(password, saltRounds);
  }

  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verifyRefreshToken(refreshToken);
      
      const user = await User.findByPk(decoded.userId, {
        include: ['member']
      });
      
      if (!user) {
        throw new Error('Usuario no encontrado');
      }
      
      const payload = {
        userId: user.id,
        username: user.username,
        role: user.role
      };
      
      const newToken = jwt.generateToken(payload);
      const newRefreshToken = jwt.generateRefreshToken(payload);
      
      return {
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          name: user.name,
          memberId: user.member_id
        },
        token: newToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      throw new Error('Refresh token inválido');
    }
  }

  async createUser(userData) {
    try {
      const hashedPassword = await this.hashPassword(userData.password);
      
      const user = await User.create({
        username: userData.username,
        password_hash: hashedPassword,
        role: userData.role || 'member',
        name: userData.name,
        member_id: userData.memberId || null
      });
      
      logger.info(`Usuario ${userData.username} creado exitosamente`);
      
      return {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        memberId: user.member_id
      };
    } catch (error) {
      logger.error('Error creando usuario:', error.message);
      throw error;
    }
  }

  async validateToken(token) {
    try {
      const decoded = jwt.verifyToken(token);
      
      const user = await User.findByPk(decoded.userId, {
        include: ['member']
      });
      
      if (!user) {
        throw new Error('Usuario no encontrado');
      }
      
      return {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        memberId: user.member_id
      };
    } catch (error) {
      throw new Error('Token inválido');
    }
  }
}

module.exports = new AuthService();