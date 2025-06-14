const authService = require('../services/auth.service');
const logger = require('../utils/logger');

class AuthController {
  async login(req, res, next) {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Usuario y contraseña son requeridos'
        });
      }
      
      const result = await authService.login(username, password);
      
      res.json({
        success: true,
        data: result,
        message: 'Login exitoso'
      });
    } catch (error) {
      logger.error('Error en login controller:', error);
      
      if (error.message === 'Credenciales inválidas') {
        return res.status(401).json({
          success: false,
          message: error.message
        });
      }
      
      next(error);
    }
  }
  
  async logout(req, res, next) {
    try {
      logger.info(`Usuario ${req.user?.username} cerró sesión`);
      
      res.json({
        success: true,
        message: 'Logout exitoso'
      });
    } catch (error) {
      next(error);
    }
  }
  
  async me(req, res, next) {
    try {
      const user = {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role,
        name: req.user.name,
        memberId: req.user.member_id
      };
      
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
  
  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token requerido'
        });
      }
      
      const result = await authService.refreshToken(refreshToken);
      
      res.json({
        success: true,
        data: result,
        message: 'Token renovado exitosamente'
      });
    } catch (error) {
      if (error.message === 'Refresh token inválido') {
        return res.status(401).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }
}

module.exports = new AuthController();