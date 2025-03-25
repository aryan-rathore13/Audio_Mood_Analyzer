# MoodTune 🎵🔮

## Overview
MoodTune is an innovative web application that transforms audio analysis by detecting user moods through advanced backend processing. Powered by Node.js and integrated with Spotify OAuth, the application provides real-time mood insights from uploaded music tracks.

## 🌟 Features
- **Spotify Authentication**: Secure login via Spotify OAuth
- **Audio Upload & Analysis**: Instant mood detection for uploaded audio files
- **Real-Time Feedback**: WebSocket-powered mood analysis results

## 🛠 Tech Stack
- **Backend**: Node.js, Express.js
- **Authentication**: Spotify API, JWT (JSON Web Tokens)
- **Database**: MongoDB
- **File Handling**: Multer
- **Real-Time Communication**: WebSocket
- **Frontend**: React (Vite)
- **Deployment**: 
  - Backend: Render
  - Frontend: Vercel

## 🚀 Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account
- Spotify Developer account
- Git

## 🔧 Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/aryan-rathore13/Audio_Mood_Analyzer.git
cd Audio_Mood_Analyzer
```

### 2. Install Dependencies
#### Backend
```bash
npm install
```

#### Frontend
```bash
cd client
npm install
cd ..
```

### 3. Configure Environment Variables
Create `.env` files in the root and client directories:

#### Root Directory `.env`
```env
MONGO_URI=<your-mongodb-uri>
JWT_SECRET=<your-secret-key>
SPOTIFY_CLIENT_ID=<your-spotify-client-id>
SPOTIFY_CLIENT_SECRET=<your-spotify-client-secret>
BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000
```

#### Client Directory `.env`
```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
VITE_SPOTIFY_CLIENT_ID=<your-spotify-client-id>
```

### 4. Run the Application
#### Start Backend
```bash
npm start
```

#### Start Frontend (in a separate terminal)
```bash
cd client
npm run dev
```

### 5. Spotify Configuration
- Log in to Spotify Developer Dashboard
- Add `http://localhost:3000/callback` as a Redirect URI

## 🖥 Usage
1. Visit http://localhost:3000
2. Click "Login with Spotify"
3. Upload an audio file
4. Receive real-time mood analysis

## 📂 Project Structure
- `src/`: Backend source code (Node.js, Express.js)
- `client/`: Frontend source code (React, Vite)
- `uploads/`: Temporary audio file storage

## 🌐 Live Demo
[MoodTune Live App](https://audio-mood-analyzer.vercel.app)

## 🤝 Contributing
Developed by Aryan Rathore. Contributions welcome! 
- Fork the project
- Create your feature branch (`git checkout -b feature/AmazingFeature`)
- Commit your changes (`git commit -m 'Add some AmazingFeature'`)
- Push to the branch (`git push origin feature/AmazingFeature`)
- Open a Pull Request

## 📜 License
Unlicensed - Use freely, but please give credit to the author.

## 🙌 Acknowledgments
- Spotify API
- Node.js Community
- React Ecosystem
