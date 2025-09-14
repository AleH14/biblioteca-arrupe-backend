require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const app = express();

// Conectar a la base de datos
connectDB();

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

module.exports = app;
