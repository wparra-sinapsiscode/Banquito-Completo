const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notifications.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

// Proteger todas las rutas de notificaciones con autenticación
router.use(authMiddleware);

/**
 * @route GET /api/v1/notifications
 * @desc Obtener notificaciones del usuario actual
 * @access Private (Admin/Member)
 * @query page, limit, type, read
 */
router.get('/', notificationsController.getNotifications);

/**
 * @route GET /api/v1/notifications/stats
 * @desc Obtener estadísticas de notificaciones
 * @access Private (Admin/Member)
 */
router.get('/stats', notificationsController.getNotificationStats);

/**
 * @route PUT /api/v1/notifications/:id/read
 * @desc Marcar notificación específica como leída
 * @access Private (Admin/Member)
 */
router.put('/:id/read', notificationsController.markAsRead);

/**
 * @route PUT /api/v1/notifications/read-all
 * @desc Marcar todas las notificaciones como leídas
 * @access Private (Admin/Member)
 */
router.put('/read-all', notificationsController.markAllAsRead);

module.exports = router;