# Aura Analytics - User Tracking & Insights Suite

A sleek, lightweight, full-stack user analytics tracking system and interactive dashboard. Aura Analytics captures real-time visitor sessions and click coordinates, rendering density-based heatmaps and event timeline journeys.

---

## 🚀 Key Features

- **🌐 Lightweight JS Tracker:** A non-intrusive `tracker.js` script that auto-initializes and tracks page views and absolute coordinate clicks (robust to scrolling).
- **📊 Realtime Dashboard:** A dark glassmorphic dashboard showcasing session lists, bounce rates, total clicks, and detailed journey timelines.
- **🔥 Density Heatmap:** An overlay mapping click density. Rather than manual colors, it uses **dynamic coordinate clustering** to show Cyan/Blue (1 click), Orange/Yellow (2-4 clicks), and Crimson Red (5+ clicks) hotspots.
- **💾 Dual-Mode Storage Adapter:** Runs out of the box! If MongoDB is not configured or fails to connect, the system automatically falls back to a **local JSON database file** (`backend/data/events.json`).
- **📐 Minimal Aesthetic:** Sharp 90-degree rectangular corners across all buttons, cards, and panels for a modern, industrial, and clean interface.

---

## 🛠️ Tech Stack

- **Frontend:** React, Vite, Lucide Icons, Vanilla CSS
- **Backend:** Node.js, Express, Mongoose
- **Database:** MongoDB (Production) / Local JSON File (Development Fallback)
- **Tracking Script:** Vanilla JavaScript (Self-Initializing, Iframe-aware)

---

## 💻 Local Quick Start

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)

*Note: MongoDB is optional. If not running, the application will automatically fall back to the local file storage.*

### 2. Setup and Installation

Clone the repository and install dependencies:

```bash
# Clone the repository
git clone <your-repository-url>
cd CasualFunnel

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Running the Application

You can start both servers in separate terminal tabs:

**Start Backend Server (on port 3001):**
```bash
cd backend
npm start
```
*The backend will automatically create mock events on startup so the dashboard is fully pre-populated.*

**Start Frontend Server (on port 3000):**
```bash
cd frontend
npm run dev
```

### 4. Interactive Testing
- Open the **Dashboard**: `http://localhost:3000`
- Open the **Demo Store**: `http://localhost:3001/demo/`
- Click around the demo store (headers, buttons, product cards). Open the dashboard, click **Refresh** at the top right, and see your session, coordinates, and heatmap update in real-time!

---

## 📁 Repository Structure

```
CasualFunnel/
├── backend/
│   ├── data/
│   │   └── events.json        # Local JSON database file (git-ignored)
│   ├── src/
│   │   ├── controllers/       # Route business logic
│   │   ├── models/            # MongoDB schema models
│   │   ├── routes/            # API endpoints
│   │   ├── app.js             # Express startup & config
│   │   ├── dbAdapter.js       # Unified MongoDB / Local File router
│   │   └── localDb.js         # Local database engine
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Core dashboard layout & UI
│   │   ├── index.css          # Styling & minimal design system
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── tracker/
│   └── tracker.js             # Client tracking script
├── demo/
│   └── index.html             # Sandbox e-commerce demo
├── .gitignore                 # Clean repository filter rules
├── README.md                  # Overview documentation
└── DEPLOYMENT_VERCEL.md       # Vercel serverless deployment guide
```

---

## ☁️ Deployment

For deploying the dashboard and analytics backend to Vercel, and configuring hosted database storage, check out the detailed step-by-step instructions in [DEPLOYMENT_VERCEL.md](./DEPLOYMENT_VERCEL.md).
"# Casualfunnel" 
