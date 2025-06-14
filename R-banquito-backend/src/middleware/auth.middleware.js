const jwt = require('../utils/jwt');
const { User } = require('../models');
const logger = require('../utils/logger');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    const decoded = jwt.verifyToken(token);
    
    const user = await User.findByPk(decoded.userId, {
      include: ['member']
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido - usuario no encontrado'
      });
    }
    
    req.user = user;
    req.userId = user.id;
    req.userRole = user.role;
    
    next();
  } catch (error) {
    logger.error('Error en middleware de autenticación:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
};

const roleMiddleware = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticación requerida'
      });
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(`Usuario ${req.user.username} intentó acceder sin permisos. Rol: ${req.user.role}, Requerido: ${roles.join(', ')}`);
      
      return res.status(403).json({
        success: false,
        message: 'Permisos insuficientes'
      });
    }
    
    next();
  };
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verifyToken(token);
    
    const user = await User.findByPk(decoded.userId, {
      include: ['member']
    });
    
    if (user) {
      req.user = user;
      req.userId = user.id;
      req.userRole = user.role;
    }
    
    next();
  } catch (error) {
    next();
  }
};

module.exports = { 
  authMiddleware, 
  roleMiddleware, 
  optionalAuth 
};