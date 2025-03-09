import { BackgroundBeamsWithCollision } from "@/components/ui/background-beams-with-collision.tsx";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";

const FileUploadButton = ({ onFileChange }: { onFileChange: (file: File | null) => void }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = (file: File | null) => {
    setFileName(file ? file.name : null);
    onFileChange(file);
  };

  return (
    <div className="relative">
      <input
        type="file"
        accept="audio/*"
        ref={fileInputRef}
        onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
        className="hidden"
      />
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => fileInputRef.current?.click()}
        className="px-6 py-3 bg-[#1db954] text-white font-semibold rounded-md shadow-md hover:bg-[#1ed760] transition-colors"
      >
        Choose Audio File
      </motion.button>
      {fileName && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 truncate max-w-full">
          Uploaded: {fileName}
        </p>
      )}
    </div>
  );
};

const ResultCard = ({ mood, language, playlistUrl }: { mood: string; language?: string; playlistUrl: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="mt-4 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex items-center justify-between border-l-4 border-[#1db954]"
  >
    <div className="flex flex-col space-y-1">
      <p className="text-lg font-semibold text-gray-900 dark:text-white">
        Mood: <span className="capitalize">{mood}</span>
      </p>
      {language && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Language: <span className="capitalize">{language}</span>
        </p>
      )}
    </div>
    <motion.a
      href={playlistUrl}
      target="_blank"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="px-4 py-2 bg-[#1db954] text-white rounded-md hover:bg-[#1ed760] transition-colors"
    >
      Open Playlist
    </motion.a>
  </motion.div>
);

const Dashboard = () => {
  const [sessionId, setSessionId] = useState("default");
  const [prompt, setPrompt] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [suggestions, setSuggestions] = useState<{ mood: string; language?: string; playlistUrl: string } | null>(null);
  const [audioResult, setAudioResult] = useState<{ mood: string; playlistUrl: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const token = new URLSearchParams(window.location.search).get("token");
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    if (!token) window.location.href = "/";

    const ws = new WebSocket("ws://localhost:3000");
    ws.onopen = () => {
      ws.send(JSON.stringify({ action: "join", sessionId }));
    };
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "suggestion") {
        setSuggestions({
          mood: data.data.mood,
          language: data.data.language,
          playlistUrl: data.data.playlistUrl,
        });
      } else if (data.type === "audio") {
        setAudioResult({
          mood: data.data.mood,
          playlistUrl: data.data.playlistUrl,
        });
      }
    };
    return () => ws.close();
  }, [sessionId, token]);

  useEffect(() => {
    if (audioResult && audioFile && waveformRef.current) {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }

      const moodColors: { [key: string]: string } = {
        sad: "#3b82f6",
        happy: "#facc15",
        energetic: "#ef4444",
        calm: "#10b981",
      };

      wavesurferRef.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: moodColors[audioResult.mood] || "#1db954",
        progressColor: "#1db954",
        cursorColor: "#ffffff",
        barWidth: 2,
        barRadius: 3,
        height: 100,
        responsive: true,
      });

      wavesurferRef.current.loadBlob(audioFile);

      return () => {
        if (wavesurferRef.current) {
          wavesurferRef.current.destroy();
        }
      };
    }
  }, [audioResult, audioFile]);

  const getSuggestions = async () => {
    if (!prompt) return alert("Please enter a prompt!");
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:3000/suggest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token || "",
        },
        body: JSON.stringify({ prompt, sessionId }),
      });
      if (!response.ok) throw new Error((await response.json()).error);
    } catch (error) {
      alert(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeAudio = async () => {
    if (!audioFile) return alert("Please upload an audio file!");
    setIsLoading(true);
    const formData = new FormData();
    formData.append("audio", audioFile);
    formData.append("sessionId", sessionId);

    try {
      const response = await fetch("http://localhost:3000/analyze-audio", {
        method: "POST",
        headers: { Authorization: token || "" },
        body: formData,
      });
      if (!response.ok) throw new Error((await response.json()).error);
    } catch (error) {
      alert(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 relative">
      <BackgroundBeamsWithCollision>
        <div className="max-w-2xl w-full mx-auto text-center py-12 relative z-10">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">Dashboard</h1>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Prompt Suggestions</h2>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., I am going through a breakup, cheer me up"
              className="w-full p-3 mb-4 border rounded-md text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={getSuggestions}
              disabled={isLoading}
              className="px-6 py-2 bg-[#1db954] text-white rounded-md hover:bg-[#1ed760] transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 mx-auto text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z" />
                </svg>
              ) : (
                "Get Suggestions"
              )}
            </motion.button>
            {suggestions && (
              <ResultCard mood={suggestions.mood} language={suggestions.language} playlistUrl={suggestions.playlistUrl} />
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Audio Mood Analysis</h2>
            <FileUploadButton onFileChange={setAudioFile} />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={analyzeAudio}
              disabled={isLoading}
              className={`mt-4 px-6 py-2 bg-[#1db954] text-white rounded-md hover:bg-[#1ed760] transition-colors disabled:opacity-50 ${
                audioFile && !isLoading ? "animate-border" : ""
              }`}
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 mx-auto text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z" />
                </svg>
              ) : (
                "Analyze Audio"
              )}
            </motion.button>
            {audioResult && (
              <ResultCard mood={audioResult.mood} playlistUrl={audioResult.playlistUrl} />
            )}
            <div ref={waveformRef} className="mt-4" />
          </div>
        </div>
      </BackgroundBeamsWithCollision>
    </div>
  );
};

export default Dashboard;