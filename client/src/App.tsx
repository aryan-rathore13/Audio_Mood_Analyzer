import Globe from "@/components/ui/globe";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Dashboard from "./components/Dashboard.tsx";

const Login = () => {
  const handleLogin = () => {
    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID; // From .env
    const redirectUri = `${import.meta.env.VITE_API_URL}/callback`; // Changed to match backend
    const scopes = "user-read-private playlist-modify-public playlist-modify-private";
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;
    console.log("Spotify Auth URL:", authUrl);
    window.location.href = authUrl;
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center relative overflow-hidden">
      <Globe />
      <div className="text-center relative z-10 p-6">
        <h1 className="text-3xl md:text-5xl lg:text-7xl font-bold text-white font-sans tracking-tight mb-6">
          Audio Mood Analyzer
        </h1>
        <p className="text-lg md:text-xl text-gray-300 mb-8">
          Login with Spotify to analyze your audio and moods!
        </p>
        <button
          onClick={handleLogin}
          className="px-8 py-4 bg-[#1db954] text-white font-semibold rounded-full shadow-lg hover:bg-[#1ed760] transition-colors"
        >
          Login with Spotify
        </button>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
};

export default App;