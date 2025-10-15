require('dotenv').config();
const express = require('express');
const app = express();
const auth = require('../modules/auth');
const libros = require('../modules/libros');
const prestamos = require('../modules/prestamos');
const requestLogger = require("../core/middlewares/requestLogger.middleware");
const logger = require("../core/utils/logger");

// Middleware
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

// Montar rutas
app.use('/api/auth', auth.routes);
app.use('/api/libros', libros.routes);
app.use('/api/prestamos', prestamos.routes);

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
