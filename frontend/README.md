# USIF Frontend Subsystem

The USIF frontend is a Single Page Application (SPA) built with React, Vite, React Router, and Chart.js. It provides real-time telemetry metrics, interactive inspection modals for flagged sensor readings, alert management workflows, and an anomaly injection simulator.

---

## File Overview

### Root Configuration (`frontend/`)

- `package.json`: Frontend dependencies including `axios`, `chart.js`, `react`, `react-chartjs-2`, and `react-router-dom`.
- `vite.config.js`: Vite bundling configuration with React plugin.
- `index.html`: Web application entry point.

---

### Source Code (`frontend/src/`)

- `src/main.jsx`: React application bootstrap mounting the root component.
- `src/App.jsx`: Client-side routing configuration for all dashboard views.
- `src/index.css`: Custom design tokens, layout grids, tables, and badge styling.
- `src/App.css`: Component layout utilities.
- `src/services/api.js`: Centralized Axios instance targeting the backend REST API.
- `src/layouts/MainLayout.jsx`: Application shell including the sidebar and main content container.
- `src/components/Sidebar.jsx`: Navigation sidebar linking to all functional views.

---

### Dashboard Views (`frontend/src/pages/`)

- `src/pages/Dashboard.jsx`: Main dashboard featuring system health metrics, sensor counts, recent telemetry feeds, and latest anomaly logs.
- `src/pages/Sensors.jsx`: Sensor registry management page to register new hardware nodes and monitor active sensors.
- `src/pages/Analytics.jsx`: Live telemetry visualization powered by Chart.js.
- `src/pages/Investigation.jsx`: Detailed audit trail log with search/filter capabilities and an inspection modal showing the five-checker diagnostic breakdown for each reading.
- `src/pages/Recommendations.jsx`: Alert management board for reviewing and resolving hardware and security issues.
- `src/pages/Settings.jsx`: Interactive anomaly simulator allowing operators to test edge cases (e.g. out-of-bounds, sudden spikes, spatial drift, stuck sensors) directly against the backend.
