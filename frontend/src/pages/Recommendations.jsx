import { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import api from "../services/api";

function Recommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const fetchRecommendations = () => {
    api.get("/recommendations")
      .then(response => setRecommendations(response.data))
      .catch(err => {
        console.error("Error fetching recommendations:", err);
        setError("Failed to load recommendations.");
      });
  };

  useEffect(() => {
    fetchRecommendations();
    const interval = setInterval(fetchRecommendations, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleResolve = (id) => {
    setSuccess("");
    setError("");
    
    api.delete(`/recommendations/${id}`)
      .then(() => {
        setSuccess("Alert resolved successfully!");
        fetchRecommendations();
        setTimeout(() => setSuccess(""), 3000);
      })
      .catch(err => {
        console.error("Error resolving recommendation:", err);
        setError("Failed to resolve alert.");
      });
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "HIGH":
        return <span className="badge badge-inactive">High</span>;
      case "MEDIUM":
        return <span className="badge badge-warning">Medium</span>;
      case "LOW":
        return <span className="badge badge-info">Low</span>;
      default:
        return <span className="badge">{priority}</span>;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "HIGH": return 'var(--red)';
      case "MEDIUM": return 'var(--amber)';
      case "LOW": return 'var(--blue)';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <MainLayout title="Alerts">
      <div className="section-header">
        <div>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Recommendations Panel</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
            Security alerts and corrective action recommendations
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem',
          color: recommendations.length > 0 ? 'var(--amber)' : 'var(--green)',
          padding: '6px 14px', borderRadius: 'var(--radius-full)',
          background: recommendations.length > 0 ? 'var(--amber-dim)' : 'var(--green-dim)',
          border: `1px solid ${recommendations.length > 0 ? 'rgba(210,153,34,0.3)' : 'rgba(63,185,80,0.3)'}`,
          fontWeight: 600
        }}>
          {recommendations.length > 0 ? `${recommendations.length} active` : 'All clear'}
        </div>
      </div>

      {success && <div className="alert-banner alert-banner-success">{success}</div>}
      {error && <div className="alert-banner alert-banner-danger">{error}</div>}

      {recommendations.length === 0 ? (
        <div className="form-container" style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: "3rem", marginBottom: "16px", display: 'flex', justifyContent: 'center' }}><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg></div>
          <h3 style={{ color: "var(--green)", marginBottom: "6px" }}>System Fully Secure</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            No active recommendations or security threats detected in the sensor network.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {recommendations.map(rec => (
            <div 
              key={rec.id} 
              className="form-container" 
              style={{ 
                margin: 0, 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                borderLeft: `3px solid ${getPriorityColor(rec.priority)}`,
                padding: "18px 22px",
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ flex: 1, paddingRight: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: "0.95rem", color: "var(--text-primary)", display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={getPriorityColor(rec.priority)} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {rec.sensor_id}
                  </strong>
                  {getPriorityBadge(rec.priority)}
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: 'var(--mono)' }}>
                    {new Date(rec.created_at).toLocaleString()}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: "0.87rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                  {rec.recommendation.replace(/\s*\[[\w|]+\]\s*$/, '')}
                </p>
              </div>
              <div>
                <button
                  onClick={() => handleResolve(rec.id)}
                  className="btn"
                  style={{ 
                    whiteSpace: "nowrap",
                    background: `color-mix(in srgb, ${getPriorityColor(rec.priority)} 15%, transparent)`,
                    color: getPriorityColor(rec.priority),
                    border: `1px solid color-mix(in srgb, ${getPriorityColor(rec.priority)} 30%, transparent)`,
                    fontWeight: 600,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Resolve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </MainLayout>
  );
}

export default Recommendations;
