import React, { Suspense, useState, useEffect } from 'react';
import { PomodoroTimer } from './components/PomodoroTimer';
import { PlaylistCategories } from './components/PlaylistCategories';
import { Footer } from './components/Footer';
import { useStore } from './store/useStore';
import { fetchPlaylistVideos } from './utils/youtube';
import { PomodoroShimmer, VideoPlayerShimmer, PlaylistShimmer } from './components/Shimmer';
import { FocusGoalModal } from './components/FocusGoalModal';
import { BreakActivities } from './components/BreakActivities';
import { BreakPlaylist } from './components/BreakPlaylist';
import { Music } from 'lucide-react';

const VideoPlayer = React.lazy(() => import('./components/VideoPlayer'));
const PlaylistSidebar = React.lazy(() => import('./components/PlaylistSidebar'));

const ApiKeyMissingError = () => (
  <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
    <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-8 max-w-2xl text-center">
      <h1 className="text-2xl font-bold mb-4">Configuration Error</h1>
      <p className="mb-4">The YouTube API key is missing. The application cannot fetch videos without it.</p>
      <p>Please create a file named <code className="bg-gray-700 p-1 rounded">.env</code> in the root of the project and add the following line:</p>
      <pre className="bg-[#282828] p-4 rounded-lg mt-4 text-left">
        <code>VITE_YOUTUBE_API_KEY=YourYouTubeAPIKeyHere</code>
      </pre>
      <p className="mt-4 text-sm text-gray-400">Replace `YourYouTubeAPIKeyHere` with your actual key from the Google API Console. After adding the key, please restart the development server.</p>
    </div>
  </div>
);

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl">
          Something went wrong. Please try refreshing the page.
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  if (!import.meta.env.VITE_YOUTUBE_API_KEY) {
    return <ApiKeyMissingError />;
  }

  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { playlist, setPlaylist, currentSession, breakPlaylist, isLoggedIn } = useStore();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showCategories, setShowCategories] = useState(playlist.videos.length === 0);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isBreakPlaylistModalOpen, setIsBreakPlaylistModalOpen] = useState(false);
  const [breakPlaylistName, setBreakPlaylistName] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    if (breakPlaylist.name) {
      setBreakPlaylistName(breakPlaylist.name);
    }
  }, [breakPlaylist.name]);

  const handleSubmit = React.useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError('');
    setShowCategories(false);

    try {
      const videos = await fetchPlaylistVideos(url);
      setPlaylist({
        videos,
        currentIndex: 0,
        isPlaying: false,
        volume: 70,
        audioOnly: false,
        shuffle: false,
        repeat: false,
      });
      setUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content');
    } finally {
      setLoading(false);
    }
  }, [url, setPlaylist]);

  const handleUrlChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    if (e.target.value.trim() === '') {
      setShowCategories(true);
    }
  }, []);

  const handleToggleCategories = () => {
    if (playlist.videos.length > 0) {
      setIsCategoryModalOpen(!isCategoryModalOpen);
    } else {
      setShowCategories(!showCategories);
    }
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col">
        <main className="flex-grow max-w-7xl mx-auto p-4 sm:p-6 w-full">
          <div className="grid lg:grid-cols-[55%_45%] gap-6 lg:gap-8">
            <div className="space-y-6 lg:space-y-8">
              <PomodoroShimmer />
            </div>
            <div className="bg-[#282828] rounded-xl overflow-hidden">
              <div className="p-6 border-b border-[#383838]">
                <div className="flex gap-4">
                  <div className="flex-1 h-10 bg-[#383838] rounded-full" />
                  <div className="w-24 h-10 bg-[#383838] rounded-full" />
                </div>
              </div>
              <div className="p-6">
                <VideoPlayerShimmer />
                <div className="mt-6">
                  <PlaylistShimmer />
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col">
      <FocusGoalModal />
      {isBreakPlaylistModalOpen && <BreakPlaylist onClose={(name) => {
        setIsBreakPlaylistModalOpen(false);
        if (name) {
          setBreakPlaylistName(name);
        }
      }} />}
      {isCategoryModalOpen && (
        <PlaylistCategories 
          title="Browse Categories"
          onClose={() => setIsCategoryModalOpen(false)} 
        />
      )}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl">
            {error}
          </div>
        </div>
      )}
      <header className="max-w-7xl mx-auto p-4 sm:p-6 flex justify-between items-center w-full">
        <h1 className="text-2xl font-bold text-white">FocusDJ</h1>
      </header>
      <main className="flex-grow max-w-7xl mx-auto p-4 sm:p-6 w-full">
        <div className="grid lg:grid-cols-[55%_45%] gap-6 lg:gap-8">
          <div className="space-y-6 lg:space-y-8">
            <ErrorBoundary>
              <Suspense fallback={<PomodoroShimmer />}>
                <PomodoroTimer />
              </Suspense>
            </ErrorBoundary>
            {currentSession === 'break' && (
              <ErrorBoundary>
                <Suspense fallback={<div>Loading...</div>}>
                  <BreakActivities />
                </Suspense>
              </ErrorBoundary>
            )}
          </div>
          
          <div className="bg-[#282828] rounded-xl overflow-hidden">
            <div className="p-6 border-b border-[#383838]">
              <div className="flex flex-col gap-4">
                <form onSubmit={handleSubmit} className="flex gap-4">
                  <input
                    type="text"
                    value={url}
                    onChange={handleUrlChange}
                    placeholder="Paste YouTube or YouTube Music URL..."
                    className="flex-1 px-4 py-2 bg-[#383838] rounded-full text-sm border border-transparent focus:border-[#1DB954] focus:ring-1 focus:ring-[#1DB954] outline-none transition-all"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={handleToggleCategories}
                    className="px-4 py-2 rounded-full text-sm font-medium transition-all bg-[#383838] hover:bg-[#404040] text-white"
                  >
                    Browse Categories
                  </button>
                </form>
                
                <div className="flex justify-between items-center">
                  {breakPlaylistName && <p className="text-xs text-gray-400">Break Playlist: {breakPlaylistName}</p>}
                  <button
                    onClick={() => setIsBreakPlaylistModalOpen(true)}
                    className="flex items-center gap-2 text-xs text-gray-400 hover:text-[#1DB954] transition-colors ml-auto"
                  >
                    <Music size={14} />
                    Set Break Playlist
                  </button>
                </div>

                {showCategories && playlist.videos.length === 0 && (
                  <div className="bg-[#1d1d1d] rounded-xl p-4 animate-fade-in">
                    <PlaylistCategories 
                      title="Browse Categories"
                      onClose={() => setShowCategories(false)} 
                    />
                  </div>
                )}
              </div>
            </div>
            
            <ErrorBoundary>
              <Suspense fallback={
                <div className="p-6">
                  <VideoPlayerShimmer />
                  <div className="mt-6">
                    <PlaylistShimmer />
                  </div>
                </div>
              }>
                <div className="p-6">
                  {loading ? (
                    <>
                      <VideoPlayerShimmer />
                      <div className="mt-6">
                        <PlaylistShimmer />
                      </div>
                    </>
                  ) : (
                    <>
                      <VideoPlayer showCategories={showCategories} />
                      <div className="mt-6">
                        <PlaylistSidebar />
                      </div>
                    </>
                  )}
                </div>
              </Suspense>
            </ErrorBoundary>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default App;
