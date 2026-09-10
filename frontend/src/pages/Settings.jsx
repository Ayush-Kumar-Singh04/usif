import { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import api from "../services/api";

function Settings() {
  const [sensors, setSensors] = useState([]);
  const [selectedSensorId, setSelectedSensorId] = useState("");
  const [simulationType, setSimulationType] = useState("normal");
  const [customValue, setCustomValue] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/sensors")
      .then(response => {
        setSensors(response.data);
        if (response.data.length > 0) {
          setSelectedSensorId(response.data[0].sensor_id);
        }
      })
      .catch(err => console.error("Error loading sensors for simulation:", err));
  }, []);

  const handleSimulate = (e) => {
    e.preventDefault();
    setFeedback(null);
    setError("");
    setLoading(true);

    let sensorId = selectedSensorId;
    let val = parseFloat(customValue);
    let rawVal = val;

    const selectedSensor = sensors.find(s => s.sensor_id === selectedSensorId);
    const sensorType = selectedSensor ? selectedSensor.sensor_type : "Temperature";

    if (simulationType === "spoof") {
      sensorId = "SPOOFED_DEVICE_X";
      val = 25.0;
      rawVal = 25.0;
    } else if (simulationType === "physical") {
      if (sensorType.toLowerCase().includes("temp")) val = 125.0;
      else if (sensorType.toLowerCase().includes("humid")) val = 150.0;
      else if (sensorType.toLowerCase().includes("press")) val = 1500.0;
      else val = 999.0;
      rawVal = val;
    } else if (simulationType === "history") {
      if (sensorType.toLowerCase().includes("temp")) val = 65.0;
      else if (sensorType.toLowerCase().includes("humid")) val = 85.0;
      else val = 300.0;
      rawVal = val;
    } else if (simulationType === "normal") {
      if (sensorType.toLowerCase().includes("temp")) val = 24.5;
      else if (sensorType.toLowerCase().includes("humid")) val = 45.0;
      else if (sensorType.toLowerCase().includes("press")) val = 1013.2;
      else val = 5.0;
      rawVal = val + (Math.random() - 0.5) * 0.2;
    } else if (simulationType === "stuck") {
      val = 22.0;
      rawVal = 22.0;
    } else if (simulationType === "cross") {
      val = 55.0;
      rawVal = 55.0;
    }

    if (simulationType === "custom") {
      if (isNaN(val)) {
        setError("Please enter a valid numeric value for custom telemetry.");
        setLoading(false);
        return;
      }
      rawVal = parseFloat(rawVal);
    }

    api.post("/readings", {
      sensor_id: sensorId,
      value: val,
      raw_value: rawVal
    })
      .then(response => {
        setFeedback(response.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Simulation error:", err);
        setError(err.response?.data?.detail || "Simulation submission failed.");
        setLoading(false);
      });
  };

  const triggerStuckSequence = () => {
    if (!selectedSensorId) return;
    setFeedback(null);
    setError("");
    setLoading(true);

    const promises = Array(5).fill().map(() => 
      api.post("/readings", {
        sensor_id: selectedSensorId,
        value: 22.0,
        raw_value: 22.0
      })
    );

    Promise.all(promises)
      .then(responses => {
        setFeedback(responses[responses.length - 1].data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed stuck fault sequence.");
        setLoading(false);
      });
  };

  const getCheckColor = (status) => {
    if (status === "PASS" || status === "N/A") return 'var(--green)';
    if (status === "SUSPICIOUS") return 'var(--amber)';
    return 'var(--red)';
  };

  const getCheckIcon = (status) => {
    if (status === "PASS" || status === "N/A") {
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      );
    }
    if (status === "SUSPICIOUS") {
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      );
    }
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    );
  };

  const simVectors = [
    { value: "normal", label: "Normal Telemetry", desc: "Valid sensor ranges" },
    { value: "physical", label: "Out-Of-Bounds", desc: "Physical threshold failure" },
    { value: "history", label: "Abrupt Spike", desc: "Historical continuity failure" },
    { value: "cross", label: "Spatial Deviation", desc: "Cross-sensor validation mismatch" },
    { value: "spoof", label: "Identity Spoofing", desc: "Unregistered device ID" },
    { value: "custom", label: "Custom Value", desc: "Enter a manual value" },
  ];

  return (
    <MainLayout title="Settings">
      <div className="section-header">
        <div>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Settings & Simulation</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
            Test USIF's anomaly detection with simulated sensor data
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        
        {/* Left: Simulation Panel */}
        <div>
          <div className="form-container">
            <h3 className="form-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
              Anomaly Simulator
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "20px" }}>
              Submit simulated readings to test the five-layered detection engine.
            </p>
            
            <form onSubmit={handleSimulate}>
              <div className="form-group" style={{ marginBottom: "18px" }}>
                <label htmlFor="sensorSelect">Target Sensor</label>
                <select
                  id="sensorSelect"
                  value={selectedSensorId}
                  onChange={(e) => setSelectedSensorId(e.target.value)}
                  disabled={simulationType === "spoof"}
                >
                  {sensors.map(s => (
                    <option key={s.id} value={s.sensor_id}>
                      {s.sensor_id} ({s.sensor_type} @ {s.location})
                    </option>
                  ))}
                  {sensors.length === 0 && <option>No registered sensors available</option>}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: "18px" }}>
                <label>Simulation Vector</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
                  {simVectors.map(sv => (
                    <label 
                      key={sv.value}
                      style={{ 
                        fontWeight: 400, 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "10px",
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-md)',
                        background: simulationType === sv.value ? 'var(--accent-dim)' : 'transparent',
                        border: `1px solid ${simulationType === sv.value ? 'var(--accent-border)' : 'transparent'}`,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        fontSize: '0.87rem',
                        textTransform: 'none',
                        letterSpacing: 'normal',
                        color: simulationType === sv.value ? 'var(--text-primary)' : 'var(--text-secondary)',
                      }}
                    >
                      <input
                        type="radio"
                        name="simType"
                        value={sv.value}
                        checked={simulationType === sv.value}
                        onChange={() => setSimulationType(sv.value)}
                      />
                      <div>
                        <div style={{ fontWeight: 500 }}>{sv.label}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sv.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {simulationType === "custom" && (
                <div className="form-group" style={{ marginBottom: "18px" }}>
                  <label htmlFor="customVal">Telemetry Value</label>
                  <input
                    type="number"
                    step="0.01"
                    id="customVal"
                    placeholder="Enter custom value..."
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                  />
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", flexWrap: 'wrap' }}>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={loading || (sensors.length === 0 && simulationType !== "spoof")}
                >
                  {loading ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                        <line x1="12" y1="2" x2="12" y2="6"/>
                        <line x1="12" y1="18" x2="12" y2="22"/>
                        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
                        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
                        <line x1="2" y1="12" x2="6" y2="12"/>
                        <line x1="18" y1="12" x2="22" y2="12"/>
                        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
                        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
                      </svg>
                      Transmitting...
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"/>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                      </svg>
                      Transmit Reading
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={triggerStuckSequence}
                  className="btn btn-secondary"
                  disabled={loading || sensors.length === 0}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  Stuck-At Fault (5x)
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right: Feedback */}
        <div>
          <div className="form-container" style={{ minHeight: "350px", display: "flex", flexDirection: "column" }}>
            <h3 className="form-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
              Analysis Results
            </h3>
            
            {error && (
              <div className="alert-banner alert-banner-danger">{error}</div>
            )}

            {!feedback && !error && (
              <div className="empty-state" style={{ flex: 1 }}>
                <div className="empty-state-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg></div>
                <h3>Awaiting Transmission</h3>
                <p>Send simulated readings to view real-time diagnostic response.</p>
              </div>
            )}

            {feedback && (
              <div style={{ flex: 1 }}>
                {/* Verdict Banner */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 18px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: 
                    feedback.investigation.final_decision === "TRUSTED" ? 'var(--green-dim)' :
                    feedback.investigation.final_decision === "SUSPICIOUS" ? 'var(--amber-dim)' : 'var(--red-dim)',
                  border: `1px solid ${
                    feedback.investigation.final_decision === "TRUSTED" ? 'rgba(63,185,80,0.3)' :
                    feedback.investigation.final_decision === "SUSPICIOUS" ? 'rgba(210,153,34,0.3)' : 'rgba(248,81,73,0.3)'
                  }`,
                  marginBottom: "20px"
                }}>
                  <div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: '0.06em' }}>Verdict</div>
                    <div style={{ fontSize: "1.15rem", fontWeight: 800,
                      color: feedback.investigation.final_decision === "TRUSTED" ? 'var(--green)' :
                             feedback.investigation.final_decision === "SUSPICIOUS" ? 'var(--amber)' : 'var(--red)'
                    }}>{feedback.investigation.final_decision}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: '0.06em' }}>Threat Index</div>
                    <div style={{ fontSize: "1.25rem", fontWeight: 800, color: 'var(--text-primary)' }}>
                      {(feedback.investigation.evidence_score * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>

                <h4 style={{ margin: "0 0 12px 0", fontSize: "0.9rem", fontWeight: 700 }}>Decisions Breakdown</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {[
                    { label: "Identity authorization", key: "identity_check" },
                    { label: "Physical limits", key: "physical_check" },
                    { label: "Historical continuity", key: "history_check" },
                    { label: "Behaviour variance", key: "behaviour_check" },
                    { label: "Spatial correlation", key: "cross_validation" },
                  ].map(check => (
                    <div key={check.key} className="check-row">
                      <span>{check.label}</span>
                      <span className="check-status" style={{ color: getCheckColor(feedback.investigation[check.key]) }}>
                        {getCheckIcon(feedback.investigation[check.key])}
                        {feedback.investigation[check.key]}
                      </span>
                    </div>
                  ))}
                </div>

                {feedback.recommendation_triggered && (
                  <div className="alert-banner alert-banner-warning" style={{ marginTop: "18px" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}>
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    <span><strong>System Alert:</strong> A corrective action has been dispatched to the Recommendations board.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default Settings;
