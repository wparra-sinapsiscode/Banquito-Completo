const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const validationMiddleware = require('../middleware/validation.middleware');

// Proteger todas las rutas de usuarios con autenticación
router.use(authMiddleware);

// Middleware para verificar que solo admins puedan acceder
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren permisos de administrador.'
    });
  }
  next();
};

/**
 * @route GET /api/v1/users
 * @desc Obtener lista de usuarios (solo admins)
 * @access Private (Admin only)
 */
router.get('/', requireAdmin, usersController.getUsers);

/**
 * @route GET /api/v1/users/:id
 * @desc Obtener usuario por ID
 * @access Private (Admin or own profile)
 */
router.get('/:id', (req, res, next) => {
  // Permitir que usuarios vean su propio perfil
  if (req.user.role !== 'admin' && req.user.id !== parseInt(req.params.id)) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para ver este usuario'
    });
  }
  next();
}, usersController.getUserById);

/**
 * @route POST /api/v1/users
 * @desc Crear nuevo usuario (solo admins)
 * @access Private (Admin only)
 */
router.post('/', 
  requireAdmin,
  [
    body('username')
      .isLength({ min: 3, max: 50 })
      .withMessage('El username debe tener entre 3 y 50 caracteres')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('El username solo puede contener letras, números y guiones bajos'),
    body('email')
      .isEmail()
      .withMessage('Debe ser un email válido')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('role')
      .optional()
      .isIn(['admin', 'member'])
      .withMessage('El rol debe ser admin o member'),
    body('member_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('member_id debe ser un entero válido')
  ],
  validationMiddleware.handleValidationErrors,
  usersController.createUser
);

/**
 * @route PUT /api/v1/users/:id
 * @desc Actualizar usuario
 * @access Private (Admin or own profile)
 */
router.put('/:id',
  [
    body('username')
      .optional()
      .isLength({ min: 3, max: 50 })
      .withMessage('El username debe tener entre 3 y 50 caracteres')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('El username solo puede contener letras, números y guiones bajos'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Debe ser un email válido')
      .normalizeEmail(),
    body('role')
      .optional()
      .isIn(['admin', 'member'])
      .withMessage('El rol debe ser admin o member'),
    body('active')
      .optional()
      .isBoolean()
      .withMessage('active debe ser un valor booleano'),
    body('member_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('member_id debe ser un entero válido')
  ],
  validationMiddleware.handleValidationErrors,
  (req, res, next) => {
    // Solo admins pueden cambiar role y active
    if (req.user.role !== 'admin') {
      delete req.body.role;
      delete req.body.active;
      delete req.body.member_id;
      
      // Solo permitir que usuarios editen su propio perfil
      if (req.user.id !== parseInt(req.params.id)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para editar este usuario'
        });
      }
    }
    next();
  },
  usersController.updateUser
);

/**
 * @route PUT /api/v1/users/:id/password
 * @desc Cambiar contraseña de usuario
 * @access Private (Admin or own profile)
 */
router.put('/:id/password',
  [
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('La nueva contraseña debe tener al menos 6 caracteres'),
    body('currentPassword')
      .optional()
      .isLength({ min: 1 })
      .withMessage('La contraseña actual es requerida para usuarios no admin')
  ],
  validationMiddleware.handleValidationErrors,
  usersController.changePassword
);

/**
 * @route PUT /api/v1/users/:id/toggle-status
 * @desc Activar/desactivar usuario (solo admins)
 * @access Private (Admin only)
 */
router.put('/:id/toggle-status', requireAdmin, usersController.toggleUserStatus);

/**
 * @route DELETE /api/v1/users/:id
 * @desc Eliminar usuario (solo admins)
 * @access Private (Admin only)
 */
router.delete('/:id', requireAdmin, usersController.deleteUser);

module.exports = router;