const express = require('express');
const { body, param, query } = require('express-validator');
const membersController = require('../controllers/members.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');
const { handleValidationErrors } = require('../middleware/validation.middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('La página debe ser un número mayor a 0'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('El límite debe estar entre 1 y 100'),
  query('creditRating').optional().isIn(['green', 'yellow', 'red']).withMessage('Calificación crediticia inválida'),
  query('orderBy').optional().isIn(['name', 'dni', 'credit_score', 'created_at']).withMessage('Campo de ordenamiento inválido'),
  query('orderDir').optional().isIn(['ASC', 'DESC']).withMessage('Dirección de ordenamiento inválida'),
  handleValidationErrors
], membersController.getMembers);

router.get('/:id', [
  param('id').isInt().withMessage('ID debe ser un número'),
  handleValidationErrors
], membersController.getMemberById);

router.post('/', [
  roleMiddleware(['admin']),
  body('name')
    .notEmpty()
    .withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('dni')
    .notEmpty()
    .withMessage('El DNI es requerido')
    .isLength({ min: 8, max: 20 })
    .withMessage('El DNI debe tener entre 8 y 20 caracteres'),
  body('shares')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Las acciones deben ser un número mayor o igual a 0'),
  body('guarantee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('La garantía debe ser un número mayor o igual a 0'),
  body('credit_rating')
    .optional()
    .isIn(['green', 'yellow', 'red'])
    .withMessage('Calificación crediticia inválida'),
  body('credit_score')
    .optional()
    .isInt({ min: 1, max: 90 })
    .withMessage('El puntaje crediticio debe estar entre 1 y 90'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email inválido'),
  body('username')
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage('El username debe tener entre 3 y 50 caracteres'),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
  handleValidationErrors
], membersController.createMember);

router.put('/:id', [
  roleMiddleware(['admin']),
  param('id').isInt().withMessage('ID debe ser un número'),
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('dni')
    .optional()
    .isLength({ min: 8, max: 20 })
    .withMessage('El DNI debe tener entre 8 y 20 caracteres'),
  body('shares')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Las acciones deben ser un número mayor o igual a 0'),
  body('guarantee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('La garantía debe ser un número mayor o igual a 0'),
  body('credit_rating')
    .optional()
    .isIn(['green', 'yellow', 'red'])
    .withMessage('Calificación crediticia inválida'),
  body('credit_score')
    .optional()
    .isInt({ min: 1, max: 90 })
    .withMessage('El puntaje crediticio debe estar entre 1 y 90'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email inválido'),
  handleValidationErrors
], membersController.updateMember);

router.put('/:id/savings-plan', [
  roleMiddleware(['admin']),
  param('id').isInt().withMessage('ID debe ser un número'),
  body('enabled')
    .isBoolean()
    .withMessage('Enabled debe ser booleano'),
  body('planDays')
    .optional()
    .isInt({ min: 30, max: 365 })
    .withMessage('Los días del plan deben estar entre 30 y 365'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Fecha de inicio inválida'),
  body('TEA')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('TEA debe estar entre 0 y 1'),
  handleValidationErrors
], membersController.updateSavingsPlan);

router.delete('/:id', [
  roleMiddleware(['admin']),
  param('id').isInt().withMessage('ID debe ser un número'),
  handleValidationErrors
], membersController.deleteMember);

module.exports = router;