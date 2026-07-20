import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import TopicsPage from "./components/TopicsPage";
import SummaryPage from "./components/SummaryPage";
import AudioPlayerPage from "./components/AudioPlayerPage";
import CreditsPage from "./components/CreditsPage";
import SettingsPage from "./components/SettingsPage";
import SharePage from "./components/SharePage";
import AuthGate from "./CLIENT/AuthGate"; 

function RoutesApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TopicsPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/summary" element={<SummaryPage />} />
        <Route path="/credits" element={<CreditsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/playback" element={<AudioPlayerPage />} />
        <Route path="/community" element={<SharePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthGate>
      <RoutesApp />
    </AuthGate>
  );
}
