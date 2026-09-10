import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

function MainLayout({ children, title }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <header className="page-header">
          <div className="page-header-left">
            <h1>{title || "USIF"}</h1>
          </div>
          <div className="page-header-right">
            <span>{time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontFamily: 'var(--mono)', fontSize: '0.85rem' }}>
              {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
            </span>
          </div>
        </header>
        <div className="page-body">
          {children}
        </div>
      </div>
    </div>
  );
}

export default MainLayout;
