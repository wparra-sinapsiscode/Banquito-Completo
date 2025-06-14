const express = require('express');
const { body, param, query } = require('express-validator');
const savingsController = require('../controllers/savings.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');
const { handleValidationErrors } = require('../middleware/validation.middleware');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Obtener todos los planes de ahorro
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('La página debe ser un número mayor a 0'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('El límite debe estar entre 1 y 100'),
  query('memberId').optional().isInt().withMessage('ID de miembro inválido'),
  query('enabled').optional().isIn(['true', 'false']).withMessage('El estado debe ser true o false'),
  query('orderBy').optional().isIn(['created_at', 'start_date', 'plan_days']).withMessage('Campo de orden inválido'),
  query('orderDir').optional().isIn(['ASC', 'DESC']).withMessage('Dirección de orden inválida'),
  handleValidationErrors
], savingsController.getSavingsPlans);

// Calcular interés
router.post('/calculate-interest', [
  body('amount')
    .notEmpty().withMessage('El monto es requerido')
    .isFloat({ min: 1 }).withMessage('El monto debe ser mayor a 0'),
  body('days')
    .notEmpty().withMessage('Los días son requeridos')
    .isInt({ min: 1 }).withMessage('Los días deben ser mayor a 0'),
  body('tea')
    .optional()
    .isFloat({ min: 0, max: 1 }).withMessage('La TEA debe estar entre 0 y 1'),
  handleValidationErrors
], savingsController.calculateInterest);

// Obtener plan de ahorro por ID
router.get('/:id', [
  param('id').isInt().withMessage('ID debe ser un número'),
  handleValidationErrors
], savingsController.getSavingsPlanById);

// Obtener plan de ahorro por ID de miembro
router.get('/member/:memberId', [
  param('memberId').isInt().withMessage('ID de miembro debe ser un número'),
  handleValidationErrors
], savingsController.getSavingsPlanByMemberId);

// Crear nuevo plan de ahorro
router.post('/', [
  body('member_id')
    .notEmpty().withMessage('El ID del miembro es requerido')
    .isInt().withMessage('El ID del miembro debe ser un número'),
  body('enabled')
    .optional()
    .isBoolean().withMessage('El estado debe ser booleano'),
  body('plan_days')
    .optional()
    .isIn([90, 180, 365]).withMessage('Los días del plan deben ser 90, 180 o 365'),
  body('start_date')
    .optional()
    .isISO8601().withMessage('La fecha de inicio debe ser válida'),
  body('tea')
    .optional()
    .isFloat({ min: 0, max: 1 }).withMessage('La TEA debe estar entre 0 y 1'),
  handleValidationErrors
], savingsController.createSavingsPlan);

// Actualizar plan de ahorro
router.put('/:id', [
  param('id').isInt().withMessage('ID debe ser un número'),
  body('enabled')
    .optional()
    .isBoolean().withMessage('El estado debe ser booleano'),
  body('plan_days')
    .optional()
    .isIn([90, 180, 365]).withMessage('Los días del plan deben ser 90, 180 o 365'),
  body('start_date')
    .optional()
    .isISO8601().withMessage('La fecha de inicio debe ser válida'),
  body('tea')
    .optional()
    .isFloat({ min: 0, max: 1 }).withMessage('La TEA debe estar entre 0 y 1'),
  handleValidationErrors
], savingsController.updateSavingsPlan);

// Eliminar (desactivar) plan de ahorro
router.delete('/:id', [
  param('id').isInt().withMessage('ID debe ser un número'),
  handleValidationErrors
], savingsController.deleteSavingsPlan);

module.exports = router;