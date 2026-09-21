import { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import api from "../services/api";

function Sensors() {
  const [sensors, setSensors] = useState([]);
  const [formData, setFormData] = useState({
    sensor_id: "",
    sensor_type: "Temperature",
    location: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchSensors = () => {
    api.get("/sensors")
      .then(response => setSensors(response.data))
      .catch(err => console.error("Error fetching sensors:", err));
  };

  useEffect(() => {
    fetchSensors();
    const interval = setInterval(fetchSensors, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.sensor_id || !formData.location) {
      setError("Please fill out all fields.");
      return;
    }

    api.post("/register-sensor", formData)
      .then(() => {
        setSuccess("Sensor registered successfully!");
        setFormData({ sensor_id: "", sensor_type: "Temperature", location: "" });
        fetchSensors();
        setTimeout(() => setSuccess(""), 3000);
      })
      .catch(err => {
        setError(err.response?.data?.detail || "Failed to register sensor.");
      });
  };

  return (
    <MainLayout title="Sensors">
      <div className="section-header">
        <div>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Sensors Directory</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
            Register and manage IoT sensor nodes
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M8 12l2 2 4-4"/>
          </svg>
          {sensors.filter(s => s.status === "ACTIVE").length} active
        </div>
      </div>

      {/* Registration Form */}
      <div className="form-container">
        <h3 className="form-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="16"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
          Register New Sensor
        </h3>

        {error && <div className="alert-banner alert-banner-danger" style={{ marginBottom: '16px' }}>{error}</div>}
        {success && <div className="alert-banner alert-banner-success" style={{ marginBottom: '16px' }}>{success}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="sensor_id">Sensor ID</label>
              <input
                type="text"
                id="sensor_id"
                name="sensor_id"
                value={formData.sensor_id}
                onChange={handleChange}
                placeholder="e.g. TEMP_01"
              />
            </div>
            <div className="form-group">
              <label htmlFor="sensor_type">Sensor Type</label>
              <select
                id="sensor_type"
                name="sensor_type"
                value={formData.sensor_type}
                onChange={handleChange}
              >
                <option value="Temperature">Temperature</option>
                <option value="Humidity">Humidity</option>
                <option value="Pressure">Pressure</option>
                <option value="Vibration">Vibration</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Server Room B"
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Register Sensor
          </button>
        </form>
      </div>

      {/* Sensors Table */}
      <div>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
          Live Sensors List
        </h2>
        <div className="table-container">
          {sensors.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg></div>
              <h3>No Sensors Registered</h3>
              <p>Use the form above to register your first sensor node.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Sensor ID</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Installed</th>
                </tr>
              </thead>
              <tbody>
                {sensors.map(s => (
                  <tr key={s.id}>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--mono)', fontSize: '0.8rem' }}>{s.id}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.sensor_id}</td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {s.sensor_type}
                      </span>
                    </td>
                    <td>{s.location}</td>
                    <td>
                      <span className={`badge ${s.status === "ACTIVE" ? "badge-active" : "badge-inactive"}`}>
                        {s.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {new Date(s.installation_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

export default Sensors;
