const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { handleValidationErrors } = require('../middleware/validation.middleware');

const router = express.Router();

router.post('/login', [
  body('username')
    .notEmpty()
    .withMessage('El usuario es requerido')
    .isLength({ min: 3, max: 50 })
    .withMessage('El usuario debe tener entre 3 y 50 caracteres'),
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
  handleValidationErrors
], authController.login);

router.post('/logout', authMiddleware, authController.logout);

router.get('/me', authMiddleware, authController.me);

router.post('/refresh', [
  body('refreshToken')
    .notEmpty()
    .withMessage('El refresh token es requerido'),
  handleValidationErrors
], authController.refresh);

module.exports = router;