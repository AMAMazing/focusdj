# 🎵 FocusDJ

A beautiful Pomodoro timer with YouTube playlist integration to help you stay focused and productive. Choose your perfect study soundtrack and let FocusDJ handle the rest.

## ✨ Features

### 🎯 Smart Pomodoro Timer
- Customizable work and break durations
- Set focus goals for each session
- Track daily productivity minutes
- Quick preset buttons (15, 25, 45, 60 min)
- Real-time clock with 12/24-hour format

### 🎶 YouTube Playlist Integration
- Curated library of focus playlists (Lo-fi, Jazz, Classical, and more)
- Import custom YouTube playlists
- Separate playlists for work and break sessions
- Mix multiple playlists together
- Automatic playlist shuffling
- Video repeat mode
- Volume controls

### 🎨 Dynamic Theming
- Adaptive accent colors based on video thumbnails
- Smooth color transitions between tracks
- Modern dark UI with glassmorphic elements

### 💪 Break Activities
- Organize break activities by category (Energizing/Restorative)
- Set custom durations for each activity
- Quick suggestions to maximize your breaks

### 📊 Data Management
- Import/Export your settings and playlists
- Persistent storage across sessions
- Track total focus minutes

### 🖥️ Adaptive Display
- Auto-zoom to fit content on any screen size
- Fullscreen mode for distraction-free focus
- Responsive design for all devices

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- A YouTube Data API v3 key

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/focusdj.git
cd focusdj
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file in the root directory and add your YouTube API key
```env
VITE_YOUTUBE_API_KEY=your_api_key_here
```

4. Start the development server
```bash
npm run dev
```

5. Open your browser to `http://localhost:5173`

### Getting a YouTube API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the YouTube Data API v3
4. Create credentials (API Key)
5. Copy the API key to your `.env` file

## 🎮 Usage

### Starting a Focus Session

1. **Set Your Goal** (Optional): Click the play button to set what you want to accomplish
2. **Choose a Playlist**: Click "Set Focus" to select a playlist for your work session
3. **Select Duration**: Choose a preset time or enter a custom duration
4. **Start Focusing**: Hit play and let FocusDJ guide your session

### Managing Playlists

- **Library**: Browse curated playlists optimized for focus
- **Custom**: Create and manage your imported playlists
- **Import**: Add any public YouTube playlist by URL
- **Mix**: Select multiple playlists to create a custom mix

### Break Activities

During breaks, you can:
- View suggested activities categorized as Energizing or Restorative
- Add your own break activities with custom durations
- Let the timer guide you through healthy breaks

## 🛠️ Tech Stack

- **React** - UI framework
- **TypeScript** - Type safety
- **Zustand** - State management
- **Tailwind CSS** - Styling
- **YouTube API** - Playlist integration
- **React YouTube** - Video player
- **Color Thief** - Dynamic theming
- **Vite** - Build tool


## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

Have questions or suggestions? Feel free to open an issue or reach out!

---

**Stay focused. Stay productive. 🎧**