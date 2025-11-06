import React, { useState, useEffect, useRef } from 'react';
import { useStore } from './store/useStore';
import { fetchPlaylistVideos } from './utils/youtube';
import { Music, Maximize, Lightbulb, Zap, Plus, Trash2, X, Upload, Download, SkipBack, SkipForward, Volume2, ChevronDown, ChevronUp, RotateCcw, Edit, RefreshCw, Shuffle, Repeat, CheckCircle, Ban, LucideProps } from 'lucide-react';
import YouTube from 'react-youtube';
import { newPlaylists } from './data/playlists';
import { useColor } from 'color-thief-react';
import { Video } from './types';
import { CustomPlaylist } from './store/useStore';

interface YouTubePlayer {
    playVideo: () => void;
    pauseVideo: () => void;
    seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
    setVolume: (volume: number) => void;
    getVolume: () => number;
}

// --- Accent Color Extractor Component ---
const AccentColorExtractor = ({ videoId }: { videoId: string }) => {
  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return [h * 360, s * 100, l * 100];
  };

  const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/default.jpg`;
  const { data: colorRgb, loading } = useColor(thumbnailUrl, 'rgbArray', { crossOrigin: 'anonymous' });

  useEffect(() => {
    if (!loading && colorRgb) {
      let [h, s, l] = rgbToHsl(...colorRgb);
      
      s = Math.max(30, Math.min(s, 70));
      l = Math.max(50, Math.min(l, 80)); 
      
      const root = document.documentElement;
      root.style.setProperty('--accent-hue', String(h));
      root.style.setProperty('--accent-saturation', `${s}%`);
      root.style.setProperty('--accent-lightness', `${l}%`);
      root.style.setProperty('--accent-lightness-hover', `${Math.min(l + 10, 90)}%`);
    }
  }, [colorRgb, loading]);

  return null;
};


// --- Reusable / Helper Components ---
interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}
const Modal = ({ isOpen, onClose, title, children }: ModalProps) => !isOpen ? null : (
  <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
    <div className="bg-zinc-900 rounded-2xl p-6 w-full max-w-lg relative" onClick={e => e.stopPropagation()}>
      <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition"><X size={20} /></button>
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      {children}
    </div>
  </div>
);

interface Playlist {
    id: string;
    name: string;
    description: string;
    icon: string;
    url: string;
}
interface PlaylistModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (playlist: Playlist | CustomPlaylist | null) => void;
    title: string;
}

const PlaylistModal = ({ isOpen, onClose, onSelect, title }: PlaylistModalProps) => {
    const { customPlaylists, addCustomPlaylist, updateCustomPlaylist, deleteCustomPlaylist } = useStore();
    const [view, setView] = useState('library'); // 'library', 'custom', 'import'
    const [newPlaylist, setNewPlaylist] = useState({ name: '', url: '' });
    const [editingPlaylist, setEditingPlaylist] = useState<CustomPlaylist | null>(null);

    const handleImport = () => {
        if (newPlaylist.url.trim()) {
            if (editingPlaylist) {
                updateCustomPlaylist({ ...editingPlaylist, ...newPlaylist });
                setEditingPlaylist(null);
            } else {
                addCustomPlaylist(newPlaylist);
            }
            setNewPlaylist({ name: '', url: '' });
            setView('custom');
        }
    };

    const startEdit = (playlist: CustomPlaylist) => {
        setEditingPlaylist(playlist);
        setNewPlaylist({ name: playlist.name, url: playlist.url });
        setView('import');
    };
    
    // Resets state when switching to the 'Import' tab from the tab button
    const handleImportTabClick = () => {
        setView('import');
        setEditingPlaylist(null);
        setNewPlaylist({ name: '', url: '' });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="flex flex-col space-y-4">
                <div className="flex justify-center gap-2 border-b border-zinc-800">
                    <button onClick={() => setView('library')} className={`px-3 sm:px-4 py-2 text-sm font-medium transition-colors ${view === 'library' ? 'text-white border-b-2 border-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Library</button>
                    <button onClick={() => setView('custom')} className={`px-3 sm:px-4 py-2 text-sm font-medium transition-colors ${view === 'custom' ? 'text-white border-b-2 border-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Custom</button>
                    <button onClick={handleImportTabClick} className={`px-3 sm:px-4 py-2 text-sm font-medium transition-colors ${view === 'import' ? 'text-white border-b-2 border-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Import</button>
                </div>

                <div className="min-h-[350px] max-h-[70vh] flex flex-col">
                    {view === 'library' && (
                        <div className="flex-grow overflow-y-auto p-1 sm:p-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {newPlaylists.map(p => (
                                    <button key={p.id} onClick={() => { onSelect(p); onClose(); }} className="bg-zinc-800 rounded-lg p-3 sm:p-4 hover:bg-zinc-700 transition text-left group flex items-center min-h-[5.5rem]">
                                        <div className="flex items-center gap-3 w-full">
                                            <span className="text-3xl flex-shrink-0">{p.icon}</span>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-semibold text-sm mb-1 line-clamp-2 sm:line-clamp-1">{p.name}</h3>
                                                <p className="text-xs text-zinc-400 line-clamp-2 leading-snug">{p.description}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => { onSelect(null); onClose(); }} className="w-full mt-3 bg-zinc-800 rounded-lg p-4 hover:bg-zinc-700 transition flex items-center justify-center gap-3 h-16">
                                <Ban size={18} className="flex-shrink-0" />
                                <span className="font-semibold text-sm">No Playlist</span>
                            </button>
                        </div>
                    )}

                    {view === 'custom' && (
                        <div className="flex-grow overflow-y-auto space-y-2 p-1 sm:p-2">
                            {customPlaylists.map(p => (
                                <div key={p.id} className="bg-zinc-800 rounded-lg p-3 flex justify-between items-center gap-2">
                                    <button onClick={() => { onSelect(p); onClose(); }} className="text-left flex-1 min-w-0">
                                        <h3 className="font-semibold truncate text-sm">{p.name}</h3>
                                        <p className="text-xs text-zinc-400 truncate">{p.url}</p>
                                    </button>
                                    <div className="flex gap-2 flex-shrink-0">
                                        <button onClick={() => startEdit(p)} className="p-1 text-zinc-500 hover:text-white"><Edit size={16} /></button>
                                        <button onClick={() => deleteCustomPlaylist(p.id)} className="p-1 text-zinc-500 hover:text-red-400"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            ))}
                            {customPlaylists.length === 0 && <p className="text-zinc-500 text-sm text-center py-8">No custom playlists. Import one!</p>}
                        </div>
                    )}

                    {view === 'import' && (
                        <div className="flex-grow flex flex-col justify-center p-2 sm:p-4">
                            <div className="space-y-4">
                                <input value={newPlaylist.name} onChange={e => setNewPlaylist({ ...newPlaylist, name: e.target.value })} placeholder="Playlist Name" className="w-full p-3 bg-zinc-800 rounded-lg border border-zinc-700 focus:border-white outline-none" />
                                <input value={newPlaylist.url} onChange={e => setNewPlaylist({ ...newPlaylist, url: e.target.value })} placeholder="YouTube Playlist URL" className="w-full p-3 bg-zinc-800 rounded-lg border border-zinc-700 focus:border-white outline-none" />
                                <button onClick={handleImport} className="w-full py-3 bg-white text-black rounded-full font-bold">{editingPlaylist ? 'Update' : 'Import'}</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

  interface VideoPlayerProps {
    video: Video;
    isRunning: boolean;
  }
  const VideoPlayer = ({ video, isRunning }: VideoPlayerProps) => {
    const playerRef = useRef<YouTubePlayer | null>(null);
    const { playlist, setCurrentVideo, setVolume, toggleShuffle, toggleRepeat, globalVolume } = useStore();
    const { videos, currentIndex, shuffle, repeat } = playlist;
  
    useEffect(() => {
      if (playerRef.current) {
        if (isRunning) {
          playerRef.current.playVideo();
        } else {
          playerRef.current.pauseVideo();
        }
      }
    }, [isRunning]);
  
    if (!video) return <div className="flex flex-col items-center justify-center h-56 bg-zinc-900 rounded-lg"><Music size={40} className="text-zinc-700 mb-2" /><p className="text-sm text-zinc-500">No music loaded</p></div>;
    
    interface BtnProps {
        onClick: () => void;
        disabled?: boolean;
        active?: boolean;
        icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
        title: string;
    }
    const Btn = ({ onClick, disabled, active, icon: Icon, title }: BtnProps) => (
      <button onClick={onClick} disabled={disabled} title={title} className={`p-2 rounded-lg smooth-color-transition ${active ? 'bg-[hsl(var(--accent-hue),var(--accent-saturation),var(--accent-lightness))] text-black hover:bg-[hsl(var(--accent-hue),var(--accent-saturation),var(--accent-lightness-hover))]' : 'bg-zinc-800 hover:bg-zinc-700'} disabled:opacity-50`}>
        <Icon size={18} />
      </button>
    );
  
    return (
      <div className="space-y-4">
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
          <YouTube videoId={video.id} opts={{ width: '100%', height: '100%', playerVars: { autoplay: 1, modestbranding: 1, rel: 0 } }} onReady={(e: { target: YouTubePlayer }) => { playerRef.current = e.target; e.target.setVolume(globalVolume); }} onEnd={() => { if (repeat && playerRef.current) { playerRef.current.seekTo(0); playerRef.current.playVideo(); } else if (currentIndex < videos.length - 1) setCurrentVideo(currentIndex + 1); }} className="w-full h-full" />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Btn onClick={() => currentIndex > 0 && setCurrentVideo(currentIndex - 1)} disabled={currentIndex === 0} icon={SkipBack} title="Previous"/>
            <Btn onClick={() => currentIndex < videos.length - 1 && setCurrentVideo(currentIndex + 1)} disabled={currentIndex === videos.length - 1} icon={SkipForward} title="Next" />
            <Btn onClick={toggleShuffle} active={shuffle} icon={Shuffle} title="Shuffle" />
            <Btn onClick={toggleRepeat} active={repeat} icon={Repeat} title="Repeat" />
          </div>
          <div className="flex items-center gap-2 w-32">
            <Volume2 size={16} className="text-zinc-500" />
            <input type="range" min="0" max="100" value={globalVolume} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { const v = +e.target.value; if (playerRef.current) playerRef.current.setVolume(v); setVolume(v); }} className="w-full accent-[hsl(var(--accent-hue),var(--accent-saturation),var(--accent-lightness))]" />
          </div>
        </div>
      </div>
    );
  };
  
  // --- Main App Component ---
  export default function App() {
    if (!import.meta.env.VITE_YOUTUBE_API_KEY) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="bg-red-950/50 border border-red-900 rounded-2xl p-8 max-w-2xl text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Missing API Key</h1>
            <p className="text-red-300 mb-4">Add VITE_YOUTUBE_API_KEY to your .env file</p>
          </div>
        </div>
      );
    }
  
    // --- ZOOM CONFIGURATION ---
    const autoZoomEnabled = true; // Set to true to automatically fit content to the screen.

    // --- These settings are ONLY used when autoZoomEnabled = true ---
    const autoZoomPadding = 0.03 // e.g., 0.05 means content will use 95% of the screen height.

    // --- These settings are ONLY used when autoZoomEnabled = false ---
    const manualDefaultZoom = 0.7;
    const manualFullscreenZoom = 0.9;

    const store = useStore();
    const { playlist, currentSession, isRunning, timeRemaining, pomodoroStats, focusGoal, pendingPlaylist, breakPlaylist, clockFormat, setClockFormat } = store;
    const currentVideo = playlist.videos[playlist.currentIndex];
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [fullscreen, setFullscreen] = useState(false);
    const [playlistCollapsed, setPlaylistCollapsed] = useState(true);
    const fileRef = useRef<HTMLInputElement>(null);
    const [goal, setGoal] = useState({ mainGoal: '', howToAchieve: '' });
    const [customMin, setCustomMin] = useState('');
    const [time, setTime] = useState(new Date());
    const [activity, setActivity] = useState({ description: '', category: 'Energizing' as 'Energizing' | 'Restorative', duration: 5 });
    const activityCategories = [{ type: 'Energizing', icon: Zap }, { type: 'Restorative', icon: Lightbulb }];
    const [isClockMenuOpen, setIsClockMenuOpen] = useState(false);

    const [dynamicZoom, setDynamicZoom] = useState(1.0);
    const nonFullscreenWrapperRef = useRef<HTMLDivElement>(null);
    const fullscreenContentRef = useRef<HTMLDivElement>(null);
  
    // --- CHANGE 1 of 3: Add new state to hold the calculated container height ---
    const [nonFullscreenHeight, setNonFullscreenHeight] = useState('auto');

    useEffect(() => {
      const handler = () => setFullscreen(!!document.fullscreenElement);
      document.addEventListener('fullscreenchange', handler);
      const t = setInterval(() => setTime(new Date()), 1000);
      
      return () => {
          document.removeEventListener('fullscreenchange', handler);
          clearInterval(t);
      };
    }, []);
    
    useEffect(() => {
      const root = document.documentElement;
      if (!currentVideo) {
        root.style.setProperty('--accent-hue', '0');
        root.style.setProperty('--accent-saturation', '0%');
        root.style.setProperty('--accent-lightness', '70%');
        root.style.setProperty('--accent-lightness-hover', '80%');
      }
    }, [currentVideo]);

    // --- CHANGE 2 of 3: Update the useEffect to calculate and set the container height ---
    useEffect(() => {
        const calculateZoom = () => {
            // --- MANUAL ZOOM LOGIC ---
            if (!autoZoomEnabled) {
                setDynamicZoom(fullscreen ? manualFullscreenZoom : manualDefaultZoom);
                if (!fullscreen) setNonFullscreenHeight('auto'); // Reset height if not auto-zooming
                return; // Exit early
            }

            // --- AUTOMATIC ZOOM LOGIC ---
            const TARGET_VIEWPORT_USAGE = 1 - autoZoomPadding;
            const availableHeight = window.innerHeight;
            const availableWidth = window.innerWidth;

            const contentRef = fullscreen ? fullscreenContentRef.current : nonFullscreenWrapperRef.current;
            if (!contentRef) return;

            const contentHeight = contentRef.scrollHeight;
            const contentWidth = contentRef.scrollWidth;

            if (contentHeight > 0 && contentWidth > 0) {
                const heightRatio = (availableHeight * TARGET_VIEWPORT_USAGE) / contentHeight;
                const widthRatio = (availableWidth * TARGET_VIEWPORT_USAGE) / contentWidth;
                
                const newZoom = Math.min(heightRatio, widthRatio);
                setDynamicZoom(newZoom);

                // This is the key change: calculate the new visual height and set it for the container
                if (!fullscreen) {
                    setNonFullscreenHeight(`${contentHeight * newZoom}px`);
                }
            }
        };

        const timerId = setTimeout(calculateZoom, 50);
        window.addEventListener('resize', calculateZoom);
        
        return () => {
            window.removeEventListener('resize', calculateZoom);
            clearTimeout(timerId);
        };

    }, [
        fullscreen, 
        autoZoomEnabled, 
        manualDefaultZoom, 
        manualFullscreenZoom, 
        autoZoomPadding, 
        playlist.videos,
        currentSession,
        playlistCollapsed
    ]);
  
  
    const loadPlaylist = async (p: Playlist | CustomPlaylist | { url: string, name?: string } | null, isBreak = false) => {
        if (!p) {
            const data = { name: 'None', videos: [], currentIndex: 0, volume: 70, shuffle: true, repeat: false, isPlaying: false, audioOnly: false };
            if (isBreak) {
                store.setBreakPlaylist(data);
            } else {
                store.setPendingPlaylist({ name: 'None', url: '' });
            }
            if ((currentSession === 'work' && !isBreak) || (currentSession === 'break' && isBreak)) {
                store.setPlaylist(data);
            }
            return;
        }
    
        setLoading(true);
        setError('');
        try {
            const videos = await fetchPlaylistVideos(p.url);
            const data = { name: p.name || 'Custom Playlist', videos, currentIndex: Math.floor(Math.random() * videos.length), volume: 70, shuffle: true, repeat: false, isPlaying: true, audioOnly: false };
            if (isBreak) {
                store.setBreakPlaylist(data);
                if (currentSession === 'break') store.setPlaylist(data);
            } else {
                store.setPendingPlaylist({ name: data.name, url: p.url });
                if (currentSession === 'work') store.setPlaylist(data);
            }
        } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load'); }
        finally { setLoading(false); }
    };
  
    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = e => { try { store.importData(e.target?.result as string); alert('Imported!'); } catch { alert('Import failed'); } };
      reader.readAsText(file);
    };
    const footerActions = [
      { label: 'Import', icon: Upload, action: () => fileRef.current?.click(), hover: 'hover:text-white' },
      { label: 'Export', icon: Download, action: store.exportData, hover: 'hover:text-white' },
      { label: 'Clear', icon: Trash2, action: store.clearAllData, hover: 'hover:text-red-400' },
    ];
  
const mainContent = (
    <>
        {error && <div className="mb-4 p-4 bg-red-950/50 border border-red-900 rounded-xl text-red-400">{error}</div>}
        <div className="grid md:grid-cols-2 gap-4 md:gap-8">
            <div className="flex flex-col space-y-4 md:space-y-8">
                <div className="bg-zinc-900 rounded-2xl p-8 flex-grow">
                    <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold">{currentSession === 'work' ? 'Focus Timer' : 'Break Time'}</h2><button onClick={store.resetPomodoro} className="p-2 text-zinc-500 hover:text-white"><RefreshCw size={18} /></button></div>
                    {currentSession === 'work' && focusGoal.mainGoal && <div className="bg-zinc-800 p-4 rounded-lg mb-6"><div className="flex justify-between items-start gap-2"><div><h3 className="font-bold text-lg">{focusGoal.mainGoal}</h3>{focusGoal.howToAchieve && <p className="text-sm text-zinc-400 mt-1">{focusGoal.howToAchieve}</p>}</div><button onClick={() => store.toggleFocusGoalModal(true)} className="p-1.5 text-zinc-500 hover:text-white"><Edit size={14} /></button></div></div>}
                    <div className="flex items-center justify-center gap-2 text-[hsl(var(--accent-hue),var(--accent-saturation),var(--accent-lightness))] mb-6 smooth-color-transition"><CheckCircle size={16} /><span className="text-sm">{pomodoroStats.totalMinutesToday} min today</span></div>
                    <div className="relative mb-8 w-72 h-72 mx-auto rounded-full flex items-center justify-center bg-zinc-800">
                        <div className="text-center">
                            <div className="relative">
                                <div 
                                    className="text-lg font-medium text-zinc-400 mb-2 cursor-pointer hover:text-white transition-colors"
                                    onClick={() => setIsClockMenuOpen(prev => !prev)}
                                >
                                    {time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: clockFormat === '12h' })}
                                </div>
                                {isClockMenuOpen && (
                                    <div 
                                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg z-10"
                                    >
                                        <div className="p-2">
                                            <p className="text-xs text-zinc-500 px-2 pb-1">Clock Format</p>
                                            <button 
                                                onClick={() => { setClockFormat('12h'); setIsClockMenuOpen(false); }} 
                                                className={`w-full px-2 py-1.5 text-left text-sm rounded-md hover:bg-zinc-700 flex justify-between items-center ${clockFormat === '12h' ? 'text-white' : 'text-zinc-400'}`}
                                            >
                                                <span>12-hour</span>
                                                {clockFormat === '12h' && <CheckCircle size={14} />}
                                            </button>
                                            <button 
                                                onClick={() => { setClockFormat('24h'); setIsClockMenuOpen(false); }} 
                                                className={`w-full px-2 py-1.5 text-left text-sm rounded-md hover:bg-zinc-700 flex justify-between items-center ${clockFormat === '24h' ? 'text-white' : 'text-zinc-400'}`}
                                            >
                                                <span>24-hour</span>
                                                {clockFormat === '24h' && <CheckCircle size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="text-7xl font-light mb-6">{`${String(Math.floor(timeRemaining / 60)).padStart(2, '0')}:${String(timeRemaining % 60).padStart(2, '0')}`}</div>
                            <div className="flex justify-center gap-3">
                                <button onClick={isRunning ? store.pauseTimer : () => !focusGoal.mainGoal && currentSession === 'work' ? store.toggleFocusGoalModal(true) : store.startTimer()} className="w-12 h-12 rounded-full bg-[hsl(var(--accent-hue),var(--accent-saturation),var(--accent-lightness))] hover:bg-[hsl(var(--accent-hue),var(--accent-saturation),var(--accent-lightness-hover))] text-black flex items-center justify-center smooth-color-transition\">{isRunning ? <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>}</button>
                                <button onClick={store.resetTimer} className="w-12 h-12 rounded-full bg-zinc-700 hover:bg-zinc-600 flex items-center justify-center transition"><RotateCcw size={20} /></button>
                                <button onClick={store.skipSession} className="w-12 h-12 rounded-full bg-zinc-700 hover:bg-zinc-600 flex items-center justify-center transition"><SkipForward size={20} /></button>
                            </div>
                        </div>
                    </div>
                    {!isRunning && <div className="space-y-3"><div className="grid grid-cols-4 gap-2">{(currentSession === 'work' ? [15, 25, 45, 60] : [5, 10, 15, 20]).map(m => (<button key={m} onClick={() => { store.updateSettings(currentSession === 'work' ? { workDuration: m * 60 } : { breakDuration: m * 60 }); store.resetTimer(); }} className={`py-2.5 rounded-lg text-sm font-medium smooth-color-transition ${timeRemaining === m * 60 ? 'bg-[hsl(var(--accent-hue),var(--accent-saturation),var(--accent-lightness))] text-black' : 'bg-zinc-700 hover:bg-zinc-600'}`}>{m}m</button>))}</div><div className="flex gap-2"><input value={customMin} onChange={e => setCustomMin(e.target.value)} onKeyDown={e => e.key === 'Enter' && +customMin && (store.updateSettings(currentSession === 'work' ? { workDuration: +customMin * 60 } : { breakDuration: +customMin * 60 }), store.resetTimer(), setCustomMin(''))} placeholder="Custom min" className="flex-1 px-4 py-2.5 bg-zinc-700 rounded-lg border border-zinc-600 focus:border-[hsl(var(--accent-hue),var(--accent-saturation),var(--accent-lightness))] outline-none text-sm smooth-color-transition" /><button onClick={() => +customMin && (store.updateSettings(currentSession === 'work' ? { workDuration: +customMin * 60 } : { breakDuration: +customMin * 60 }), store.resetTimer(), setCustomMin(''))} className="px-4 py-2.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm font-medium">Set</button></div></div>}
                </div>
                {currentSession === 'break' && <div className="bg-zinc-900 rounded-2xl p-6 space-y-4"><h2 className="text-xl font-bold">Break Activities</h2>{activityCategories.map(({ type, icon: Icon }) => (<div key={type}><h3 className="flex items-center gap-2 font-semibold text-[hsl(var(--accent-hue),var(--accent-saturation),var(--accent-lightness))] mb-3 smooth-color-transition"><Icon size={18} />{type}</h3><ul className="space-y-2">{store.breakActivities.filter(a => a.category === type).map(a => (<li key={a.id} className="flex justify-between items-center bg-zinc-800 p-3 rounded-lg"><span className="text-sm text-zinc-300">[{a.duration}m] {a.description}</span><button onClick={() => store.deleteBreakActivity(a.id)} className="text-zinc-500 hover:text-red-400"><Trash2 size={14} /></button></li>))}</ul></div>))}<div className="border-t border-zinc-800 pt-4 space-y-3"><input value={activity.description} onChange={e => setActivity({ ...activity, description: e.target.value })} onKeyDown={e => e.key === 'Enter' && activity.description.trim() && (store.addBreakActivity(activity), setActivity({ description: '', category: 'Energizing', duration: 5 }))} placeholder="New activity..." className="w-full px-4 py-2 bg-zinc-800 rounded-lg border border-zinc-700 focus:border-[hsl(var(--accent-hue),var(--accent-saturation),var(--accent-lightness))] outline-none smooth-color-transition" /><div className="flex gap-2"><select value={activity.category} onChange={e => setActivity({ ...activity, category: e.target.value as 'Energizing' | 'Restorative' })} className="px-4 py-2 bg-zinc-800 rounded-lg border border-zinc-700 focus:border-[hsl(var(--accent-hue),var(--accent-saturation),var(--accent-lightness))] outline-none smooth-color-transition"><option>Energizing</option><option>Restorative</option></select><input type="number" min="1" value={activity.duration} onChange={e => setActivity({ ...activity, duration: +e.target.value })} className="w-20 px-4 py-2 bg-zinc-800 rounded-lg border border-zinc-700 focus:border-[hsl(var(--accent-hue),var(--accent-saturation),var(--accent-lightness))] outline-none smooth-color-transition" /><button onClick={() => activity.description.trim() && (store.addBreakActivity(activity), setActivity({ description: '', category: 'Energizing', duration: 5 }))} className="flex-1 px-4 py-2 bg-[hsl(var(--accent-hue),var(--accent-saturation),var(--accent-lightness))] hover:bg-[hsl(var(--accent-hue),var(--accent-saturation),var(--accent-lightness-hover))] text-black rounded-lg font-bold flex items-center justify-center gap-2 smooth-color-transition"><Plus size={16} />Add</button></div></div></div>}
            </div>
            <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl">
                <div className="p-6 border-b border-zinc-800 space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center text-sm">
                        <div>
                            <p className="text-zinc-500">Focus: <span className="text-white font-medium">{pendingPlaylist.name || 'None'}</span></p>
                            <p className="text-zinc-500">Break: <span className="text-white font-medium">{breakPlaylist.name || 'None'}</span></p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                            <button onClick={() => setActiveModal('focusPlaylist')} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition text-xs">Set Focus</button>
                            <button onClick={() => setActiveModal('breakPlaylist')} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition text-xs">Set Break</button>
                        </div>
                    </div>
                </div>
                <div className="p-6 space-y-6">
                    {loading ? <div className="h-56 bg-zinc-800 rounded-lg animate-pulse" /> : playlist.videos.length ? <><VideoPlayer video={currentVideo} isRunning={isRunning} /><div className="bg-zinc-900 rounded-xl overflow-hidden"><div className="p-3 border-b border-zinc-800 flex justify-between items-center cursor-pointer" onClick={() => setPlaylistCollapsed(!playlistCollapsed)}><h3 className="text-sm text-zinc-400">Playlist • {playlist.videos.length} videos</h3><button className="text-zinc-500 hover:text-white">{playlistCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}</button></div>{!playlistCollapsed && <div className="max-h-96 overflow-y-auto">{playlist.videos.map((v, i) => (<button key={v.id} onClick={() => store.setCurrentVideo(i)} className={`w-full p-3 flex items-start gap-3 hover:bg-zinc-800 transition ${playlist.currentIndex === i ? 'bg-zinc-800' : ''}`}><img src={`https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`} alt="" className="w-20 h-12 object-cover rounded" /><div className="flex-1 min-w-0 text-left"><p className="text-xs font-medium line-clamp-2 mb-1">{v.title}</p><p className="text-[10px] text-zinc-500">{v.duration}</p></div></button>))}</div>}</div></> : <div className="flex flex-col items-center justify-center h-56 bg-zinc-800/50 rounded-xl border-2 border-dashed border-zinc-700"><Music size={40} className="text-zinc-700 mb-2" /><p className="text-zinc-500">Choose a playlist to get started</p></div>}
                </div>
            </div>
        </div>
    </>
)

    return (
        <div className="min-h-screen bg-black text-white">
            {currentVideo && <AccentColorExtractor videoId={currentVideo.id} />}
            <Modal isOpen={store.isFocusGoalModalOpen} onClose={() => store.toggleFocusGoalModal(false)} title="Set Your Focus">
                <div className="space-y-4">
                    <textarea value={goal.mainGoal} onChange={e => setGoal({ ...goal, mainGoal: e.target.value })} placeholder="What do you want to accomplish?" className="w-full p-3 bg-zinc-800 rounded-lg border border-zinc-700 focus:border-[hsl(var(--accent-hue),var(--accent-saturation),var(--accent-lightness))] outline-none smooth-color-transition" rows={3} />
                    <textarea value={goal.howToAchieve} onChange={e => setGoal({ ...goal, howToAchieve: e.target.value })} placeholder="Break it down..." className="w-full p-3 bg-zinc-800 rounded-lg border border-zinc-700 focus:border-[hsl(var(--accent-hue),var(--accent-saturation),var(--accent-lightness))] outline-none smooth-color-transition" rows={4} />
                    <button onClick={() => { store.setFocusGoal(goal); store.toggleFocusGoalModal(false); store.startTimer(); }} className="w-full py-3 bg-[hsl(var(--accent-hue),var(--accent-saturation),var(--accent-lightness))] hover:bg-[hsl(var(--accent-hue),var(--accent-saturation),var(--accent-lightness-hover))] text-black rounded-full font-bold smooth-color-transition\">Start Focusing</button>
                </div>
            </Modal>
            <PlaylistModal isOpen={activeModal === 'focusPlaylist'} onClose={() => setActiveModal(null)} onSelect={p => loadPlaylist(p, false)} title="Set Focus Playlist" />
            <PlaylistModal isOpen={activeModal === 'breakPlaylist'} onClose={() => setActiveModal(null)} onSelect={p => loadPlaylist(p, true)} title="Set Break Playlist" />
            
            {fullscreen ? (
                <main className="h-screen w-screen flex items-center justify-center overflow-hidden">
                    <div 
                        ref={fullscreenContentRef} 
                        className="max-w-7xl w-full" 
                        style={{ transform: `scale(${dynamicZoom})`, transition: 'transform 0.2s ease-out' }}
                    >
                        {mainContent}
                    </div>
                </main>
            ) : (
                // --- CHANGE 3 of 3: Wrap the non-fullscreen content in a new div with the dynamic height ---
                <div style={{ height: nonFullscreenHeight, transition: 'height 0.2s ease-out' }}>
                    <div 
                        ref={nonFullscreenWrapperRef}
                        className="max-w-7xl mx-auto"
                        style={{ transform: `scale(${dynamicZoom})`, transformOrigin: 'center top', transition: 'transform 0.2s ease-out' }}
                    >
                        <header className="p-6 flex justify-between items-center">
                            <h1 className="text-3xl font-bold text-[hsl(var(--accent-hue),var(--accent-saturation),var(--accent-lightness))] smooth-color-transition\">FocusDJ</h1>
                            <button onClick={() => !document.fullscreenElement ? document.documentElement.requestFullscreen() : document.exitFullscreen()} className="p-2 text-zinc-500 hover:text-white transition\"><Maximize size={20} /></button>
                        </header>
                        <main className="px-6 pb-8">
                            {mainContent}
                        </main>
                        <footer className="mt-0 py-1 px-6 border-t border-zinc-900">
                            <div className="flex justify-between items-center text-sm">
                                <div className="flex gap-4">{footerActions.map(({ label, icon: Icon, action, hover }) => <button key={label} onClick={action} className={`flex items-center gap-2 text-zinc-500 transition ${hover}`}><Icon size={14} />{label}</button>)}<input ref={fileRef} type="file" onChange={handleImport} className="hidden" accept=".json" /></div>
                                <p className="text-xs text-zinc-600">Keep tab active for autoplay</p>
                            </div>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
  }
