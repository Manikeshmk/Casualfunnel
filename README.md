# 🌌 Aura Analytics — User Tracking & Insights Suite

<div align="center">
  <img src="https://img.shields.io/badge/Aura%20Analytics-v1.0.0-6366f1?style=for-the-badge&logo=analytics&logoColor=white" alt="Version" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
  <img src="https://img.shields.io/badge/Platform-Fullstack-orange?style=for-the-badge" alt="Platform" />
  <br /><br />
  <p>🚀 <strong>A sleek, lightweight, full-stack user analytics tracking system and interactive dashboard.</strong> Aura Analytics captures real-time visitor sessions and click coordinates, rendering density-based heatmaps and event timeline journeys.</p>
</div>

---

## 🛠️ Tech Stack & Power Grid

<div align="center">
  <table>
    <tr>
      <td align="center" width="120">
        <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/react/react-original.svg" width="60" height="60" alt="React" />
        <br /><strong>React</strong>
      </td>
      <td align="center" width="120">
        <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/vitejs/vitejs-original.svg" width="60" height="60" alt="Vite" />
        <br /><strong>Vite</strong>
      </td>
      <td align="center" width="120">
        <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/javascript/javascript-original.svg" width="60" height="60" alt="JavaScript" />
        <br /><strong>JavaScript</strong>
      </td>
      <td align="center" width="120">
        <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/css3/css3-original.svg" width="60" height="60" alt="CSS3" />
        <br /><strong>CSS3</strong>
      </td>
    </tr>
    <tr>
      <td align="center" width="120">
        <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/nodejs/nodejs-original.svg" width="60" height="60" alt="Node.js" />
        <br /><strong>Node.js</strong>
      </td>
      <td align="center" width="120">
        <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/express/express-original.svg" width="60" height="60" alt="Express" style="background-color: white; padding: 5px; border-radius: 4px;" />
        <br /><strong>Express</strong>
      </td>
      <td align="center" width="120">
        <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/mongodb/mongodb-original.svg" width="60" height="60" alt="MongoDB" />
        <br /><strong>MongoDB</strong>
      </td>
      <td align="center" width="120">
        <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/vercel/vercel-original.svg" width="60" height="60" alt="Vercel" style="background-color: white; padding: 5px; border-radius: 4px;" />
        <br /><strong>Vercel</strong>
      </td>
    </tr>
  </table>
</div>

---

## ⚡ Key Capabilities

* **🌐 Autonomous JS Tracker:** A zero-dependency, non-intrusive `tracker.js` payload that auto-initializes to map exact, scroll-resistant viewport click matrices and page views.
* **📊 Dark Glassmorphic Dashboard:** Immersive, telemetry-grade telemetry panel tracking live bounce rates, session lifecycles, and rich event-stream journeys.
* **🔥 Algorithmic Coordinate Heatmaps:** Dynamic density clustering engine mapping click frequencies straight into color bands:
  
  | Click Threshold | Visual Spectrum | Hotspot Intensity |
  | :--- | :--- | :--- |
  | `1 Click` | 🟦 Cyan / Blue | Initial Interaction |
  | `2–4 Clicks` | 🟧 Orange / Yellow | Medium Engagement |
  | `5+ Clicks` | 🟥 Crimson Red | Critical Hotspot |

* **💾 Dual-Mode Storage Adapter:** Zero-configuration resilience. On MongoDB failure or absence, the architecture swaps seamlessly to an atomic local JSON engine (`backend/data/events.json`).

---

## 📁 Repository Blueprint

```yaml
CasualFunnel/
├── backend/
│   ├── data/
│   │   └── events.json        # Atomic JSON fallback engine (git-ignored)
│   ├── src/
│   │   ├── controllers/       # Execution & business logic
│   │   ├── models/            # Document structures & Mongoose definitions
│   │   ├── routes/            # Live API endpoints
│   │   ├── app.js             # Service instantiation & middleware pipeline
│   │   ├── dbAdapter.js       # Strategic MongoDB / Local File router
│   │   └── localDb.js         # Embedded transactional database framework
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Core dashboard layout, grid state & UI
│   │   ├── index.css          # Core design tokens & glassmorphic system variables
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── tracker/
│   └── tracker.js             # Autonomous client telemetry injection
├── demo/
│   └── index.html             # High-fidelity sandbox demo store
├── .gitignore                 # Exclusion configuration matrix
├── README.md                  # System overview & documentation
└── DEPLOYMENT_VERCEL.md       # Edge network distribution blueprint
```

---

## 💻 Local Quick Start & Installation

Follow these explicit setup blocks to mirror the production engine directly onto your local environment.

### 1. Prerequisites
Ensure your machine meets the minimum version constraints:
* **Node.js** $\ge$ `v18.0.0`
* **npm** $\ge$ `v9.0.0`

> 💡 **Note:** MongoDB configuration is optional. The application safely fallbacks to the isolated flat filesystem storage model natively.

### 2. Environment Provisioning

Execute the following sequential operations inside your terminal to copy the workspace structure and fetch vendor modules:

```bash
# 1. Duplicate the remote codebase repository
git clone https://github.com/Manikeshmk/Casualfunnel
cd CasualFunnel

# 2. Setup the backend API daemon dependency stack
cd backend
npm install

# 3. Setup the client-facing UI dependency stack
cd ../frontend
npm install
```

### 3. Activating the Project Services

Spin up the localized clusters simultaneously using independent terminal panes:

**Run the Backend Engine (Operational on Port `3001`):**
```bash
cd backend
npm start
```
*The engine initializes dynamic mock events down into the local architecture on boot to guarantee immediate visual population.*

**Run the Frontend Dashboard Interface (Operational on Port `3000`):**
```bash
cd frontend
npm run dev
```

### 4. Interactive Sandbox Verification

1. Navigate to the tracking dashboard layout at `http://localhost:3000`
2. Spin up the targeted test container sandbox storefront tracking range at `http://localhost:3001/demo/`
3. Generate localized click paths, scroll triggers, and navigation changes on the storefront page. Return back to the principal metrics center dashboard, hit **Refresh** from the top right, and check your live absolute telemetry mapping change instantly.
```
