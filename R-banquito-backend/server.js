const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Configurar timezone para Lima, Perú
process.env.TZ = 'America/Lima';

const logger = require('./src/utils/logger');

const app = express();

// Middleware de seguridad
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configurado para producción en Vercel
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:2000',
      'https://banquito-frontend.vercel.app',
      'https://banquito-frontend-git-main-williams-projects-3d9bf414.vercel.app'
    ];
    
    // En producción, permitir dominios de Vercel
    if (process.env.NODE_ENV === 'production') {
      if (origin.includes('vercel.app') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
    } else {
      // En desarrollo, ser más permisivo
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
  preflightContinue: false,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP por ventana
  message: {
    success: false,
    message: 'Demasiadas solicitudes, intenta de nuevo más tarde'
  }
});
app.use('/api/', limiter);

// Middleware para parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Banquito Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Rutas de la API
app.use('/api/v1/auth', require('./src/routes/auth.routes'));
app.use('/api/v1/members', require('./src/routes/members.routes'));
app.use('/api/v1/loans', require('./src/routes/loans.routes'));
app.use('/api/v1/loan-requests', require('./src/routes/loanRequests.routes'));
app.use('/api/v1/system', require('./src/routes/system.routes'));
app.use('/api/v1/dashboard', require('./src/routes/dashboard.routes'));
app.use('/api/v1/users', require('./src/routes/users.routes'));
app.use('/api/v1/reports', require('./src/routes/reports.routes'));
app.use('/api/v1/notifications', require('./src/routes/notifications.routes'));
app.use('/api/v1/calendar', require('./src/routes/calendar.routes'));
app.use('/api/v1/savings', require('./src/routes/savings.routes'));

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint no encontrado'
  });
});

// Middleware de manejo de errores
app.use((error, req, res, next) => {
  logger.error(error.stack);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

const PORT = process.env.PORT || 2000;

// Solo escuchar en desarrollo local
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    logger.info(`🚀 Servidor Banquito Backend corriendo en puerto ${PORT}`);
    logger.info(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
    logger.info(`🔧 Ambiente: ${process.env.NODE_ENV}`);
  });
}

// Exportar para Vercel
module.exports = app;