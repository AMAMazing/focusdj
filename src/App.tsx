import React, { useState, useEffect, useRef } from 'react';
import { useStore } from './store/useStore';
import { fetchPlaylistVideos } from './utils/youtube';
import { Music, Maximize, Lightbulb, Zap, Plus, Trash2, X, Upload, Download, SkipBack, SkipForward, Volume2, ChevronDown, ChevronUp, RotateCcw, Edit, RefreshCw, Shuffle, Repeat, CheckCircle, Ban, LucideProps, ArrowLeft, Flame, Activity as ActivityIcon, Coffee } from 'lucide-react';
import YouTube from 'react-youtube';
import { newPlaylists, SubPlaylist } from './data/playlists';
import { useColor } from 'color-thief-react';
import { Video } from './types';
import { CustomPlaylist } from './store/useStore';
import { EMOJIS } from './data/emojis';

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
      
      s = Math.max(40, Math.min(s, 80));
      l = Math.max(55, Math.min(l, 75)); 
      
      const root = document.documentElement;
      root.style.setProperty('--accent-hue', String(h));
      root.style.setProperty('--accent-saturation', `${s}%`);
      root.style.setProperty('--accent-lightness', `${l}%`);
      root.style.setProperty('--accent-lightness-hover', `${Math.min(l + 10, 85)}%`);
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
  <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
    <div className="bg-zinc-900 rounded-3xl p-8 w-full max-w-lg relative border border-zinc-800 shadow-2xl" onClick={e => e.stopPropagation()}>
      <button onClick={onClose} className="absolute top-6 right-6 text-zinc-500 hover:text-white transition"><X size={22} /></button>
      <h2 className="text-2xl font-bold mb-6">{title}</h2>
      {children}
    </div>
  </div>
);

interface ToggleSwitchProps {
    checked: boolean;
    onChange: () => void;
    id?: string;
}
const ToggleSwitch = ({ checked, onChange, id }: ToggleSwitchProps) => (
    <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent-hue),var(--accent-saturation),var(--accent-lightness))] focus:ring-offset-2 focus:ring-offset-zinc-900 ${
            checked ? 'bg-[hsl(var(--accent-hue),var(--accent-saturation),var(--accent-lightness))]' : 'bg-zinc-700'
        }`}
    >
        <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
            }`}
        />
    </button>
);

interface Playlist {
    id: string;
    name: string;
    description: string;
    icon: string;
    url?: string;
    subPlaylists?: SubPlaylist[];
}
interface PlaylistModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (playlist: Playlist | CustomPlaylist | SubPlaylist[] | null) => void;
    title: string;
}

const PlaylistModal = ({ isOpen, onClose, onSelect, title }: PlaylistModalProps) => {
    const { customPlaylists, addCustomPlaylist, updateCustomPlaylist, deleteCustomPlaylist } = useStore();
    const [view, setView] = useState('library');
    const [newPlaylist, setNewPlaylist] = useState({ name: '', url: '' });
    const [editingPlaylist, setEditingPlaylist] = useState<CustomPlaylist | null>(null);
    const [activeGroup, setActiveGroup] = useState<Playlist | null>(null);
    const [selectedSubPlaylists, setSelectedSubPlaylists] = useState<SubPlaylist[]>([]);

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
    
    const handleImportTabClick = () => {
        setView('import');
        setEditingPlaylist(null);
        setNewPlaylist({ name: '', url: '' });
    };

    const handleSubPlaylistToggle = (subPlaylist: SubPlaylist) => {
        setSelectedSubPlaylists(prev => 
            prev.some(p => p.url === subPlaylist.url)
                ? prev.filter(p => p.url !== subPlaylist.url)
                : [...prev, subPlaylist]
        );
    };

    const handleMixSelect = () => {
        if (selectedSubPlaylists.length > 0) {
            onSelect(selectedSubPlaylists);
            onClose();
        }
    };
    
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setActiveGroup(null);
                setSelectedSubPlaylists([]);
                setView('library');
            }, 200);
        }
    }, [isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={activeGroup ? `Select from ${activeGroup.name}` : title}>
            <div className="flex flex-col space-y-4">
                {activeGroup ? (
                    <>
                        <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                           <button onClick={() => setActiveGroup(null)} className="p-1 text-zinc-500 hover:text-white"><ArrowLeft size={18} /></button>
                           <h3 className="font-semibold">{activeGroup.name}</h3>
                        </div>
                        <div className="min-h-[350px] max-h-[70vh] flex flex-col space-y-3 p-1">
                            <div className="flex-grow overflow-y-auto space-y-2">
                                {activeGroup.subPlaylists?.map(sp => (
                                    <label key={sp.url} className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg hover:bg-zinc-700 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedSubPlaylists.some(p => p.url === sp.url)} 
                                            onChange={() => handleSubPlaylistToggle(sp)}
                                            className="h-5 w-5 rounded bg-zinc-700 border-zinc-600 text-[hsl(var(--accent-hue),var(--accent-saturation),var(--accent-lightness))] focus:ring-[hsl(var(--accent-hue),var(--accent-saturation),var(--accent-lightness))]"
                                        />
                                        <span className="text-sm font-medium">{sp.name}</span>
                                    </label>
                                ))}
                            </div>
                           <button onClick={handleMixSelect} disabled={selectedSubPlaylists.length === 0} className="w-full py-3 bg-white text-black rounded-full font-bold disabled:bg-zinc-600 disabled:text-zinc-400">
                                Mix {selectedSubPlaylists.length} Playlist{selectedSubPlaylists.length !== 1 && 's'}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
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
                                            <button key={p.id} onClick={() => { 
                                                if (p.subPlaylists && p.subPlaylists.length > 0) {
                                                    setActiveGroup(p);
                                                    setSelectedSubPlaylists(p.subPlaylists);
                                                } else {
                                                    onSelect(p); 
                                                    onClose(); 
                                                }
                                            }} className="bg-zinc-800 rounded-lg p-3 sm:p-4 hover:bg-zinc-700 transition text-left group flex items-center min-h-[5.5rem]">
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
                    </>
                )}
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
    const { playlist, setCurrentVideo, setVolume, toggleRepeat, globalVolume, setPlaylist } = useStore();
    const { videos, currentIndex, repeat } = playlist;
  
    useEffect(() => {
      if (playerRef.current) {
        if (isRunning) {
          playerRef.current.playVideo();
        } else {
          playerRef.current.pauseVideo();
        }
      }
    }, [isRunning]);
  
    if (!video) return <div className="flex flex-col items-center justify-center h-56 bg-zinc-900/50 rounded-2xl border border-zinc-800"><Music size={48} className="text-zinc-700 mb-3" /><p className="text-sm text-zinc-500">No music loaded</p></div>;
    
    const handleShuffleClick = () => {
        if (videos.length > currentIndex + 1) {
            const currentAndPlayed = videos.slice(0, currentIndex + 1);
            const upcoming = videos.slice(currentIndex + 1);

            for (let i = upcoming.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [upcoming[i], upcoming[j]] = [upcoming[j], upcoming[i]];
            }

            const newVideoList = [...currentAndPlayed, ...upcoming];
            setPlaylist({ ...playlist, videos: newVideoList, shuffle: false });
        }
    };
    
    interface BtnProps {
        onClick: () => void;
        disabled?: boolean;
        active?: boolean;
        icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
        title: string;
    }
    const Btn = ({ onClick, disabled, active, icon: Icon, title }: BtnProps) => (
      <button onClick={onClick} disabled={disabled} title={title} className={`p-3 rounded-xl smooth-color-transition ${active ? 'bg-[hsl(var(--accent-hue),var(--accent-saturation),var(--accent-lightness))] text-black hover:bg-[hsl(var(--accent-hue),var(--accent-saturation),var(--accent-lightness-hover))] shadow-lg' : 'bg-zinc-800/50 hover:bg-zinc-700/50'} disabled:opacity-40 backdrop-blur-sm transition-all duration-200`}>
        <Icon size={20} />
      </button>
    );
  
    return (
      <div className="space-y-5">
        <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-zinc-800">
          <YouTube videoId={video.id} opts={{ width: '100%', height: '100%', playerVars: { autoplay: 1, modestbranding: 1, rel: 0 } }} onReady={(e: { target: YouTubePlayer }) => { playerRef.current = e.target; e.target.setVolume(globalVolume); }} onEnd={() => { if (repeat && playerRef.current) { playerRef.current.seekTo(0); playerRef.current.playVideo(); } else if (currentIndex < videos.length - 1) setCurrentVideo(currentIndex + 1); }} className="w-full h-full" />
        </div>
        <div className="flex items-center justify-between gap-4 px-2">
          <div className="flex items-center gap-2">
            <Btn onClick={() => currentIndex > 0 && setCurrentVideo(currentIndex - 1)} disabled={currentIndex === 0} icon={SkipBack} title="Previous"/>
            <Btn onClick={() => currentIndex < videos.length - 1 && setCurrentVideo(currentIndex + 1)} disabled={currentIndex === videos.length - 1} icon={SkipForward} title="Next" />
            <Btn onClick={handleShuffleClick} active={false} icon={Shuffle} title="Shuffle Upcoming" />
            <Btn onClick={toggleRepeat} active={repeat} icon={Repeat} title="Repeat" />
          </div>
          <div className="flex items-center gap-3 w-40">
            <Volume2 size={18} className="text-zinc-400" />
            <input type="range" min="0" max="100" value={globalVolume} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { const v = +e.target.value; if (playerRef.current) playerRef.current.setVolume(v); setVolume(v); }} className="w-full accent-[hsl(var(--accent-hue),var(--accent-saturation),var(--accent-lightness))] h-2" />
          </div>
        </div>
      </div>
    );
  };

const ContributionGraph = () => {
    const { contributionData } = useStore();
    const today = new Date();
    const endDate = new Date(today.setDate(today.getDate() + (6 - today.getDay()))); 
    const startDate = new Date(new Date().setDate(endDate.getDate() - 83));

    const dates = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d));
    }

    const getColor = (count: number) => {
        if (count >= 4) return 'bg-emerald-500';
        if (count >= 3) return 'bg-emerald-600';
        if (count >= 2) return 'bg-emerald-700';
        if (count >= 1) return 'bg-emerald-800';
        return 'bg-zinc-800';
    };

    return (
        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
            <h3 className="text-lg font-bold mb-4">Activity</h3>
            <div className="grid grid-cols-12 gap-1.5">
                {dates.map(date => {
                    const dateString = date.toISOString().split('T')[0];
                    const count = contributionData[dateString] || 0;
                    return <div key={dateString} className={`w-full aspect-square rounded-sm ${getColor(count)} transition-colors`} title={`${count} sessions on ${date.toDateString()}`} />;
                })}
            </div>
        </div>
    );
};

const Stats = () => {
    const { streak, totalSessions } = useStore();
    return (
        <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-zinc-800/50 backdrop-blur-sm p-5 rounded-2xl border border-zinc-700">
                <p className="text-3xl font-bold flex items-center justify-center gap-2">{streak.current} <Flame size={24} className={streak.current > 0 ? 'text-orange-400' : 'text-zinc-600'} /></p>
                <p className="text-xs text-zinc-400 mt-1">Current Streak</p>
            </div>
            <div className="bg-zinc-800/50 backdrop-blur-sm p-5 rounded-2xl border border-zinc-700">
                <p className="text-3xl font-bold">{streak.longest}</p>
                <p className="text-xs text-zinc-400 mt-1">Longest Streak</p>
            </div>
            <div className="bg-zinc-800/50 backdrop-blur-sm p-5 rounded-2xl border border-zinc-700">
                <p className="text-3xl font-bold">{totalSessions}</p>
                <p className="text-xs text-zinc-400 mt-1">Total Sessions</p>
            </div>
        </div>
    );
}

const DailyGoalTracker = () => {
    const { pomodoroStats, dailyGoal, setDailyGoal, isRunning, currentSession } = useStore();
    const [editingGoal, setEditingGoal] = useState(false);
    const [newGoal, setNewGoal] = useState(dailyGoal);
    const [liveSeconds, setLiveSeconds] = useState(0);
    const [isGoalVisible, setIsGoalVisible] = useState(true);

    useEffect(() => {
        if (isRunning && currentSession === 'work') {
            const interval = setInterval(() => {
                setLiveSeconds(prev => prev + 1);
            }, 1000);
            return () => clearInterval(interval);
        } else {
            setLiveSeconds(0);
        }
    }, [isRunning, currentSession]);

    const baseMinutes = Math.floor(pomodoroStats.minutesFocused || 0);
    const totalSeconds = (baseMinutes * 60) + liveSeconds;
    const minutesFocused = Math.floor(totalSeconds / 60);
    const progress = Math.min((totalSeconds / (dailyGoal * 60)) * 100, 100);
    const goalMet = minutesFocused >= dailyGoal;

    const handleGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewGoal(parseInt(e.target.value, 10));
    };

    const handleGoalSave = () => {
        if (newGoal > 0) {
            setDailyGoal(newGoal);
        }
        setEditingGoal(false);
    };

    return (
        <div className={`p-5 rounded-2xl border transition-all duration-300 ${goalMet && isGoalVisible ? 'bg-emerald-950/30 border-emerald-800/50' : 'bg-zinc-800/30 border-zinc-700'}`}>
            <div className={`flex justify-between items-center ${isGoalVisible ? 'mb-3' : ''}`}>
                <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{goalMet && isGoalVisible ? "🎉 Goal Achieved!" : "Today's Goal"}</p>
                    <button onClick={() => setIsGoalVisible(!isGoalVisible)} className="text-zinc-500 hover:text-white transition">
                        {isGoalVisible ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                </div>
                {isGoalVisible && (
                    editingGoal ? (
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={newGoal}
                                onChange={handleGoalChange}
                                className="w-20 bg-zinc-700 text-white text-right rounded-lg px-3 py-1.5 text-sm border border-zinc-600 focus:border-[hsl(var(--accent-hue),var(--accent-saturation),var(--accent-lightness))] outline-none"
                            />
                            <button onClick={handleGoalSave} className="text-emerald-400 text-sm font-medium">Save</button>
                        </div>
                    ) : (
                        <p 
                            className={`text-sm font-bold cursor-pointer ${goalMet ? 'text-emerald-400' : 'text-white'}`}
                            onClick={() => setEditingGoal(true)}
                        >
                            {minutesFocused} / {dailyGoal} min
                        </p>
                    )
                )}
            </div>
            {isGoalVisible && (
                <div className="w-full bg-zinc-700/50 rounded-full h-3 overflow-hidden">
                    <div 
                        className={`h-3 rounded-full transition-all duration-500 ${goalMet ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-[hsl(var(--accent-hue),var(--accent-saturation),var(--accent-lightness))]'}`} 
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            )}
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
  
    const autoZoomEnabled = true;
    const autoZoomPadding = 0.03
    const manualDefaultZoom = 0.7;
    const manualFullscreenZoom = 0.9;

    const store = useStore();
    const { 
        playlist, currentSession, isRunning, timeRemaining, focusGoal, 
        pendingPlaylist, breakPlaylist, clockFormat, setClockFormat, 
        settings, pauseTimer, showGoalOnDashboard, toggleShowGoalOnDashboard 
    } = store;
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
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [isBreakActivityModalOpen, setIsBreakActivityModalOpen] = useState(false);

    const [dynamicZoom, setDynamicZoom] = useState(1.0);
    const nonFullscreenWrapperRef = useRef<HTMLDivElement>(null);
    const fullscreenContentRef = useRef<HTMLDivElement>(null);
    const [nonFullscreenHeight, setNonFullscreenHeight] = useState('auto');
    const [celebrate, setCelebrate] = useState(false);

    const [workDurationWasSet, setWorkDurationWasSet] = useState(
      () => localStorage.getItem('workDurationWasSet') === 'true'
    );
    const [breakDurationWasSet, setBreakDurationWasSet] = useState(
      () => localStorage.getItem('breakDurationWasSet') === 'true'
    );
    const sessionRef = useRef(currentSession);

    useEffect(() => {
      if (sessionRef.current !== currentSession) {
        store.resetTimer();
        if (isRunning) {
          if (currentSession === 'break' && !breakDurationWasSet) {
            pauseTimer();
          } else if (currentSession === 'work' && !workDurationWasSet) {
            pauseTimer();
          }
        }
        sessionRef.current = currentSession;
      }
    }, [currentSession, isRunning, pauseTimer, workDurationWasSet, breakDurationWasSet, store]);

    const totalDuration = currentSession === 'work' ? settings.workDuration : settings.breakDuration;
    const progress = totalDuration > 0 ? (totalDuration - timeRemaining) / totalDuration : 0;

    useEffect(() => {
        if (celebrate) {
            const timer = setTimeout(() => setCelebrate(false), 1000);
            return () => clearTimeout(timer);
        }
    }, [celebrate]);

    useEffect(() => {
        if (currentSession === 'break') {
            setCelebrate(true);
        }
    }, [currentSession]);


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
        const params = new URLSearchParams(window.location.search);
        const playlistIds = params.get('playlists')?.split(',');

        if (playlistIds && playlistIds.length > 0) {
            const playlistsFromUrl = newPlaylists.filter(p => playlistIds.includes(p.id));
            
            const itemsToLoad: SubPlaylist[] = playlistsFromUrl.flatMap(p => {
                if (p.subPlaylists && p.subPlaylists.length > 0) {
                    return p.subPlaylists;
                }
                if (p.url) {
                    return [{ name: p.name, url: p.url }];
                }
                return [];
            });

            if (itemsToLoad.length > 0) {
                loadPlaylist(itemsToLoad, false);
            }
        }
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

    useEffect(() => {
        const calculateZoom = () => {
            if (!autoZoomEnabled) {
                setDynamicZoom(fullscreen ? manualFullscreenZoom : manualDefaultZoom);
                if (!fullscreen) setNonFullscreenHeight('auto');
                return;
            }

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
  
  
    const loadPlaylist = async (p: Playlist | CustomPlaylist | SubPlaylist[] | { url: string, name?: string } | null, isBreak = false) => {
        if (!p) {
            const data = { name: 'None', videos: [], currentIndex: 0, volume: 70, shuffle: false, repeat: false, isPlaying: false, audioOnly: false };
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
            let videos: Video[] = [];
            let playlistName = 'Custom Mix';
            let playlistUrl = '';

            if (Array.isArray(p)) {
                const videoPromises = p.map(sp => fetchPlaylistVideos(sp.url, sp.yearAfter, sp.indexLimit));
                const videoArrays = await Promise.all(videoPromises);
                videos = videoArrays.flat();
                playlistName = `${p.length} Playlist Mix`;
                playlistUrl = p.map(sp => sp.url).join(',');
            } else if ('url' in p && p.url) {
                videos = await fetchPlaylistVideos(p.url);
                playlistName = p.name || 'Custom Playlist';
                playlistUrl = p.url;
            } else {
                throw new Error("Invalid playlist format provided.");
            }
            
            for (let i = videos.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [videos[i], videos[j]] = [videos[j], videos[i]];
            }

            const data = { name: playlistName, videos, currentIndex: 0, volume: 70, shuffle: false, repeat: false, isPlaying: true, audioOnly: false };
            
            if (isBreak) {
                store.setBreakPlaylist(data);
                if (currentSession === 'break') store.setPlaylist(data);
            } else {
                store.setPendingPlaylist({ name: data.name, url: playlistUrl });
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
      { label: 'Activity', icon: ActivityIcon, action: () => setIsActivityModalOpen(true), hover: 'hover:text-white' },
      { label: 'Break Activities', icon: Coffee, action: () => setIsBreakActivityModalOpen(true), hover: 'hover:text-white' },
      { label: 'Import', icon: Upload, action: () => fileRef.current?.click(), hover: 'hover:text-white' },
      { label: 'Export', icon: Download, action: store.exportData, hover: 'hover:text-white' },
      { label: 'Clear', icon: Trash2, action: store.clearAllData, hover: 'hover:text-red-400' },
    ];

    const handleStartTimer = () => {
        if (currentSession === 'work' && !focusGoal.mainGoal && timeRemaining === settings.workDuration) {
            store.toggleFocusGoalModal(true);
        } else {
            store.startTimer();
        }
    };
    
    const handleDurationSet = (minutes: number) => {
      const newDuration = minutes * 60;
      if (currentSession === 'work') {
        store.updateSettings({ workDuration: newDuration });
        setWorkDurationWasSet(true);
        localStorage.setItem('workDurationWasSet', 'true');
      } else {
        store.updateSettings({ breakDuration: newDuration });
        setBreakDurationWasSet(true);
        localStorage.setItem('breakDurationWasSet', 'true');
      }
      store.resetTimer();
    };
  
const mainContent = (
    <>
        {error && <div className="mb-6 p-5 bg-red-950/50 border border-red-900 rounded-2xl text-red-400 text-sm">{error}</div>}
        <div className="grid md:grid-cols-2 gap-6 md:gap-10">
            <div className="flex flex-col space-y-6">
                <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/80 rounded-3xl p-10 flex-grow border border-zinc-800 shadow-2xl backdrop-blur-sm">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-bold">{currentSession === 'work' ? '🎯 Focus Timer' : '☕ Break Time'}</h2>
                        <button onClick={store.resetPomodoro} className="p-2.5 text-zinc-500 hover:text-white transition-colors rounded-xl hover:bg-zinc-800"><RefreshCw size={20} /></button>
                    </div>
                    {currentSession === 'work' && focusGoal.mainGoal && (
                        <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-800/50 backdrop-blur-sm p-5 rounded-2xl mb-8 border border-zinc-700">
                            <div className="flex justify-between items-start gap-3">
                                <div>
                                    <h3 className="font-bold text-xl leading-tight mb-2">{focusGoal.mainGoal}</h3>
                                    {focusGoal.howToAchieve && <p className="text-sm text-zinc-400 leading-relaxed">{focusGoal.howToAchieve}</p>}
                                </div>
                                <button onClick={() => store.toggleFocusGoalModal(true)} className="p-2 text-zinc-500 hover:text-white transition-colors rounded-lg hover:bg-zinc-700/50"><Edit size={16} /></button>
                            </div>
                        </div>
                    )}
                    <div className={`relative mb-10 w-96 h-96 mx-auto transition-transform duration-500 ${celebrate ? 'animate-bounce' : ''}`}>
                        <svg width="384" height="384" viewBox="0 0 384 384" className="absolute inset-0 transform -rotate-90" style={{ overflow: 'visible' }}>
                            <circle className="text-zinc-800/50" stroke="currentColor" strokeWidth="24" fill="transparent" r="180" cx="192" cy="192" />
                            <circle
                                className="smooth-color-transition"
                                stroke="hsl(var(--accent-hue), var(--accent-saturation), var(--accent-lightness))"
                                strokeWidth="24"
                                strokeLinecap="round"
                                fill="transparent"
                                r="180"
                                cx="192"
                                cy="192"
                                pathLength="1"
                                strokeDasharray="1"
                                strokeDashoffset={1 - progress}
                                style={{ 
                                    transition: 'stroke-dashoffset 1s linear', 
                                    filter: 'drop-shadow(0 0 20px hsl(var(--accent-hue), var(--accent-saturation), var(--accent-lightness)))' 
                                }}
                            />
                        </svg>
                        <div className="relative w-full h-full rounded-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                            <div className="text-center z-10">
                                <div className="relative mb-2">
                                    <div 
                                        className="text-2xl font-semibold text-zinc-400 mb-4 cursor-pointer hover:text-white transition-colors"
                                        onClick={() => setIsClockMenuOpen(prev => !prev)}
                                    >
                                        {time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: clockFormat === '12h' })}
                                    </div>
                                    {isClockMenuOpen && (
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl z-10">
                                            <div className="p-3">
                                                <p className="text-xs text-zinc-500 px-2 pb-2 font-medium">Clock Format</p>
                                                <button 
                                                    onClick={() => { setClockFormat('12h'); setIsClockMenuOpen(false); }} 
                                                    className={`w-full px-3 py-2 text-left text-sm rounded-lg hover:bg-zinc-700 flex justify-between items-center transition ${clockFormat === '12h' ? 'text-white bg-zinc-700/50' : 'text-zinc-400'}`}
                                                >
                                                    <span>12-hour</span>
                                                    {clockFormat === '12h' && <CheckCircle size={16} className="text-[hsl(var(--accent-hue),var(--accent-saturation),var(--accent-lightness))]" />}
                                                </button>
                                                <button 
                                                    onClick={() => { setClockFormat('24h'); setIsClockMenuOpen(false); }} 
                                                    className={`w-full px-3 py-2 text-left text-sm rounded-lg hover:bg-zinc-700 flex justify-between items-center transition ${clockFormat === '24h' ? 'text-white bg-zinc-700/50' : 'text-zinc-400'}`}
                                                >
                                                    <span>24-hour</span>
                                                    {clockFormat === '24h' && <CheckCircle size={16} className="text-[hsl(var(--accent-hue),var(--accent-saturation),var(--accent-lightness))]" />}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="text-8xl font-extralight tracking-tight mb-8 tabular-nums">{`${String(Math.floor(timeRemaining / 60)).padStart(2, '0')}:${String(timeRemaining % 60).padStart(2, '0')}`}</div>
                                <div className="flex justify-center gap-4">
                                    <button 
                                        onClick={isRunning ? store.pauseTimer : handleStartTimer} 
                                        className="w-16 h-16 rounded-2xl bg-[hsl(var(--accent-hue),var(--accent-saturation),var(--accent-lightness))] hover:bg-[hsl(var(--accent-hue),var(--accent-saturation),var(--accent-lightness-hover))] text-black flex items-center justify-center smooth-color-transition shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
                                    >
                                        {isRunning ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                                        )}
                                    </button>
                                    <button 
                                        onClick={store.resetTimer} 
                                        className="w-16 h-16 rounded-2xl bg-zinc-700/50 hover:bg-zinc-600/50 backdrop-blur-sm flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
                                    >
                                        <RotateCcw size={22} />
                                    </button>
                                    <button 
                                        onClick={() => store.skipSession(false)} 
                                        className="w-16 h-16 rounded-2xl bg-zinc-700/50 hover:bg-zinc-600/50 backdrop-blur-sm flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
                                    >
                                        <SkipForward size={22} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    {showGoalOnDashboard && <DailyGoalTracker />}
                    {!isRunning && (
                        <div className="space-y-4 mt-6">
                            <div className="grid grid-cols-4 gap-3">
                                {(currentSession === 'work' ? [15, 25, 45, 60] : [5, 10, 15, 20]).map(m => (
                                    <button 
                                        key={m} 
                                        onClick={() => handleDurationSet(m)} 
                                        className={`py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                                            timeRemaining === m * 60 
                                                ? 'bg-[hsl(var(--accent-hue),var(--accent-saturation),var(--accent-lightness))] text-black shadow-lg hover:shadow-xl hover:scale-105' 
                                                : 'bg-zinc-800/50 hover:bg-zinc-700/50 backdrop-blur-sm hover:scale-105'
                                        }`}
                                    >
                                        {m}m
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-3">
                                <input 
                                    value={customMin} 
                                    onChange={e => setCustomMin(e.target.value)} 
                                    onKeyDown={e => { if (e.key === 'Enter' && +customMin > 0) { handleDurationSet(+customMin); setCustomMin(''); } }} 
                                    placeholder="Custom minutes" 
                                    className="flex-1 px-5 py-3.5 bg-zinc-800/50 backdrop-blur-sm rounded-xl border border-zinc-700 focus:border-[hsl(var(--accent-hue),var(--accent-saturation),var(--accent-lightness))] outline-none text-sm smooth-color-transition" 
                                />
                                <button 
                                    onClick={() => { if (+customMin > 0) { handleDurationSet(+customMin); setCustomMin(''); } }} 
                                    className="px-6 py-3.5 bg-zinc-800/50 hover:bg-zinc-700/50 backdrop-blur-sm rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105"
                                >
                                    Set
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/80 rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl backdrop-blur-sm">
                <div className="p-6 border-b border-zinc-800/50 space-y-4 bg-zinc-900/50 backdrop-blur-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center text-sm">
                        <div className="space-y-1.5">
                            <p className="text-zinc-500">Focus: <span className="text-white font-semibold">{pendingPlaylist.name || 'None'}</span></p>
                            <p className="text-zinc-500">Break: <span className="text-white font-semibold">{breakPlaylist.name || 'None'}</span></p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                            <button onClick={() => setActiveModal('focusPlaylist')} className="px-5 py-2.5 bg-zinc-800/70 hover:bg-zinc-700/70 backdrop-blur-sm rounded-xl font-semibold transition-all duration-200 text-xs hover:scale-105">Set Focus</button>
                            <button onClick={() => setActiveModal('breakPlaylist')} className="px-5 py-2.5 bg-zinc-800/70 hover:bg-zinc-700/70 backdrop-blur-sm rounded-xl font-semibold transition-all duration-200 text-xs hover:scale-105">Set Break</button>
                        </div>
                    </div>
                </div>
                <div className="p-6 space-y-6">
                    {loading ? (
                        <div className="h-56 bg-zinc-800/50 rounded-2xl animate-pulse" />
                    ) : playlist.videos.length ? (
                        <>
                            <VideoPlayer video={currentVideo} isRunning={isRunning} />
                            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-zinc-800/50">
                                <div className="p-4 border-b border-zinc-800/50 flex justify-between items-center cursor-pointer hover:bg-zinc-800/30 transition" onClick={() => setPlaylistCollapsed(!playlistCollapsed)}>
                                    <h3 className="text-sm font-semibold text-zinc-300">Playlist {EMOJIS.DOT} {playlist.videos.length} videos</h3>
                                    <button className="text-zinc-500 hover:text-white transition">
                                        {playlistCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                                    </button>
                                </div>
                                {!playlistCollapsed && (
                                    <div className="max-h-96 overflow-y-auto">
                                        {playlist.videos.map((v, i) => (
                                            <button 
                                                key={v.id} 
                                                onClick={() => store.setCurrentVideo(i)} 
                                                className={`w-full p-4 flex items-start gap-4 hover:bg-zinc-800/50 transition ${playlist.currentIndex === i ? 'bg-zinc-800/70' : ''}`}
                                            >
                                                <img src={`https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`} alt="" className="w-24 h-14 object-cover rounded-lg shadow-md" />
                                                <div className="flex-1 min-w-0 text-left">
                                                    <p className="text-xs font-medium line-clamp-2 mb-1.5 leading-relaxed">{v.title}</p>
                                                    <p className="text-[10px] text-zinc-500">{v.duration}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-56 bg-zinc-800/30 backdrop-blur-sm rounded-2xl border-2 border-dashed border-zinc-700/50">
                            <Music size={48} className="text-zinc-700 mb-3" />
                            <p className="text-zinc-500 text-sm">Choose a playlist to get started</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </>
)

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-black text-white">
            {currentVideo && <AccentColorExtractor videoId={currentVideo.id} />}
            <Modal isOpen={store.isFocusGoalModalOpen} onClose={() => store.toggleFocusGoalModal(false)} title="Set Your Focus">
                <div className="space-y-6">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-zinc-300">Your Goal</label>
                            <span className="text-xs text-zinc-500">Optional</span>
                        </div>
                        <textarea 
                            value={goal.mainGoal} 
                            onChange={e => setGoal({ ...goal, mainGoal: e.target.value })} 
                            placeholder="What do you want to accomplish?" 
                            className="w-full p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 focus:border-[hsl(var(--accent-hue),var(--accent-saturation),var(--accent-lightness))] focus:bg-zinc-900/80 outline-none resize-none placeholder:text-zinc-600 transition" 
                            rows={3} 
                        />
                    </div>
                    
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-zinc-300">Action Steps</label>
                            <span className="text-xs text-zinc-500">Optional</span>
                        </div>
                        <textarea 
                            value={goal.howToAchieve} 
                            onChange={e => setGoal({ ...goal, howToAchieve: e.target.value })} 
                            placeholder="Break it down into steps..." 
                            className="w-full p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 focus:border-[hsl(var(--accent-hue),var(--accent-saturation),var(--accent-lightness))] focus:bg-zinc-900/80 outline-none resize-none placeholder:text-zinc-600 transition" 
                            rows={4} 
                        />
                    </div>

                    <button 
                        onClick={() => { 
                            store.setFocusGoal(goal); 
                            store.toggleFocusGoalModal(false); 
                            store.startTimer(); 
                        }} 
                        className="w-full py-4 bg-[hsl(var(--accent-hue),var(--accent-saturation),var(--accent-lightness))] hover:bg-[hsl(var(--accent-hue),var(--accent-saturation),var(--accent-lightness-hover))] text-black rounded-2xl font-bold shadow-lg shadow-[hsl(var(--accent-hue),var(--accent-saturation),var(--accent-lightness))]/30 hover:shadow-[hsl(var(--accent-hue),var(--accent-saturation),var(--accent-lightness))]/50 active:scale-[0.98] transition-all hover:scale-105"
                    >
                        Start Focusing
                    </button>
                </div>
            </Modal>
            <Modal isOpen={isActivityModalOpen} onClose={() => setIsActivityModalOpen(false)} title="Activity & Stats">
                <div className="space-y-5">
                    <Stats />
                    <ContributionGraph />
                    {!showGoalOnDashboard && (
                        <div className="pt-2">
                            <h3 className="text-lg font-bold mb-4">Today's Goal</h3>
                            <DailyGoalTracker />
                        </div>
                    )}
                </div>
            </Modal>
            <Modal isOpen={isBreakActivityModalOpen} onClose={() => setIsBreakActivityModalOpen(false)} title="Break Activities">
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-6 space-y-4 border border-zinc-800">
                        {activityCategories.map(({ type, icon: Icon }) => (
                            <div key={type}>
                                <h3 className="flex items-center gap-2 font-semibold text-[hsl(var(--accent-hue),var(--accent-saturation),var(--accent-lightness))] mb-3 smooth-color-transition">
                                    <Icon size={18} />{type}
                                </h3>
                                <ul className="space-y-2">
                                    {store.breakActivities.filter(a => a.category === type).map(a => (
                                        <li key={a.id} className="flex justify-between items-center bg-zinc-800/50 backdrop-blur-sm p-3 rounded-xl border border-zinc-700/50">
                                            <span className="text-sm text-zinc-300">[{a.duration}m] {a.description}</span>
                                            <button onClick={() => store.deleteBreakActivity(a.id)} className="text-zinc-500 hover:text-red-400 transition">
                                                <Trash2 size={14} />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                        <div className="border-t border-zinc-800 pt-4 space-y-3">
                            <input value={activity.description} onChange={e => setActivity({ ...activity, description: e.target.value })} onKeyDown={e => e.key === 'Enter' && activity.description.trim() && (store.addBreakActivity(activity), setActivity({ description: '', category: 'Energizing', duration: 5 }))} placeholder="New activity..." className="w-full px-4 py-3 bg-zinc-800/50 backdrop-blur-sm rounded-xl border border-zinc-700 focus:border-[hsl(var(--accent-hue),var(--accent-saturation),var(--accent-lightness))] outline-none smooth-color-transition" />
                            <div className="flex gap-2">
                                <select value={activity.category} onChange={e => setActivity({ ...activity, category: e.target.value as 'Energizing' | 'Restorative' })} className="px-4 py-3 bg-zinc-800/50 backdrop-blur-sm rounded-xl border border-zinc-700 focus:border-[hsl(var(--accent-hue),var(--accent-saturation),var(--accent-lightness))] outline-none smooth-color-transition">
                                    <option>Energizing</option>
                                    <option>Restorative</option>
                                </select>
                                <input type="number" min="1" value={activity.duration} onChange={e => setActivity({ ...activity, duration: +e.target.value })} className="w-20 px-4 py-3 bg-zinc-800/50 backdrop-blur-sm rounded-xl border border-zinc-700 focus:border-[hsl(var(--accent-hue),var(--accent-saturation),var(--accent-lightness))] outline-none smooth-color-transition" />
                                <button onClick={() => activity.description.trim() && (store.addBreakActivity(activity), setActivity({ description: '', category: 'Energizing', duration: 5 }))} className="flex-1 px-4 py-3 bg-[hsl(var(--accent-hue),var(--accent-saturation),var(--accent-lightness))] hover:bg-[hsl(var(--accent-hue),var(--accent-saturation),var(--accent-lightness-hover))] text-black rounded-xl font-bold flex items-center justify-center gap-2 smooth-color-transition transition-all hover:scale-105">
                                    <Plus size={16} />Add
                                </button>
                            </div>
                        </div>
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
                <div style={{ height: nonFullscreenHeight, transition: 'height 0.2s ease-out' }}>
                    <div 
                        ref={nonFullscreenWrapperRef}
                        className="max-w-7xl mx-auto"
                        style={{ transform: `scale(${dynamicZoom})`, transformOrigin: 'center top', transition: 'transform 0.2s ease-out' }}
                    >
                        <header className="p-8 flex justify-between items-center">
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-[hsl(var(--accent-hue),var(--accent-saturation),var(--accent-lightness))] to-[hsl(var(--accent-hue),var(--accent-saturation),calc(var(--accent-lightness)))] bg-clip-text text-transparent smooth-color-transition">FocusDJ</h1>
                            <button onClick={() => !document.fullscreenElement ? document.documentElement.requestFullscreen() : document.exitFullscreen()} className="p-3 text-zinc-500 hover:text-white transition-all rounded-xl hover:bg-zinc-800/50 hover:scale-110"><Maximize size={22} /></button>
                        </header>
                        <main className="px-8 pb-10">
                            {mainContent}
                        </main>
                        <footer className="mt-0 py-6 px-8 border-t border-zinc-900/50 backdrop-blur-sm">
                            <div className="flex justify-between items-center text-sm">
                                <div className="flex gap-6">{footerActions.map(({ label, icon: Icon, action, hover }) => <button key={label} onClick={action} className={`flex items-center gap-2 text-zinc-500 transition-all ${hover} hover:scale-105`}><Icon size={16} /><span className="hidden sm:inline">{label}</span></button>)}<input ref={fileRef} type="file" onChange={handleImport} className="hidden" accept=".json" /></div>
                                <p className="text-xs text-zinc-600">Keep tab active for autoplay</p>
                            </div>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
  }