import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import api from "../services/api";

function Dashboard() {
  const [stats, setStats] = useState({
    total_sensors: 0,
    active_sensors: 0,
    total_readings: 0,
    flagged_readings: 0,
    active_alerts: 0,
    system_health: "Loading..."
  });
  const [recentReadings, setRecentReadings] = useState([]);
  const [recentInvestigations, setRecentInvestigations] = useState([]);

  useEffect(() => {
    const fetchData = () => {
      api.get("/stats")
        .then(response => setStats(response.data))
        .catch(error => console.error("Error fetching stats:", error));

      api.get("/readings")
        .then(response => {
          const sorted = [...response.data].sort((a, b) => b.id - a.id).slice(0, 5);
          setRecentReadings(sorted);
        })
        .catch(error => console.error("Error fetching readings:", error));

      api.get("/investigations")
        .then(response => setRecentInvestigations(response.data.slice(0, 5)))
        .catch(error => console.error("Error fetching investigations:", error));
    };

    fetchData();                                    // initial load
    const interval = setInterval(fetchData, 3000);  // live refresh every 3s
    return () => clearInterval(interval);           // stop polling on unmount
  }, []);

  const getHealthColor = (health) => {
    switch (health) {
      case "Healthy": return "var(--green)";
      case "Degraded": return "var(--amber)";
      case "Critical": return "var(--red)";
      default: return "var(--text-muted)";
    }
  };

  const healthColor = getHealthColor(stats.system_health);

  return (
    <MainLayout title="Dashboard">
      {/* System Health Banner */}
      <div className="section-header">
        <div>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>System Overview</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
            Real-time sensor network integrity monitoring
          </p>
        </div>
        <div style={{
          display: "flex",
          gap: "10px",
          alignItems: "center",
          padding: "8px 16px",
          borderRadius: "var(--radius-full)",
          backgroundColor: `color-mix(in srgb, ${healthColor} 12%, transparent)`,
          border: `1px solid color-mix(in srgb, ${healthColor} 30%, transparent)`,
          color: healthColor,
          fontWeight: 600,
          fontSize: "0.8rem"
        }}>
          <span style={{
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            backgroundColor: healthColor,
            display: "inline-block",
            boxShadow: `0 0 6px ${healthColor}`,
            animation: stats.system_health === "Critical" ? "pulse 1.5s infinite" : "pulse-dot 2s infinite"
          }}></span>
          {stats.system_health}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="dashboard-grid">
        <div className="metric-card">
          <div className="metric-card-header">
            <h3>Total Sensors</h3>
            <div className="metric-card-icon" style={{ background: 'var(--blue-dim)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="4"/>
                <line x1="21.17" y1="8" x2="12" y2="8"/>
                <line x1="3.95" y1="6.06" x2="8.54" y2="14"/>
                <line x1="10.88" y1="21.94" x2="15.46" y2="14"/>
              </svg>
            </div>
          </div>
          <div className="metric-value">{stats.total_sensors}</div>
          <div className="metric-sub">Registered devices in network</div>
        </div>

        <div className="metric-card">
          <div className="metric-card-header">
            <h3>Active Sensors</h3>
            <div className="metric-card-icon" style={{ background: 'var(--green-dim)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
          </div>
          <div className="metric-value" style={{ color: 'var(--green)' }}>{stats.active_sensors}</div>
          <div className="metric-sub">Online & reporting telemetry</div>
        </div>

        <Link to="/investigation" style={{ textDecoration: 'none' }}>
          <div className="metric-card" style={{ cursor: "pointer", height: '100%' }}>
            <div className="metric-card-header">
              <h3>Flagged Anomalies</h3>
              <div className="metric-card-icon" style={{ background: 'var(--red-dim)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
            </div>
            <div className="metric-value" style={{ color: stats.flagged_readings > 0 ? 'var(--red)' : 'var(--text-primary)' }}>
              {stats.flagged_readings}
            </div>
            <div className="metric-link">View audit trail →</div>
          </div>
        </Link>

        <Link to="/recommendations" style={{ textDecoration: 'none' }}>
          <div className="metric-card" style={{ cursor: "pointer", height: '100%' }}>
            <div className="metric-card-header">
              <h3>Active Alerts</h3>
              <div className="metric-card-icon" style={{ background: 'var(--amber-dim)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </div>
            </div>
            <div className="metric-value" style={{ color: stats.active_alerts > 0 ? 'var(--amber)' : 'var(--text-primary)' }}>
              {stats.active_alerts}
            </div>
            <div className="metric-link">Resolve active alerts →</div>
          </div>
        </Link>
      </div>

      {/* Critical Alert Banner */}
      {stats.active_alerts > 0 && (
        <div className="alert-banner alert-banner-danger" style={{ marginTop: '24px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div>
            <strong style={{ display: 'block', marginBottom: '2px' }}>Attention Required</strong>
            <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>
              {stats.active_alerts} active hardware warnings / spoofing attempts detected. 
              Review the <Link to="/recommendations" style={{ color: 'var(--red)', fontWeight: 700, textDecoration: 'underline' }}>Recommendations Panel</Link> to take corrective actions.
            </span>
          </div>
        </div>
      )}

      {/* Two-Column Tables */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "28px" }}>
        {/* Integrity Log */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Integrity Log
            </h2>
            <Link to="/investigation" style={{ fontSize: "0.8rem", fontWeight: 600 }}>View All</Link>
          </div>
          <div className="table-container" style={{ marginTop: 0 }}>
            {recentInvestigations.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>
                <p>No integrity checks conducted yet.</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Sensor</th>
                    <th>Value</th>
                    <th>Decision</th>
                    <th>Threat</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvestigations.map(inv => (
                    <tr key={inv.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{inv.sensor_id}</td>
                      <td>{inv.value != null ? inv.value.toFixed(2) : "N/A"}</td>
                      <td>
                        <span className={`badge ${
                          inv.final_decision === "TRUSTED" ? "badge-active" :
                          inv.final_decision === "SUSPICIOUS" ? "badge-warning" :
                          "badge-inactive"
                        }`}>
                          {inv.final_decision}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: 
                        inv.evidence_score >= 0.6 ? 'var(--red)' : 
                        inv.evidence_score >= 0.2 ? 'var(--amber)' : 'var(--text-primary)'
                      }}>
                        {(inv.evidence_score * 100).toFixed(0)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Telemetry */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              Recent Telemetry
            </h2>
            <Link to="/analytics" style={{ fontSize: "0.8rem", fontWeight: 600 }}>View Analytics</Link>
          </div>
          <div className="table-container" style={{ marginTop: 0 }}>
            {recentReadings.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg></div>
                <p>No readings available.</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Sensor</th>
                    <th>Value</th>
                    <th>Raw</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentReadings.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.sensor_id}</td>
                      <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{r.value != null ? r.value.toFixed(2) : "N/A"}</td>
                      <td>{r.raw_value != null ? r.raw_value.toFixed(2) : "N/A"}</td>
                      <td style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: 'var(--mono)' }}>
                        {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default Dashboard;
