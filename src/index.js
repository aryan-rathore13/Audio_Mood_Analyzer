const express = require('express');
const mongoose = require('mongoose');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const SpotifyWebApi = require('spotify-web-api-node');
const dotenv = require('dotenv');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');

dotenv.config({ path: path.join(__dirname, '../.env') }); // Look for .env in root
const app = express();
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const cors = require('cors');
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 50 }));

// MongoDB Connection
console.log('MONGO_URI:', process.env.MONGO_URI); // Debug
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Spotify API Setup
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: `${process.env.BASE_URL || 'http://localhost:3000'}/callback`,
});

// Session Schema
const sessionSchema = new mongoose.Schema({
  spotifyId: String,
  accessToken: String,
  refreshToken: String,
  createdAt: { type: Date, default: Date.now },
});
const Session = mongoose.model('Session', sessionSchema);

// Multer Setup for Audio Upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

// Middleware: Authenticate JWT
const authenticate = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = decoded;
    console.log("Token scopes in use:", decoded);
    spotifyApi.setAccessToken(decoded.accessToken);
    next();
  });
};

// WebSocket Setup with Sessions
wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    const { sessionId, action } = data;

    if (action === 'join') {
      ws.sessionId = sessionId || 'default';
      ws.send(JSON.stringify({ type: 'welcome', message: `Connected to session ${ws.sessionId}` }));
    }
  });

  ws.on('close', () => {
    console.log(`Client disconnected from session ${ws.sessionId}`);
  });
});

// Broadcast to all clients in a session
function broadcast(sessionId, message) {
  wss.clients.forEach(client => {
    if (client.sessionId === sessionId && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// Analyze Audio Mood
async function analyzeAudioMood(audioPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(audioPath, (err, metadata) => {
      if (err) return reject(err);
      const duration = metadata.format.duration || 0;
      const bitrate = metadata.format.bit_rate || 0;

      const energyScore = (bitrate / 1000) * (1 / duration);
      const mood = energyScore > 50 ? 'energetic' : 'calm';
      resolve(mood);
    });
  });
}

// Spotify Login Route
app.get('/login', (req, res) => {
  const scopes = ['user-read-private', 'playlist-modify-public', 'playlist-modify-private'];
  res.redirect(spotifyApi.createAuthorizeURL(scopes));
});

// Spotify Callback Route
app.get('/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    const accessToken = data.body['access_token'];
    const refreshToken = data.body['refresh_token'];

    spotifyApi.setAccessToken(accessToken);
    spotifyApi.setRefreshToken(refreshToken);

    const me = await spotifyApi.getMe();
    const spotifyId = me.body.id;

    let session = await Session.findOne({ spotifyId });
    if (!session) {
      session = new Session({ spotifyId, accessToken, refreshToken });
    } else {
      session.accessToken = accessToken;
      session.refreshToken = refreshToken;
    }
    await session.save();

    const token = jwt.sign({ spotifyId, accessToken }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?token=${token}`);
  } catch (error) {
    console.error('Spotify auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Song Suggestion Endpoint
app.post('/suggest', authenticate, async (req, res) => {
  const { prompt, sessionId = 'default' } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

  const moodMap = {
    'cheer me up': 'happy',
    'happy': 'happy',
    'sad': 'sad',
    'breakup': 'sad',
    'calm': 'calm',
    'energetic': 'energetic',
    'angry': 'angry',
    'relax': 'calm',
  };
  let mood = 'happy';
  for (const [keyword, mappedMood] of Object.entries(moodMap)) {
    if (prompt.toLowerCase().includes(keyword)) {
      mood = mappedMood;
      break;
    }
  }

  const isHindi = prompt.toLowerCase().includes('hindi');
  const language = isHindi ? 'hindi' : 'english';

  try {
    const query = `${mood} ${language} songs`;
    const response = await spotifyApi.searchTracks(query, { limit: 10 });
    const tracks = response.body.tracks.items.map(track => track.uri);

    const playlist = await spotifyApi.createPlaylist(`Mood: ${mood} (${language})`, {
      description: `Generated for "${prompt}"`,
      public: false,
    });
    await spotifyApi.addTracksToPlaylist(playlist.body.id, tracks);

    const result = { mood, language, playlistId: playlist.body.id, playlistUrl: playlist.body.external_urls.spotify };
    broadcast(sessionId, { type: 'suggestion', data: result });

    res.json(result);
  } catch (error) {
    console.error('Spotify search error:', error);
    res.status(500).json({ error: 'Failed to fetch song suggestions' });
  }
});

// Audio Upload and Mood Analysis Endpoint
app.post('/analyze-audio', authenticate, upload.single('audio'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No audio file uploaded' });
  const sessionId = req.body.sessionId || 'default';

  const audioPath = req.file.path;

  try {
    const mood = await analyzeAudioMood(audioPath);
    console.log(`Analyzed mood from ${audioPath}: ${mood}`);

    const query = `${mood} english songs`;
    const response = await spotifyApi.searchTracks(query, { limit: 10 });
    const tracks = response.body.tracks.items.map(track => track.uri);

    const playlist = await spotifyApi.createPlaylist(`Audio Mood: ${mood}`, {
      description: 'Generated from audio analysis',
      public: false,
    });
    await spotifyApi.addTracksToPlaylist(playlist.body.id, tracks);

    const result = { mood, playlistId: playlist.body.id, playlistUrl: playlist.body.external_urls.spotify };
    broadcast(sessionId, { type: 'audio', data: result });

    fs.unlinkSync(audioPath);
    res.json(result);
  } catch (error) {
    console.error('Audio analysis or Spotify error:', error);
    fs.unlinkSync(audioPath);
    res.status(500).json({ error: 'Failed to process audio' });
  }
});

// Catch-all route for React Router (must be last)
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '../client/dist/index.html'));
// });

// Start server
server.listen(3000, () => console.log('Server running on port 3000'));
