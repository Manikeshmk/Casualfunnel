const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const eventRoutes = require('./routes/events');
const dbAdapter = require('./dbAdapter');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve tracking script static folder
app.use('/tracker', express.static(path.join(__dirname, '../../tracker')));

// Serve demo page
app.use('/demo', express.static(path.join(__dirname, '../../demo')));

// API Routes
app.use('/api/events', eventRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'User Analytics Backend is running',
    database: dbAdapter.isUsingMongo()
      ? 'MongoDB'
      : (process.env.VERCEL ? 'In-memory fallback' : 'Local JSON File')
  });
});

// Initialize database connection and start server
const startServer = async () => {
  // Connect to DB (Mongo or Local fallback)
  await dbAdapter.connectDB();
  
  // Seed mock data if database is empty
  const demoUrl = process.env.VERCEL
    ? `https://${process.env.VERCEL_URL}/_/backend/demo/`
    : `http://localhost:${PORT}/demo`;
  await dbAdapter.seedMockData(demoUrl);

  // Start Express Server only when not running on Vercel serverless
  if (!process.env.VERCEL) {
    app.listen(PORT, () => {
      console.log(`==================================================`);
      console.log(`🚀 Backend Server running on http://localhost:${PORT}`);
      console.log(`📦 Storage Engine: ${dbAdapter.isUsingMongo() ? 'MongoDB' : 'Local JSON file (data/events.json)'}`);
      console.log(`🔗 Demo Page: http://localhost:${PORT}/demo`);
      console.log(`🔗 Tracker Script: http://localhost:${PORT}/tracker/tracker.js`);
      console.log(`==================================================`);
    });
  }
};

startServer().catch(err => {
  console.error('Failed to start server:', err);
});

module.exports = app;
