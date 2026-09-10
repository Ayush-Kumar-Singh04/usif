import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Sensors from "./pages/Sensors";
import Investigation from "./pages/Investigation";
import Recommendations from "./pages/Recommendations";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Dashboard />} />

        <Route path="/sensors" element={<Sensors />} />

        <Route path="/investigation" element={<Investigation />} />

        <Route path="/recommendations" element={<Recommendations />} />

        <Route path="/analytics" element={<Analytics />} />

        <Route path="/settings" element={<Settings />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;