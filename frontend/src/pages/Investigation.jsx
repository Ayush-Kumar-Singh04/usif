import { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import api from "../services/api";

function Investigation() {
  const [investigations, setInvestigations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [decisionFilter, setDecisionFilter] = useState("ALL");
  const [selectedInv, setSelectedInv] = useState(null);

  const fetchInvestigations = () => {
    api.get("/investigations")
      .then(response => setInvestigations(response.data))
      .catch(error => console.error("Error fetching investigations:", error));
  };

  useEffect(() => {
    fetchInvestigations();
  }, []);

  const getDecisionBadge = (decision) => {
    switch (decision) {
      case "TRUSTED":
        return <span className="badge badge-active">Trusted</span>;
      case "SUSPICIOUS":
        return <span className="badge badge-warning">Suspicious</span>;
      case "MALICIOUS":
        return <span className="badge badge-inactive">Malicious</span>;
      default:
        return <span className="badge">{decision}</span>;
    }
  };

  const getCheckIcon = (status) => {
    if (status === "PASS") {
      return (
        <span className="check-status" style={{ color: 'var(--green)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          PASS
        </span>
      );
    } else if (status === "FAIL") {
      return (
        <span className="check-status" style={{ color: 'var(--red)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
          FAIL
        </span>
      );
    } else if (status === "SUSPICIOUS") {
      return (
        <span className="check-status" style={{ color: 'var(--amber)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          WARN
        </span>
      );
    }
    return <span className="check-status" style={{ color: 'var(--text-muted)' }}>— {status}</span>;
  };

  const filtered = investigations.filter(inv => {
    const matchesSearch = inv.sensor_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          inv.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          inv.sensor_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = decisionFilter === "ALL" || inv.final_decision === decisionFilter;
    return matchesSearch && matchesFilter;
  });

  const stats = investigations.reduce((acc, curr) => {
    acc.total += 1;
    if (curr.final_decision === "TRUSTED") acc.trusted += 1;
    else if (curr.final_decision === "SUSPICIOUS") acc.suspicious += 1;
    else if (curr.final_decision === "MALICIOUS") acc.malicious += 1;
    return acc;
  }, { total: 0, trusted: 0, suspicious: 0, malicious: 0 });

  return (
    <MainLayout title="Investigation">
      <div className="section-header">
        <div>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Integrity Investigations</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
            5-layer anomaly detection audit trail
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="dashboard-grid" style={{ marginBottom: "24px" }}>
        <div className="metric-card" style={{ borderLeft: '3px solid var(--blue)' }}>
          <h3>Total Checks</h3>
          <div className="metric-value">{stats.total}</div>
        </div>
        <div className="metric-card" style={{ borderLeft: '3px solid var(--green)' }}>
          <h3>Trusted</h3>
          <div className="metric-value" style={{ color: 'var(--green)' }}>{stats.trusted}</div>
        </div>
        <div className="metric-card" style={{ borderLeft: '3px solid var(--amber)' }}>
          <h3>Suspicious</h3>
          <div className="metric-value" style={{ color: 'var(--amber)' }}>{stats.suspicious}</div>
        </div>
        <div className="metric-card" style={{ borderLeft: '3px solid var(--red)' }}>
          <h3>Malicious</h3>
          <div className="metric-value" style={{ color: 'var(--red)' }}>{stats.malicious}</div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="form-container" style={{ padding: "16px 20px", marginBottom: '16px' }}>
        <div className="form-row" style={{ margin: 0, gap: "12px" }}>
          <div className="form-group" style={{ flex: 2 }}>
            <label htmlFor="search">Search</label>
            <div style={{ position: 'relative' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                id="search"
                placeholder="Filter by sensor ID, type, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '36px' }}
              />
            </div>
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label htmlFor="filter">Decision</label>
            <select
              id="filter"
              value={decisionFilter}
              onChange={(e) => setDecisionFilter(e.target.value)}
            >
              <option value="ALL">All Decisions</option>
              <option value="TRUSTED">Trusted</option>
              <option value="SUSPICIOUS">Suspicious</option>
              <option value="MALICIOUS">Malicious</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          Audit Trail Logs
        </h2>
        <div className="table-container">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>
              <h3>No Results</h3>
              <p>No audit logs match your search filters.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Sensor</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Value</th>
                  <th>Decision</th>
                  <th>Threat</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => (
                  <tr key={inv.id}>
                    <td style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: 'var(--mono)' }}>
                      {new Date(inv.timestamp).toLocaleString()}
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{inv.sensor_id}</td>
                    <td>{inv.sensor_type}</td>
                    <td>{inv.location}</td>
                    <td style={{ fontWeight: 600, color: 'var(--accent)', fontFamily: 'var(--mono)' }}>
                      {inv.value != null ? inv.value.toFixed(2) : "N/A"}
                    </td>
                    <td>{getDecisionBadge(inv.final_decision)}</td>
                    <td style={{ fontWeight: 700 }}>
                      <span style={{
                        color: inv.evidence_score >= 0.6 ? 'var(--red)' : inv.evidence_score >= 0.2 ? 'var(--amber)' : 'var(--text-primary)'
                      }}>
                        {(inv.evidence_score * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td>
                      <button onClick={() => setSelectedInv(inv)} className="btn btn-ghost" style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="8"/>
                          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                          <line x1="11" y1="8" x2="11" y2="14"/>
                          <line x1="8" y1="11" x2="14" y2="11"/>
                        </svg>
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {selectedInv && (
        <div className="modal-overlay" onClick={() => setSelectedInv(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Telemetry Inspection
              </h3>
              <button className="modal-close" onClick={() => setSelectedInv(null)}>✕</button>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px", fontSize: "0.85rem" }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Sensor ID:</span> <strong>{selectedInv.sensor_id}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Type:</span> <strong>{selectedInv.sensor_type}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Location:</span> <strong>{selectedInv.location}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Time:</span> <strong>{selectedInv.timestamp ? new Date(selectedInv.timestamp).toLocaleString() : "N/A"}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Value:</span> <strong style={{ color: 'var(--accent)' }}>{selectedInv.value != null ? selectedInv.value.toFixed(2) : "N/A"}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Raw ADC:</span> <strong>{selectedInv.raw_value != null ? selectedInv.raw_value.toFixed(2) : "N/A"}</strong></div>
            </div>

            {/* Verdict Banner */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 18px",
              borderRadius: "var(--radius-md)",
              backgroundColor: selectedInv.final_decision === "TRUSTED" ? 'var(--green-dim)' :
                              selectedInv.final_decision === "SUSPICIOUS" ? 'var(--amber-dim)' : 'var(--red-dim)',
              border: `1px solid ${selectedInv.final_decision === "TRUSTED" ? 'rgba(63,185,80,0.3)' :
                              selectedInv.final_decision === "SUSPICIOUS" ? 'rgba(210,153,34,0.3)' : 'rgba(248,81,73,0.3)'}`,
              marginBottom: "24px"
            }}>
              <div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: '0.06em' }}>Verdict</div>
                <div style={{ fontSize: "1.15rem", fontWeight: 800,
                  color: selectedInv.final_decision === "TRUSTED" ? 'var(--green)' :
                         selectedInv.final_decision === "SUSPICIOUS" ? 'var(--amber)' : 'var(--red)'
                }}>{selectedInv.final_decision}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: '0.06em' }}>Threat Score</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 800, color: 'var(--text-primary)' }}>{(selectedInv.evidence_score * 100).toFixed(0)}%</div>
              </div>
            </div>

            <h4 style={{ margin: "0 0 12px 0", fontSize: "0.9rem", fontWeight: 700 }}>Integrity Check Diagnostics</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div className="check-row">
                <span>Identity Authorization</span>
                {getCheckIcon(selectedInv.identity_check)}
              </div>
              <div className="check-row">
                <span>Physical Bounds Verification</span>
                {getCheckIcon(selectedInv.physical_check)}
              </div>
              <div className="check-row">
                <span>Historical Continuity</span>
                {getCheckIcon(selectedInv.history_check)}
              </div>
              <div className="check-row">
                <span>Behaviour Variance</span>
                {getCheckIcon(selectedInv.behaviour_check)}
              </div>
              <div className="check-row">
                <span>Cross-Sensor Spatial</span>
                {getCheckIcon(selectedInv.cross_validation)}
              </div>
            </div>

            <div style={{ marginTop: "24px", textAlign: "right" }}>
              <button onClick={() => setSelectedInv(null)} className="btn btn-primary" style={{ padding: "8px 24px" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

export default Investigation;
