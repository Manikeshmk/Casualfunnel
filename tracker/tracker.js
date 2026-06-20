(function () {
  // Don't track if the page is loaded inside an iframe (like the dashboard heatmap viewer)
  if (window.self !== window.top) {
    console.log('Analytics Tracker: Running inside iframe, tracking disabled.');
    return;
  }

  // Get current script config
  const currentScript = document.currentScript;
  const apiUrl = currentScript ? (currentScript.getAttribute('data-api-url') || 'http://localhost:3001') : 'http://localhost:3001';

  // Helper to generate a unique session ID
  function generateUUID() {
    return 'sess-' + Date.now() + '-' + Math.random().toString(36).substring(2, 15);
  }

  // Get or create session ID in localStorage
  function getSessionId() {
    let sessId = localStorage.getItem('causalfunnel_session_id');
    if (!sessId) {
      sessId = generateUUID();
      localStorage.setItem('causalfunnel_session_id', sessId);
    }
    return sessId;
  }

  const sessionId = getSessionId();

  // Send event helper
  function sendEvent(eventType, additionalData = {}) {
    const payload = {
      session_id: sessionId,
      event_type: eventType,
      page_url: window.location.href.split('?')[0].split('#')[0], // Clean URL without queries/hashes
      timestamp: new Date().toISOString(),
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      ...additionalData
    };

    console.log('Analytics Tracker: Sending event', payload);

    // Send event using fetch
    fetch(`${apiUrl}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      keepalive: true // keep request alive if page unloading
    }).catch(err => {
      console.error('Analytics Tracker: Failed to send event', err);
    });
  }

  // Track page_view immediately on load
  if (document.readyState === 'complete') {
    sendEvent('page_view');
  } else {
    window.addEventListener('load', function () {
      sendEvent('page_view');
    });
  }

  // Track clicks globally
  document.addEventListener('click', function (event) {
    // We get pageX and pageY which are absolute coordinates relative to the document,
    // which handles page scrolling.
    const additionalData = {
      click_x: event.pageX,
      click_y: event.pageY
    };
    sendEvent('click', additionalData);
  }, true);

  console.log('Analytics Tracker: Initialized with Session ID:', sessionId);
})();
