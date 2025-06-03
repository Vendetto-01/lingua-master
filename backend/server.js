const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Import routes
const apiRoutes = require('./routes');
const reportRoutes = require('./routes/reports'); // Yeni rapor route'larını import et

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Lingua Master API is running!',
    version: '1.0.0'
  });
});

// Health check endpoint for UptimeRobot
app.get('/health', (req, res) => {
  console.log('🏥 Health check request from:', req.ip);
  
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    message: 'Backend is running'
  });
});

// API routes
app.use('/api', apiRoutes);
app.use('/api/reports', reportRoutes); // Yeni /api/reports route'unu ekle

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Lingua Master Backend running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});