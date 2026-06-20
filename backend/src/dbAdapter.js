const mongoose = require('mongoose');
const Event = require('./models/Event');
const localDb = require('./localDb');

let useMongo = false;

// Attempt to connect to MongoDB
const connectDB = async () => {
  const mode = process.env.DB_MODE || 'auto';
  const mongoUri = process.env.MONGODB_URI;

  if (mode === 'local') {
    console.log('Database Mode set to LOCAL. Using local JSON database (data/events.json).');
    useMongo = false;
    return;
  }

  if (!mongoUri) {
    console.log('No MONGODB_URI found in env. Falling back to local JSON database.');
    useMongo = false;
    return;
  }

  try {
    console.log('Connecting to MongoDB...');
    // Timeout quickly if Mongo is not running
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log('Successfully connected to MongoDB.');
    useMongo = true;
  } catch (error) {
    console.warn('MongoDB connection failed. Falling back to local JSON database.');
    console.warn(`Reason: ${error.message}`);
    useMongo = false;
  }
};

const dbAdapter = {
  connectDB,
  
  isUsingMongo: () => useMongo,

  // Store events
  createEvent: async (data) => {
    if (useMongo) {
      if (Array.isArray(data)) {
        return await Event.insertMany(data);
      } else {
        const newEvent = new Event(data);
        return await newEvent.save();
      }
    } else {
      return await localDb.insert(data);
    }
  },

  // Fetch unique sessions with total events, page_views, clicks, start/end times
  getSessions: async () => {
    if (useMongo) {
      return await Event.aggregate([
        {
          $group: {
            _id: "$session_id",
            total_events: { $sum: 1 },
            page_views: {
              $sum: { $cond: [{ $eq: ["$event_type", "page_view"] }, 1, 0] }
            },
            clicks: {
              $sum: { $cond: [{ $eq: ["$event_type", "click"] }, 1, 0] }
            },
            first_event: { $min: "$timestamp" },
            last_event: { $max: "$timestamp" }
          }
        },
        {
          $project: {
            session_id: "$_id",
            total_events: 1,
            page_views: 1,
            clicks: 1,
            first_event: 1,
            last_event: 1,
            _id: 0
          }
        },
        { $sort: { last_event: -1 } }
      ]);
    } else {
      return await localDb.getSessions();
    }
  },

  // Fetch all events for a specific session ordered by timestamp
  getSessionEvents: async (sessionId) => {
    if (useMongo) {
      return await Event.find({ session_id: sessionId }).sort({ timestamp: 1 });
    } else {
      return await localDb.getSessionEvents(sessionId);
    }
  },

  // Fetch click data for a specific page URL
  getHeatmapData: async (pageUrl) => {
    if (useMongo) {
      return await Event.find({ 
        page_url: pageUrl, 
        event_type: 'click' 
      }).select('session_id click_x click_y viewport_width viewport_height timestamp');
    } else {
      return await localDb.getHeatmapData(pageUrl);
    }
  },

  // Fetch distinct list of tracked pages
  getTrackedPages: async () => {
    if (useMongo) {
      return await Event.distinct('page_url');
    } else {
      return await localDb.getTrackedPages();
    }
  },

  // Seed mock data if database is empty
  seedMockData: async (demoUrl) => {
    try {
      const count = useMongo ? await Event.countDocuments() : await localDb.countDocuments();
      if (count > 0) {
        console.log(`Database already has ${count} events. Skipping mock seeding.`);
        return;
      }

      console.log('Seeding mock event data...');
      const now = new Date();
      const events = [];
      
      const genSessId = (num) => `sess-mock-${num}-${Math.random().toString(36).substring(2, 8)}`;
      
      // Seed several realistic user journeys
      const s1 = genSessId('buyer');
      events.push(
        { session_id: s1, event_type: 'page_view', page_url: demoUrl, timestamp: new Date(now - 15 * 60000), viewport_width: 1440, viewport_height: 900 },
        { session_id: s1, event_type: 'click', page_url: demoUrl, timestamp: new Date(now - 14 * 60000), click_x: 280, click_y: 480, viewport_width: 1440, viewport_height: 900 }, // click product 1
        { session_id: s1, event_type: 'click', page_url: demoUrl, timestamp: new Date(now - 12 * 60000), click_x: 600, click_y: 480, viewport_width: 1440, viewport_height: 900 }, // click product 2
        { session_id: s1, event_type: 'click', page_url: demoUrl, timestamp: new Date(now - 9 * 60000), click_x: 1150, click_y: 40, viewport_width: 1440, viewport_height: 900 }   // click cart button
      );

      const s2 = genSessId('bounce');
      events.push(
        { session_id: s2, event_type: 'page_view', page_url: demoUrl, timestamp: new Date(now - 30 * 60000), viewport_width: 1920, viewport_height: 1080 }
      );

      // Concentration of clicks around critical hotspots to demo density heatmap
      const clickTargets = [
        { x: 280, y: 480, label: 'headphones_card' },
        { x: 600, y: 480, label: 'watch_card' },
        { x: 920, y: 480, label: 'stand_card' },
        { x: 1150, y: 40, label: 'cart_btn' },
        { x: 600, y: 220, label: 'hero_cta' }
      ];

      // Add clustered clicks to show density coloring
      for (let i = 0; i < 60; i++) {
        const target = clickTargets[Math.floor(Math.random() * clickTargets.length)];
        
        // Generate high concentration on some elements vs others
        let countMultiplier = 1;
        if (target.label === 'headphones_card') countMultiplier = 15; // super hot
        if (target.label === 'hero_cta') countMultiplier = 10;          // warm
        if (target.label === 'cart_btn') countMultiplier = 8;          // warm
        if (target.label === 'watch_card') countMultiplier = 5;         // medium
        if (target.label === 'stand_card') countMultiplier = 2;         // cold (1-2 clicks)

        // Randomly skip to model target weights
        if (Math.random() * 15 > countMultiplier) continue;

        // Small coordinate offset
        const click_x = target.x + Math.round((Math.random() - 0.5) * 40);
        const click_y = target.y + Math.round((Math.random() - 0.5) * 20);
        const sessId = genSessId('heatmap');

        events.push(
          { session_id: sessId, event_type: 'page_view', page_url: demoUrl, timestamp: new Date(now - Math.random() * 120 * 60000), viewport_width: 1440, viewport_height: 900 },
          { session_id: sessId, event_type: 'click', page_url: demoUrl, timestamp: new Date(now - Math.random() * 119 * 60000), click_x, click_y, viewport_width: 1440, viewport_height: 900 }
        );
      }

      if (useMongo) {
        await Event.insertMany(events);
      } else {
        await localDb.insert(events);
      }
      
      console.log(`Mock seeding complete. Inserted ${events.length} events into ${useMongo ? 'MongoDB' : 'Local JSON file'}.`);
    } catch (error) {
      console.error('Error seeding mock data:', error);
    }
  }
};

module.exports = dbAdapter;
