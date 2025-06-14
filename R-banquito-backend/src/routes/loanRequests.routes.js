const express = require('express');
const { body, param, query } = require('express-validator');
const loanRequestsController = require('../controllers/loanRequests.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');
const { handleValidationErrors } = require('../middleware/validation.middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('La página debe ser un número mayor a 0'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('El límite debe estar entre 1 y 100'),
  query('status').optional().isIn(['pending', 'approved', 'rejected']).withMessage('Estado inválido'),
  query('memberId').optional().isInt().withMessage('ID de miembro inválido'),
  handleValidationErrors
], loanRequestsController.getLoanRequests);

router.post('/', [
  body('memberId')
    .isInt()
    .withMessage('ID de miembro debe ser un número'),
  body('requestedAmount')
    .isFloat({ min: 100, max: 50000 })
    .withMessage('El monto solicitado debe estar entre 100 y 50000'),
  body('purpose')
    .notEmpty()
    .isLength({ min: 10, max: 500 })
    .withMessage('El propósito debe tener entre 10 y 500 caracteres'),
  body('installments')
    .isInt({ min: 1, max: 36 })
    .withMessage('Las cuotas deben estar entre 1 y 36'),
  body('requiredDate')
    .optional()
    .isISO8601()
    .withMessage('La fecha requerida debe ser válida'),
  handleValidationErrors
], loanRequestsController.createLoanRequest);

router.put('/:id/approve', [
  roleMiddleware(['admin']),
  param('id').isInt().withMessage('ID debe ser un número'),
  body('approvedBy')
    .notEmpty()
    .withMessage('Nombre del aprobador es requerido'),
  handleValidationErrors
], loanRequestsController.approveLoanRequest);

router.put('/:id/reject', [
  roleMiddleware(['admin']),
  param('id').isInt().withMessage('ID debe ser un número'),
  body('rejectedBy')
    .notEmpty()
    .withMessage('Nombre del rechazador es requerido'),
  body('rejectionReason')
    .notEmpty()
    .isLength({ min: 10, max: 500 })
    .withMessage('La razón del rechazo debe tener entre 10 y 500 caracteres'),
  handleValidationErrors
], loanRequestsController.rejectLoanRequest);

module.exports = router;