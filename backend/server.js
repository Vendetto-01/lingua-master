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

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Lingua Master API is running!',
    version: '1.0.0'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api', apiRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Lingua Master Backend running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
});