const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, '../data/events.json');

// Ensure data directory exists
const dir = path.dirname(FILE_PATH);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Ensure events file exists
if (!fs.existsSync(FILE_PATH)) {
  fs.writeFileSync(FILE_PATH, JSON.stringify([], null, 2), 'utf-8');
}

function readEvents() {
  try {
    const raw = fs.readFileSync(FILE_PATH, 'utf-8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.error('Error reading local db file:', err);
    return [];
  }
}

function writeEvents(events) {
  try {
    fs.writeFileSync(FILE_PATH, JSON.stringify(events, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to local db file:', err);
  }
}

const localDb = {
  // Store single or multiple events
  insert: async (data) => {
    const events = readEvents();
    const toInsert = Array.isArray(data) ? data : [data];
    const timestamped = toInsert.map(item => ({
      _id: 'local_' + Math.random().toString(36).substring(2, 11),
      timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
      ...item
    }));
    
    events.push(...timestamped);
    writeEvents(events);
    return Array.isArray(data) ? timestamped : timestamped[0];
  },

  // Get unique sessions list with counts
  getSessions: async () => {
    const events = readEvents();
    const sessionsMap = {};
    
    events.forEach(event => {
      const sessId = event.session_id;
      if (!sessId) return;
      
      const t = new Date(event.timestamp);
      
      if (!sessionsMap[sessId]) {
        sessionsMap[sessId] = {
          session_id: sessId,
          total_events: 0,
          page_views: 0,
          clicks: 0,
          first_event: t,
          last_event: t
        };
      }
      
      const s = sessionsMap[sessId];
      s.total_events += 1;
      if (event.event_type === 'page_view') s.page_views += 1;
      if (event.event_type === 'click') s.clicks += 1;
      
      if (t < new Date(s.first_event)) s.first_event = t;
      if (t > new Date(s.last_event)) s.last_event = t;
    });
    
    // Convert map to array and sort by last_event desc
    return Object.values(sessionsMap).sort((a, b) => new Date(b.last_event) - new Date(a.last_event));
  },

  // Get events for a specific session sorted by timestamp
  getSessionEvents: async (sessionId) => {
    const events = readEvents();
    return events
      .filter(e => e.session_id === sessionId)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  },

  // Get click coordinates for a specific page URL
  getHeatmapData: async (pageUrl) => {
    const events = readEvents();
    return events
      .filter(e => e.page_url === pageUrl && e.event_type === 'click')
      .map(e => ({
        _id: e._id,
        session_id: e.session_id,
        click_x: e.click_x,
        click_y: e.click_y,
        viewport_width: e.viewport_width,
        viewport_height: e.viewport_height,
        timestamp: e.timestamp
      }));
  },

  // Get distinct list of tracked pages
  getTrackedPages: async () => {
    const events = readEvents();
    const pages = new Set();
    events.forEach(e => {
      if (e.page_url) pages.add(e.page_url);
    });
    return Array.from(pages);
  },

  countDocuments: async () => {
    return readEvents().length;
  }
};

module.exports = localDb;
