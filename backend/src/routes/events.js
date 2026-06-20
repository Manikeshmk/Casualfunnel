const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');

// Route for recording events
router.post('/', eventController.createEvent);

// Route for listing all sessions
router.get('/sessions', eventController.getSessions);

// Route for getting a single session's events
router.get('/sessions/:session_id', eventController.getSessionEvents);

// Route for heatmap click coordinates
router.get('/heatmap', eventController.getHeatmapData);

// Route for unique pages tracked
router.get('/pages', eventController.getTrackedPages);

module.exports = router;
