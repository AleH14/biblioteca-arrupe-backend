require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const auth = require('../modules/auth');
const libros = require('../modules/libros');
const prestamos = require('../modules/prestamos');
const usuarios = require('../modules/usuarios');
const estadisticas = require('../modules/estadisticas');
const requestLogger = require("../core/middlewares/requestLogger.middleware");
const logger = require("../core/utils/logger");

// Configuración de CORS
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://0.0.0.0:3000',
    'http://frontend:3000',
    // Para desarrollo en Docker
    /^http:\/\/.*:3000$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(requestLogger); 


// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Test CORS endpoint
app.get('/api/test-cors', (req, res) => {
  res.status(200).json({
    message: 'CORS está funcionando correctamente',
    origin: req.headers.origin,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Montar rutas
app.use('/api/auth', auth.routes);
app.use('/api/libros', libros.routes);
app.use('/api/prestamos', prestamos.routes);
app.use('/api/usuarios', usuarios.routes);
app.use('/api/estadisticas', estadisticas.routes);

// Middleware global de manejo de errores
app.use((err, req, res, next) => {
  logger.error(`${req.method} ${req.originalUrl} - ${err.message}`, { stack: err.stack });
  res.status(err.status || 500).json({
    status: err.status || 500,
    message: err.message || 'Error del servidor',
    timestamp: new Date().toISOString()
  });
});


module.exports = app;
