const express = require('express');
const { body } = require('express-validator');
const systemController = require('../controllers/system.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');
const { handleValidationErrors } = require('../middleware/validation.middleware');

const router = express.Router();

// Public endpoint for getting settings (needed for app initialization)
router.get('/settings', systemController.getSettings);

// Protected routes
router.use(authMiddleware);

router.put('/settings', [
  roleMiddleware(['admin']),
  body('shareValue')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('El valor de la acción debe ser mayor a 0'),
  body('loanLimits.individual')
    .optional()
    .isFloat({ min: 100 })
    .withMessage('El límite individual debe ser mayor a 100'),
  body('loanLimits.guaranteePercentage')
    .optional()
    .isFloat({ min: 1, max: 100 })
    .withMessage('El porcentaje de garantía debe estar entre 1 y 100'),
  body('monthlyInterestRates.high')
    .optional()
    .isFloat({ min: 0, max: 50 })
    .withMessage('La tasa alta debe estar entre 0 y 50'),
  body('monthlyInterestRates.medium')
    .optional()
    .isFloat({ min: 0, max: 50 })
    .withMessage('La tasa media debe estar entre 0 y 50'),
  body('monthlyInterestRates.low')
    .optional()
    .isFloat({ min: 0, max: 50 })
    .withMessage('La tasa baja debe estar entre 0 y 50'),
  body('operationDay')
    .optional()
    .isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
    .withMessage('Día de operación inválido'),
  body('delinquencyRate')
    .optional()
    .isFloat({ min: 0, max: 50 })
    .withMessage('La tasa de morosidad debe estar entre 0 y 50'),
  handleValidationErrors
], systemController.updateSettings);

router.get('/statistics', systemController.getStatistics);

module.exports = router;