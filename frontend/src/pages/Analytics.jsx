import { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import api from "../services/api";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function Analytics() {
  const [readings, setReadings] = useState([]);

  useEffect(() => {
    api.get("/readings")
      .then(response => setReadings(response.data))
      .catch(err => console.error("Error fetching readings for analytics:", err));
  }, []);

  const sortedReadings = [...readings].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const labels = sortedReadings.map(r => new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  const sensorIds = [...new Set(sortedReadings.map(r => r.sensor_id || `ID #${r.sensor_fk}`))];
  
  const colors = [
    { stroke: '#4a5568', bg: 'rgba(74, 85, 104, 0.06)' },
    { stroke: '#2b6cb0', bg: 'rgba(43, 108, 176, 0.06)' },
    { stroke: '#b7791f', bg: 'rgba(183, 121, 31, 0.06)' },
    { stroke: '#c53030', bg: 'rgba(197, 48, 48, 0.06)' },
    { stroke: '#6b46c1', bg: 'rgba(107, 70, 193, 0.06)' },
    { stroke: '#2f855a', bg: 'rgba(47, 133, 90, 0.06)' },
  ];

  const datasets = sensorIds.map((sId, index) => {
    const color = colors[index % colors.length];
    const data = sortedReadings.map(r => (r.sensor_id === sId || `ID #${r.sensor_fk}` === sId) ? r.value : null);
    return {
      label: `${sId}`,
      data: data,
      borderColor: color.stroke,
      backgroundColor: color.bg,
      fill: true,
      spanGaps: true,
      tension: 0.4,
      pointRadius: 3,
      pointHoverRadius: 6,
      pointBackgroundColor: color.stroke,
      pointBorderColor: 'transparent',
      pointHoverBorderColor: '#fff',
      pointHoverBorderWidth: 2,
      borderWidth: 2,
    };
  });

  const chartData = { labels, datasets };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          color: '#5c5347',
          font: { family: "'Inter', sans-serif", size: 12, weight: 500 },
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 8,
        }
      },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#2c2418',
        bodyColor: '#5c5347',
        borderColor: '#e2ddd5',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        titleFont: { family: "'Inter', sans-serif", weight: 600 },
        bodyFont: { family: "'Inter', sans-serif" },
        displayColors: true,
        boxWidth: 8,
        boxHeight: 8,
        boxPadding: 4,
        usePointStyle: true,
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(226, 221, 213, 0.6)',
          drawBorder: false,
        },
        ticks: {
          color: '#8c8275',
          font: { family: "'Inter', sans-serif", size: 11 },
          maxRotation: 45,
        },
        border: { display: false }
      },
      y: {
        grid: {
          color: 'rgba(226, 221, 213, 0.6)',
          drawBorder: false,
        },
        ticks: {
          color: '#8c8275',
          font: { family: "'Inter', sans-serif", size: 11 },
          padding: 8,
        },
        border: { display: false }
      }
    },
    elements: {
      line: {
        borderCapStyle: 'round',
        borderJoinStyle: 'round',
      }
    }
  };

  return (
    <MainLayout title="Analytics">
      <div className="section-header">
        <div>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Analytics Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
            Real-time telemetry trend visualization
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
          {readings.length} data points
        </div>
      </div>

      <div className="form-container" style={{ height: "480px", display: "flex", flexDirection: "column", padding: '20px 24px' }}>
        <h3 className="form-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18"/>
            <path d="M7 16l4-8 4 4 6-8"/>
          </svg>
          Telemetry Trends
        </h3>
        <div style={{ flex: 1, position: "relative" }}>
          {readings.length === 0 ? (
            <div className="empty-state" style={{ height: '100%' }}>
              <div className="empty-state-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M7 16l4-8 4 4 6-8"/></svg></div>
              <h3>No Telemetry Data</h3>
              <p>Register sensors and submit readings to see live trend charts.</p>
            </div>
          ) : (
            <Line data={chartData} options={chartOptions} />
          )}
        </div>
      </div>
    </MainLayout>
  );
}

export default Analytics;
