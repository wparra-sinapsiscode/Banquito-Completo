const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reports.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

// Proteger todas las rutas de reportes con autenticación
router.use(authMiddleware);

/**
 * @route GET /api/v1/reports/loans
 * @desc Obtener reporte de préstamos con filtros
 * @access Private (Admin/Member)
 * @query startDate, endDate, status, memberId, minAmount, maxAmount, format
 */
router.get('/loans', reportsController.getLoansReport);

/**
 * @route GET /api/v1/reports/members
 * @desc Obtener reporte de miembros con filtros
 * @access Private (Admin/Member)
 * @query creditRating, hasLoans, hasSavings, format
 */
router.get('/members', reportsController.getMembersReport);

/**
 * @route GET /api/v1/reports/payments
 * @desc Obtener reporte de pagos con filtros
 * @access Private (Admin/Member)
 * @query startDate, endDate, memberId, paymentType, format
 */
router.get('/payments', reportsController.getPaymentsReport);

/**
 * @route GET /api/v1/reports/financial-summary
 * @desc Obtener resumen financiero del sistema
 * @access Private (Admin/Member)
 * @query year, month
 */
router.get('/financial-summary', reportsController.getFinancialSummary);

module.exports = router;