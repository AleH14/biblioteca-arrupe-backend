require('dotenv').config();
const express = require('express');
const app = express();
const auth = require('../modules/auth');


// Middleware
app.use(express.json());


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

module.exports = app;
