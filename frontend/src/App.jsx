import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  MousePointer,
  Eye,
  Layers,
  Clock,
  RefreshCw,
  ExternalLink,
  FileCode,
  HelpCircle,
  Sparkles,
  User,
  Monitor
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/_/backend' : 'http://localhost:3001');
const DEMO_URL = import.meta.env.PROD ? '/_/backend/demo/' : 'http://localhost:3001/demo/';
const TRACKER_URL = import.meta.env.PROD ? '/_/backend/tracker/tracker.js' : 'http://localhost:3001/tracker/tracker.js';

const uniquePageUrls = (events) => (
  [...new Set(events.map(event => event.page_url).filter(Boolean))]
);

// Local static fallback data in case of technical issues connecting to backend API
const LOCAL_FALLBACK_SESSIONS = [
  {
    session_id: 'sess-fallback-demo-1',
    total_events: 6,
    page_views: 2,
    clicks: 4,
    first_event: new Date(Date.now() - 12 * 60000).toISOString(),
    last_event: new Date(Date.now() - 1 * 60000).toISOString()
  },
  {
    session_id: 'sess-fallback-demo-2',
    total_events: 1,
    page_views: 1,
    clicks: 0,
    first_event: new Date(Date.now() - 40 * 60000).toISOString(),
    last_event: new Date(Date.now() - 40 * 60000).toISOString()
  }
];

const LOCAL_FALLBACK_EVENTS = [
  { event_type: 'page_view', page_url: 'http://localhost:3001/demo/', timestamp: new Date(Date.now() - 12 * 60000).toISOString(), viewport_width: 1440, viewport_height: 900 },
  { event_type: 'click', page_url: 'http://localhost:3001/demo/', timestamp: new Date(Date.now() - 10 * 60000).toISOString(), click_x: 280, click_y: 480, viewport_width: 1440, viewport_height: 900 },
  { event_type: 'click', page_url: 'http://localhost:3001/demo/', timestamp: new Date(Date.now() - 9 * 60000).toISOString(), click_x: 280, click_y: 480, viewport_width: 1440, viewport_height: 900 },
  { event_type: 'click', page_url: 'http://localhost:3001/demo/', timestamp: new Date(Date.now() - 7 * 60000).toISOString(), click_x: 600, click_y: 480, viewport_width: 1440, viewport_height: 900 },
  { event_type: 'page_view', page_url: 'http://localhost:3001/demo/#cart', timestamp: new Date(Date.now() - 4 * 60000).toISOString(), viewport_width: 1440, viewport_height: 900 },
  { event_type: 'click', page_url: 'http://localhost:3001/demo/', timestamp: new Date(Date.now() - 1 * 60000).toISOString(), click_x: 1150, click_y: 40, viewport_width: 1440, viewport_height: 900 }
];

const LOCAL_FALLBACK_HEATMAP = [
  { session_id: 'sess-fallback-demo-1', click_x: 280, click_y: 480, timestamp: new Date(Date.now() - 10 * 60000).toISOString() },
  { session_id: 'sess-fallback-demo-1', click_x: 280, click_y: 480, timestamp: new Date(Date.now() - 9 * 60000).toISOString() },
  { session_id: 'sess-fallback-demo-1', click_x: 600, click_y: 480, timestamp: new Date(Date.now() - 7 * 60000).toISOString() },
  { session_id: 'sess-fallback-demo-1', click_x: 1150, click_y: 40, timestamp: new Date(Date.now() - 1 * 60000).toISOString() }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [sessionEvents, setSessionEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Heatmap state
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState('');
  const [heatmapClicks, setHeatmapClicks] = useState([]);
  const [loadingHeatmap, setLoadingHeatmap] = useState(false);
  const [showIframe, setShowIframe] = useState(true);

  // Connection and data display states
  const [isTechnicalProblem, setIsTechnicalProblem] = useState(false);
  const [hasRealSessions, setHasRealSessions] = useState(false);

  // Stats derived from sessions
  const stats = useMemo(() => {
    if (!sessions.length) return { totalSessions: 0, totalPageViews: 0, totalClicks: 0, bounceRate: 0 };

    let pageViews = 0;
    let clicks = 0;
    let bounces = 0;

    sessions.forEach(s => {
      pageViews += s.page_views || 0;
      clicks += s.clicks || 0;
      if (s.total_events <= 1) {
        bounces++;
      }
    });

    const bounceRate = Math.round((bounces / sessions.length) * 100);

    return {
      totalSessions: sessions.length,
      totalPageViews: pageViews,
      totalClicks: clicks,
      bounceRate: `${bounceRate}%`
    };
  }, [sessions]);

  // Dynamic Density-Based Click Clustering
  const clusteredClicks = useMemo(() => {
    const clusters = [];
    const radius = 25; // grouping threshold in pixels

    // Filter heatmap clicks: if we have real/original sessions, filter out mock data clicks
    const filteredClicks = heatmapClicks.filter(click => {
      if (isTechnicalProblem) return true;
      if (hasRealSessions) {
        return click.session_id && !click.session_id.startsWith('sess-mock-');
      }
      return true;
    });

    filteredClicks.forEach(click => {
      if (click.click_x === undefined || click.click_y === undefined) return;

      // Find if this click fits in an existing coordinate cluster
      const match = clusters.find(c => {
        const dist = Math.sqrt(
          Math.pow(c.x - click.click_x, 2) +
          Math.pow(c.y - click.click_y, 2)
        );
        return dist <= radius;
      });

      if (match) {
        match.count += 1;
        match.clicks.push(click);
      } else {
        clusters.push({
          x: click.click_x,
          y: click.click_y,
          count: 1,
          clicks: [click]
        });
      }
    });

    return clusters;
  }, [heatmapClicks, hasRealSessions, isTechnicalProblem]);

  // Dynamic colors: Blue (single click) -> Yellow (2-4 clicks) -> Red (5+ clicks)
  const getClusterStyles = (count) => {
    if (count === 1) {
      return {
        color: 'rgba(6, 182, 212, 0.75)', // Cyan / Ice Blue
        shadow: '0 0 12px rgba(6, 182, 212, 0.6)',
        size: 16
      };
    }
    if (count < 5) {
      return {
        color: 'rgba(245, 158, 11, 0.85)', // Amber / Yellow
        shadow: '0 0 16px rgba(245, 158, 11, 0.7)',
        size: 24
      };
    }
    return {
      color: 'rgba(239, 68, 68, 0.95)', // Crimson Red
      shadow: '0 0 24px rgba(239, 68, 68, 0.8)',
      size: 32
    };
  };

  // Load initial data
  const fetchData = async () => {
    setLoadingSessions(true);
    setIsTechnicalProblem(false);

    let rawSessions = [];
    try {
      const res = await fetch(`${API_BASE_URL}/api/events/sessions`);
      if (res.ok) {
        rawSessions = await res.json();
      } else {
        throw new Error('Server returned non-ok status');
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setIsTechnicalProblem(true);
      setSessions(LOCAL_FALLBACK_SESSIONS);
      setPages([DEMO_URL]);
      setSelectedPage(DEMO_URL);
      setLoadingSessions(false);
      return;
    }

    // Filter out backend-seeded mock events if original user data is present
    const originalSessions = rawSessions.filter(s => !s.session_id.startsWith('sess-mock-'));

    if (originalSessions.length > 0) {
      setSessions(originalSessions);
      setHasRealSessions(true);
    } else {
      setSessions(rawSessions); // Show seeded mock sessions because no user data exists yet
      setHasRealSessions(false);
    }
    setLoadingSessions(false);

    try {
      const res = await fetch(`${API_BASE_URL}/api/events/pages`);
      if (res.ok) {
        const rawPages = await res.json();
        let nextPages = rawPages;

        if (originalSessions.length > 0) {
          const sessionEventGroups = await Promise.all(
            originalSessions.map(async (session) => {
              const sessionRes = await fetch(`${API_BASE_URL}/api/events/sessions/${session.session_id}`);
              return sessionRes.ok ? sessionRes.json() : [];
            })
          );

          nextPages = uniquePageUrls(sessionEventGroups.flat());
        }

        setPages(nextPages);
        if (!nextPages.includes(selectedPage)) {
          setSelectedPage(nextPages[0] || '');
        }
      }
    } catch (err) {
      console.error('Error fetching pages:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch session events when a session is selected
  useEffect(() => {
    if (!selectedSessionId) return;

    if (isTechnicalProblem) {
      // Load fallback simulation data on technical error
      if (selectedSessionId.startsWith('sess-fallback-demo-')) {
        setSessionEvents(LOCAL_FALLBACK_EVENTS);
      } else {
        setSessionEvents([]);
      }
      return;
    }

    const fetchSessionEvents = async () => {
      setLoadingEvents(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/events/sessions/${selectedSessionId}`);
        if (res.ok) {
          const data = await res.json();
          setSessionEvents(data);
        }
      } catch (err) {
        console.error('Error fetching session events:', err);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchSessionEvents();
  }, [selectedSessionId, isTechnicalProblem]);

  // Fetch heatmap data when page URL selection changes
  useEffect(() => {
    if (!selectedPage) return;

    if (isTechnicalProblem) {
      setHeatmapClicks(LOCAL_FALLBACK_HEATMAP);
      return;
    }

    const fetchHeatmapData = async () => {
      setLoadingHeatmap(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/events/heatmap?page_url=${encodeURIComponent(selectedPage)}`);
        if (res.ok) {
          const data = await res.json();
          setHeatmapClicks(data);
        }
      } catch (err) {
        console.error('Error fetching heatmap data:', err);
      } finally {
        setLoadingHeatmap(false);
      }
    };

    fetchHeatmapData();
  }, [selectedPage, isTechnicalProblem]);

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ' + date.toLocaleDateString();
  };

  // Duration helper
  const getSessionDuration = (first, last) => {
    if (!first || !last) return '0s';
    const diffMs = new Date(last) - new Date(first);
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `${diffSec}s`;
    const diffMin = Math.floor(diffSec / 60);
    return `${diffMin}m ${diffSec % 60}s`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Navigation */}
      <header className="glass-panel" style={{
        margin: '1.5rem 1.5rem 0',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 50,
        borderRadius: '0px' // sharp corner
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary), #a5b4fc)',
            padding: '0.5rem',
            borderRadius: '0px', // sharp corner
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)'
          }}>
            <Activity size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.025em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              AURA <span style={{ color: 'var(--primary)' }}>ANALYTICS</span>
            </h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Realtime Behavior Tracking</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {['overview', 'sessions', 'heatmap'].map((tab) => {
            const isActive = activeTab === tab;
            const labels = {
              overview: { text: 'Overview', icon: <Sparkles size={16} /> },
              sessions: { text: 'Sessions Explorer', icon: <User size={16} /> },
              heatmap: { text: 'Click Heatmap', icon: <Layers size={16} /> }
            };
            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  if (tab === 'sessions' && !selectedSessionId && sessions.length > 0) {
                    setSelectedSessionId(sessions[0].session_id);
                  }
                }}
                style={{
                  background: isActive ? 'var(--primary)' : 'transparent',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  border: 'none',
                  padding: '0.6rem 1.25rem',
                  borderRadius: '0px', // sharp corner
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {labels[tab].icon} {labels[tab].text}
              </button>
            );
          })}
        </div>

        <button
          onClick={fetchData}
          disabled={loadingSessions}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            padding: '0.5rem 1rem',
            borderRadius: '0px', // sharp corner
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s'
          }}
        >
          <RefreshCw size={14} className={loadingSessions ? 'spin' : ''} style={{ animation: loadingSessions ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Banner: Technical Fallback (connection error) */}
        {isTechnicalProblem && (
          <div style={{
            backgroundColor: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid var(--accent)',
            color: '#fda4af',
            padding: '0.85rem 1.25rem',
            borderRadius: '0px',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <span style={{ fontWeight: 800 }}>⚠️ CONNECTION PROBLEM:</span>
            Backend unreachable. Displaying local simulated sandbox events for demonstration purposes.
          </div>
        )}

        {/* Banner: Seeded Mock Data Notice (active connection, but no original user data recorded yet) */}
        {!isTechnicalProblem && !hasRealSessions && sessions.length > 0 && (
          <div style={{
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid #d97706',
            color: '#fde047',
            padding: '0.85rem 1.25rem',
            borderRadius: '0px',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <span style={{ fontWeight: 800 }}>ℹ️ SEEDED DEMO DATA:</span>
            Showing pre-populated click patterns. Open the Interactive Sandbox Store and click elements to generate your own original data.
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
              <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', borderRadius: '0px' }}>
                <div style={{ backgroundColor: 'var(--primary-glow)', padding: '1rem', borderRadius: '0px' }}>
                  <User size={28} color="var(--primary)" />
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Unique Sessions</p>
                  <h3 style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.totalSessions}</h3>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', borderRadius: '0px' }}>
                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '0px' }}>
                  <Eye size={28} color="var(--secondary)" />
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Total Page Views</p>
                  <h3 style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.totalPageViews}</h3>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', borderRadius: '0px' }}>
                <div style={{ backgroundColor: 'rgba(244, 63, 94, 0.1)', padding: '1rem', borderRadius: '0px' }}>
                  <MousePointer size={28} color="var(--accent)" />
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Total Click Events</p>
                  <h3 style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.totalClicks}</h3>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', borderRadius: '0px' }}>
                <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '0px' }}>
                  <Clock size={28} color="#fff" />
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Bounce Rate</p>
                  <h3 style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.bounceRate}</h3>
                </div>
              </div>
            </div>

            {/* Quick Actions & Demo Card */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>

              {/* Demo Quickstart */}
              <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', borderRadius: '0px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <span style={{ backgroundColor: 'var(--secondary)', width: '8px', height: '8px' }}></span>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Interactive Test Sandbox</h3>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.25rem' }}>
                    We have launched a local database backend. Open the store in a new tab, generate clicks and visits, and see live session records instantly compiled here.
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <a
                      href={DEMO_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        backgroundColor: 'var(--primary)',
                        color: 'white',
                        textDecoration: 'none',
                        padding: '0.65rem 1.25rem',
                        borderRadius: '0px', // sharp corner
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 4px 12px var(--primary-glow)',
                        transition: 'transform 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      Open Demo Store <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              </div>

              {/* Script Integration */}
              <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderRadius: '0px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileCode size={20} color="var(--primary)" />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Integration Script</h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  Inject this HTML code block to any website to capture views, sessions, and click coordinate parameters automatically.
                </p>
                <div style={{
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  padding: '1rem',
                  borderRadius: '0px', // sharp corner
                  border: '1px solid var(--border-color)',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  color: '#34d399',
                  overflowX: 'auto',
                  whiteSpace: 'pre'
                }}>
                  {`<script 
  src="${TRACKER_URL}" 
  data-api-url="${API_BASE_URL}">
</script>`}
                </div>
              </div>

            </div>

            {/* Recent Sessions list inside Overview */}
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '0px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Recent Activity Sessions</h3>
                <button
                  onClick={() => { setActiveTab('sessions'); if (sessions.length > 0) setSelectedSessionId(sessions[0].session_id); }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
                >
                  View All Sessions →
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Session ID</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Total Events</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Page Views</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Clicks</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Start Time</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.slice(0, 5).map((s) => (
                      <tr
                        key={s.session_id}
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.9rem', cursor: 'pointer' }}
                        onClick={() => { setSelectedSessionId(s.session_id); setActiveTab('sessions'); }}
                      >
                        <td style={{ padding: '1rem', fontFamily: 'monospace', color: 'var(--primary)' }}>
                          {s.session_id.substring(0, 18)}...
                        </td>
                        <td style={{ padding: '1rem', fontWeight: 600 }}>{s.total_events}</td>
                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{s.page_views}</td>
                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{s.clicks}</td>
                        <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{formatDate(s.first_event)}</td>
                        <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{getSessionDuration(s.first_event, s.last_event)}</td>
                      </tr>
                    ))}
                    {sessions.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                          No sessions recorded yet. Click in the Demo Store to generate events!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: SESSIONS EXPLORER */}
        {activeTab === 'sessions' && (
          <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '1.5rem', flex: 1, minHeight: '600px' }}>

            {/* Left Column: Sessions List */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '700px', borderRadius: '0px' }}>
              <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Sessions ({sessions.length})</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Click a session to inspect user journey</p>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
                {loadingSessions ? (
                  <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading sessions...</p>
                ) : (
                  sessions.map((session) => (
                    <div
                      key={session.session_id}
                      onClick={() => setSelectedSessionId(session.session_id)}
                      style={{
                        padding: '1rem',
                        borderRadius: '0px', // sharp corner
                        marginBottom: '0.5rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: selectedSessionId === session.session_id ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                        border: selectedSessionId === session.session_id ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                      }}
                      onMouseOver={(e) => {
                        if (selectedSessionId !== session.session_id) {
                          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (selectedSessionId !== session.session_id) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontSize: '0.85rem',
                          color: selectedSessionId === session.session_id ? 'white' : 'var(--text-secondary)',
                          fontWeight: selectedSessionId === session.session_id ? 'bold' : 'normal'
                        }}>
                          {session.session_id.substring(0, 16)}...
                        </span>
                        <span style={{
                          backgroundColor: 'rgba(255,255,255,0.06)',
                          padding: '0.15rem 0.4rem',
                          borderRadius: '0px', // sharp corner
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}>
                          {session.total_events} ev
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Eye size={10} /> {session.page_views} | <MousePointer size={10} /> {session.clicks}
                        </span>
                        <span>
                          {getSessionDuration(session.first_event, session.last_event)}
                        </span>
                      </div>
                    </div>
                  ))
                )}

                {sessions.length === 0 && !loadingSessions && (
                  <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No sessions found.</p>
                )}
              </div>
            </div>

            {/* Right Column: Ordered Events (Journey) */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '700px', borderRadius: '0px' }}>
              <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>User Journey Timeline</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {selectedSessionId ? `Session: ${selectedSessionId}` : 'Select a session from the list'}
                  </p>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
                {loadingEvents ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '4rem' }}>Loading user journey events...</p>
                ) : selectedSessionId ? (
                  <div style={{ position: 'relative', paddingLeft: '1.5rem', borderLeft: '2px solid rgba(255, 255, 255, 0.05)' }}>
                    {sessionEvents.map((event, idx) => (
                      <div
                        key={event._id || idx}
                        className="animate-fade-in"
                        style={{
                          position: 'relative',
                          marginBottom: '2rem',
                          animationDelay: `${idx * 0.05}s`
                        }}
                      >
                        {/* Timeline Connector Dot (Keep circular to show timeline node structure) */}
                        <div style={{
                          position: 'absolute',
                          left: '-29px',
                          top: '6px',
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: event.event_type === 'page_view' ? 'var(--secondary)' : 'var(--accent)',
                          border: '3px solid var(--bg-main)',
                          boxShadow: `0 0 10px ${event.event_type === 'page_view' ? 'var(--secondary-glow)' : 'var(--accent-glow)'}`
                        }}></div>

                        {/* Event Card */}
                        <div style={{
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '0px', // sharp corner
                          padding: '1rem 1.25rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start'
                        }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{
                                textTransform: 'uppercase',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                color: event.event_type === 'page_view' ? 'var(--secondary)' : 'var(--accent)'
                              }}>
                                {event.event_type}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {formatDate(event.timestamp)}
                              </span>
                            </div>

                            <div style={{ fontSize: '0.9rem', fontWeight: 500, wordBreak: 'break-all' }}>
                              {event.page_url}
                            </div>

                            {event.event_type === 'click' && (
                              <div style={{
                                fontSize: '0.8rem',
                                color: 'var(--text-secondary)',
                                backgroundColor: 'rgba(255,255,255,0.03)',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '0px', // sharp corner
                                display: 'inline-block',
                                marginTop: '0.25rem'
                              }}>
                                Click Position: <strong>X: {event.click_x}px, Y: {event.click_y}px</strong>
                                {event.viewport_width && ` (Screen: ${event.viewport_width}x${event.viewport_height})`}
                              </div>
                            )}
                          </div>

                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Monitor size={12} /> {event.viewport_width ? `${event.viewport_width}px` : 'Desktop'}
                          </div>
                        </div>
                      </div>
                    ))}

                    {sessionEvents.length === 0 && (
                      <p style={{ color: 'var(--text-muted)' }}>No events recorded for this session.</p>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: '1rem' }}>
                    <HelpCircle size={48} strokeWidth={1.5} />
                    <p>Select a session on the left to review its event stream timeline.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: CLICK HEATMAP */}
        {activeTab === 'heatmap' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>

            {/* Heatmap Controls Panel */}
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', justifyContent: 'space-between', borderRadius: '0px' }}>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
                {/* Select Page Dropdown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>TARGET PAGE URL</label>
                  <select
                    value={selectedPage}
                    onChange={(e) => setSelectedPage(e.target.value)}
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      color: 'white',
                      border: '1px solid var(--border-color)',
                      padding: '0.5rem 1rem',
                      borderRadius: '0px', // sharp corner
                      outline: 'none',
                      minWidth: '280px',
                      cursor: 'pointer'
                    }}
                  >
                    {pages.map((url) => (
                      <option key={url} value={url}>{url}</option>
                    ))}
                    {pages.length === 0 && (
                      <option value="">No tracked pages found</option>
                    )}
                  </select>
                </div>

                {/* Heatmap Legend */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>DENSITY SCALE</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: 'rgba(0,0,0,0.2)', padding: '0.45rem 0.75rem', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'rgba(6, 182, 212, 0.9)' }}></span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Low (1 click)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.9)' }}></span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Medium (2-4 clicks)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.95)' }}></span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>High (5+ clicks)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={showIframe}
                    onChange={(e) => setShowIframe(e.target.checked)}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  Show Webpage Background
                </label>

                <div style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '0px', // sharp corner
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)'
                }}>
                  Raw Click Events: <strong style={{ color: 'white' }}>{heatmapClicks.length}</strong>
                </div>

                <div style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '0px', // sharp corner
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)'
                }}>
                  Clustered Hotspots: <strong style={{ color: 'white' }}>{clusteredClicks.length}</strong>
                </div>
              </div>

            </div>

            {/* Canvas / Webpage Iframe Visualizer */}
            <div className="glass-panel" style={{
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
              overflow: 'hidden',
              borderRadius: '0px' // sharp corner
            }}>
              {loadingHeatmap ? (
                <div style={{ padding: '6rem', color: 'var(--text-muted)' }}>Loading Click Coordinates...</div>
              ) : selectedPage ? (
                <div style={{
                  width: '100%',
                  overflow: 'auto',
                  maxHeight: '750px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0px', // sharp corner
                  background: showIframe ? '#0b0f19' : 'rgba(0,0,0,0.5)',
                  position: 'relative'
                }}>
                  {/* Fixed 1440px wide canvas matches desktop layouts and ensures dots align perfectly */}
                  <div style={{
                    width: '1440px',
                    height: '1100px', // matches expected height of demo page
                    position: 'relative',
                    margin: '0 auto'
                  }}>
                    {/* Background webpage Iframe */}
                    {showIframe && (
                      <iframe
                        src={`${selectedPage}?notrack=true`} // disable tracker in preview
                        title="Heatmap Background View"
                        style={{
                          width: '100%',
                          height: '100%',
                          border: 'none',
                          pointerEvents: 'none', // disable click/focus inside iframe so we hover dots easily
                          backgroundColor: '#0b0f19'
                        }}
                      />
                    )}

                    {/* Clicks Overlay Container */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      pointerEvents: 'none' // allow scroll through but enable individual dot hover
                    }}>
                      {clusteredClicks.map((cluster, idx) => {
                        const styleConfig = getClusterStyles(cluster.count);
                        return (
                          <div
                            key={idx}
                            style={{
                              position: 'absolute',
                              left: `${cluster.x}px`,
                              top: `${cluster.y}px`,
                              width: `${styleConfig.size}px`,
                              height: `${styleConfig.size}px`,
                              borderRadius: '50%', // Keep dots circular
                              backgroundColor: styleConfig.color,
                              boxShadow: styleConfig.shadow,
                              transform: 'translate(-50%, -50%)',
                              pointerEvents: 'auto', // enable pointer events so tooltip works
                              cursor: 'help',
                              transition: 'all 0.15s ease-out',
                              zIndex: 10
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.3)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
                            }}
                            title={`Hotspot Center: (${cluster.x}px, ${cluster.y}px)\nTotal Clicks: ${cluster.count}\nClicks in cluster: ${cluster.clicks.map(c => formatDate(c.timestamp)).join('\n')}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '6rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  <p>No tracked page URL selected or available.</p>
                  <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Open the demo store in a separate tab, generate some click activity, and hit Refresh!</p>
                </div>
              )}
            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer style={{
        padding: '1.5rem',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        borderTop: '1px solid var(--border-color)',
        marginTop: 'auto'
      }}>
        <p>&copy; 2026 Aura Analytics Dashboard. Elegant User Analytics Suite.</p>
      </footer>
    </div>
  );
}
