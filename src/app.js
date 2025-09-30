require('dotenv').config();
const express = require('express');
const app = express();
const authRoutes = require('./routes/auth');


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

// Your other routes here...

// Montar rutas
app.use('/api/auth', authRoutes);

module.exports = app;
