const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

// Proteger todas las rutas del dashboard con autenticación
router.use(authMiddleware);

/**
 * @route GET /api/v1/dashboard
 * @desc Obtener datos completos del dashboard
 * @access Private (Admin/Member)
 */
router.get('/', dashboardController.getDashboardData);

/**
 * @route GET /api/v1/dashboard/quick-stats
 * @desc Obtener estadísticas rápidas para widgets
 * @access Private (Admin/Member)
 */
router.get('/quick-stats', dashboardController.getQuickStats);

module.exports = router;