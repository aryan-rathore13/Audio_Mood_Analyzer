import { BackgroundBeamsWithCollision } from "@/components/ui/background-beams-with-collision.tsx";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Dashboard from "./components/Dashboard.tsx";

const Login = () => {
  const handleLogin = () => {
    window.location.href = "http://localhost:3000/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-neutral-100 dark:from-neutral-950 dark:to-neutral-800 flex items-center justify-center">
      <BackgroundBeamsWithCollision>
        <div className="text-center relative z-10 p-6">
          <h1 className="text-3xl md:text-5xl lg:text-7xl font-bold text-black dark:text-white font-sans tracking-tight mb-6">
            Audio Mood Analyzer
          </h1>
          <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-8">
            Login with Spotify to analyze your audio and moods!
          </p>
          <button
            onClick={handleLogin}
            className="px-6 py-3 bg-[#1db954] text-white font-semibold rounded-md hover:bg-[#1ed760] transition-colors"
          >
            Login with Spotify
          </button>
        </div>
      </BackgroundBeamsWithCollision>
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