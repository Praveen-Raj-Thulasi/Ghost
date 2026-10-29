import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Summon from "./pages/Summon";
import InvestigationOverview from "./pages/InvestigationOverview";
import Timeline from "./pages/Timeline";
import Findings from "./pages/Findings";
import Chat from "./pages/Chat";
import Resurrection from "./pages/Resurrection";
import Settings from "./pages/Settings";
import About from "./pages/About";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}> {/* shared layout */}
          <Route index element={<Landing />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="summon" element={<Summon />} />
          <Route path="investigation/:id" element={<InvestigationOverview />} />
          <Route path="investigation/:id/timeline" element={<Timeline />} />
          <Route path="investigation/:id/unfinished-business" element={<Findings />} />
          <Route path="investigation/:id/ask-the-ghost" element={<Chat />} />
          <Route path="investigation/:id/resurrection" element={<Resurrection />} />
          <Route path="settings" element={<Settings />} />
          <Route path="about" element={<About />} />
          {/* fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
