const express = require('express');
const { body, param, query } = require('express-validator');
const loansController = require('../controllers/loans.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');
const { handleValidationErrors } = require('../middleware/validation.middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('La página debe ser un número mayor a 0'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('El límite debe estar entre 1 y 100'),
  query('status').optional().isIn(['active', 'paid', 'overdue']).withMessage('Estado inválido'),
  query('memberId').optional().isInt().withMessage('ID de miembro inválido'),
  handleValidationErrors
], loansController.getLoans);

router.get('/:id', [
  param('id').isInt().withMessage('ID debe ser un número'),
  handleValidationErrors
], loansController.getLoanById);

router.post('/', [
  roleMiddleware(['admin']),
  body('loanRequestId')
    .isInt()
    .withMessage('ID de solicitud debe ser un número'),
  body('approvedBy')
    .notEmpty()
    .withMessage('Nombre del aprobador es requerido'),
  handleValidationErrors
], loansController.createLoanFromRequest);

router.put('/:id/due-date', [
  roleMiddleware(['admin']),
  param('id').isInt().withMessage('ID debe ser un número'),
  body('newDueDate')
    .isISO8601()
    .withMessage('Nueva fecha de vencimiento inválida'),
  handleValidationErrors
], loansController.updateDueDate);

router.post('/:id/payments', [
  roleMiddleware(['admin']),
  param('id').isInt().withMessage('ID debe ser un número'),
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('El monto debe ser mayor a 0'),
  body('paymentDate')
    .isISO8601()
    .withMessage('Fecha de pago inválida'),
  body('lateFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Mora debe ser mayor o igual a 0'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Las notas no pueden exceder 500 caracteres'),
  handleValidationErrors
], loansController.registerPayment);

router.get('/:id/schedule', [
  param('id').isInt().withMessage('ID debe ser un número'),
  handleValidationErrors
], loansController.getPaymentSchedule);

module.exports = router;