const dbAdapter = require('../dbAdapter');

// Store a new event (supports single or array of events)
exports.createEvent = async (req, res) => {
  try {
    const data = req.body;
    const saved = await dbAdapter.createEvent(data);
    return res.status(201).json(saved);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(400).json({ error: error.message });
  }
};

// Fetch a list of unique sessions with event counts and start/end times
exports.getSessions = async (req, res) => {
  try {
    const sessions = await dbAdapter.getSessions();
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: error.message });
  }
};

// Fetch all events for a specific session ordered by timestamp
exports.getSessionEvents = async (req, res) => {
  try {
    const { session_id } = req.params;
    const events = await dbAdapter.getSessionEvents(session_id);
    res.json(events);
  } catch (error) {
    console.error('Error fetching session events:', error);
    res.status(500).json({ error: error.message });
  }
};

// Fetch click data for a page url
exports.getHeatmapData = async (req, res) => {
  try {
    const { page_url } = req.query;
    if (!page_url) {
      return res.status(400).json({ error: 'page_url query parameter is required' });
    }
    const clicks = await dbAdapter.getHeatmapData(page_url);
    res.json(clicks);
  } catch (error) {
    console.error('Error fetching heatmap data:', error);
    res.status(500).json({ error: error.message });
  }
};

// Fetch unique page URLs that have tracking data
exports.getTrackedPages = async (req, res) => {
  try {
    const pages = await dbAdapter.getTrackedPages();
    res.json(pages);
  } catch (error) {
    console.error('Error fetching tracked pages:', error);
    res.status(500).json({ error: error.message });
  }
};
