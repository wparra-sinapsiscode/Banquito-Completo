const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendar.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

// Proteger todas las rutas del calendario con autenticación
router.use(authMiddleware);

/**
 * @route GET /api/v1/calendar/events
 * @desc Obtener eventos del calendario con filtros
 * @access Private (Admin/Member)
 * @query startDate, endDate, type, memberId
 */
router.get('/events', calendarController.getCalendarEvents);

/**
 * @route GET /api/v1/calendar/upcoming
 * @desc Obtener próximos eventos (por defecto 7 días)
 * @access Private (Admin/Member)
 * @query days
 */
router.get('/upcoming', calendarController.getUpcomingEvents);

/**
 * @route GET /api/v1/calendar/events/:date
 * @desc Obtener eventos para una fecha específica
 * @access Private (Admin/Member)
 * @param date Fecha en formato YYYY-MM-DD
 */
router.get('/events/:date', calendarController.getEventsByDate);

module.exports = router;