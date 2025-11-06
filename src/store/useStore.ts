import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Video, PomodoroSettings, PlaylistData, PomodoroStats } from '../types';
import { BreakActivity, defaultBreakActivities } from '../data/breakActivities';
import { newPlaylists } from '../data/playlists';
import { fetchPlaylistVideos } from '../utils/youtube';

interface FocusGoal {
  mainGoal: string;
  howToAchieve: string;
}

interface UserProfile {
    name: string;
    picture: string;
}

interface PendingPlaylist {
  name: string | null;
  url: string | null;
}

export interface CustomPlaylist {
    id: string;
    name: string;
    url: string;
}

interface StoreState {
  // Auth State
  isLoggedIn: boolean;
  accessToken: string | null;
  userProfile: UserProfile | null;

  // Pomodoro State
  isRunning: boolean;
  currentSession: 'work' | 'break';
  timeRemaining: number;
  pomodoroSettings: PomodoroSettings;
  pomodoroStats: PomodoroStats;
  timer: number | null;
  focusGoal: FocusGoal;
  isFocusGoalModalOpen: boolean;
  
  // Break Activities State
  breakActivities: BreakActivity[];
  
  // Playlist State
  playlist: PlaylistData;
  workPlaylist: PlaylistData;
  breakPlaylist: PlaylistData;
  pendingPlaylist: PendingPlaylist;
  customPlaylists: CustomPlaylist[];
  globalVolume: number;

  // Clock State
  clockFormat: '12h' | '24h';
  
  // Actions
  login: (response: any) => void;
  logout: () => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  skipSession: () => void;
  updateSettings: (settings: Partial<PomodoroSettings>) => void;
  updatePomodoroStats: (minutes: number) => void;
  clearAllData: () => void;
  setFocusGoal: (goal: FocusGoal) => void;
  toggleFocusGoalModal: (isOpen: boolean) => void;
  resetPomodoro: () => void;

  // Data Management Actions
  exportData: () => void;
  importData: (jsonData: string) => void;

  // Break Activity Actions
  addBreakActivity: (activity: Omit<BreakActivity, 'id'>) => void;
  updateBreakActivity: (activity: BreakActivity) => void;
  deleteBreakActivity: (id: string) => void;
  resetBreakActivities: () => void;
  
  // Playlist Actions
  setPlaylist: (playlist: PlaylistData) => void;
  setBreakPlaylist: (playlist: PlaylistData) => void;
  setPendingPlaylist: (playlist: PendingPlaylist) => void;
  setCurrentVideo: (index: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setVolume: (volume: number) => void;
  setAudioOnly: (audioOnly: boolean) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  addCustomPlaylist: (playlist: Omit<CustomPlaylist, 'id'>) => void;
  updateCustomPlaylist: (playlist: CustomPlaylist) => void;
  deleteCustomPlaylist: (id: string) => void;

  // Clock Actions
  setClockFormat: (format: '12h' | '24h') => void;
}

const DEFAULT_SETTINGS: PomodoroSettings = {
  workDuration: 25 * 60,
  breakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  longBreakInterval: 4,
};

export const DEFAULT_PLAYLIST_DATA: PlaylistData = {
  name: null,
  videos: [],
  currentIndex: 0,
  isPlaying: false,
  volume: 70,
  audioOnly: false,
  shuffle: false,
  repeat: false,
};

const DEFAULT_STATE = {
  isLoggedIn: false,
  accessToken: null,
  userProfile: null,
  isRunning: false,
  currentSession: 'work' as const,
  timeRemaining: DEFAULT_SETTINGS.workDuration,
  pomodoroSettings: DEFAULT_SETTINGS,
  pomodoroStats: {
    totalMinutesToday: 0,
    sessionsCompleted: 0,
  },
  timer: null,
  playlist: DEFAULT_PLAYLIST_DATA,
  workPlaylist: DEFAULT_PLAYLIST_DATA,
  breakPlaylist: DEFAULT_PLAYLIST_DATA,
  pendingPlaylist: { name: null, url: null },
  focusGoal: {
    mainGoal: '',
    howToAchieve: '',
  },
  isFocusGoalModalOpen: false,
  breakActivities: defaultBreakActivities,
  customPlaylists: [],
  globalVolume: 70,
  clockFormat: '12h' as const,
};

// Fisher-Yates shuffle algorithm
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_STATE,
      
      login: (response) => {
        set({
          isLoggedIn: true,
          accessToken: response.accessToken,
          userProfile: {
            name: response.profileObj.name,
            picture: response.profileObj.imageUrl,
          },
        });
      },

      logout: () => {
        set({
          isLoggedIn: false,
          accessToken: null,
          userProfile: null,
        });
      },

      startTimer: () => {
        if (get().isRunning) return; // Guard clause: Don't start if already running.

        if (get().playlist.videos.length > 0) {
          get().setIsPlaying(true);
        }
        
        const timerId = setInterval(() => {
          set(state => {
            if (state.timeRemaining > 1) {
              return { timeRemaining: state.timeRemaining - 1 };
            }
            // Timer has reached its end.
            get().skipSession(); 
            // skipSession will clear this interval, so we just return the final state.
            return { timeRemaining: 0 };
          });
        }, 1000);
        
        set({ isRunning: true, timer: timerId });
      },
      
      pauseTimer: () => {
        const { timer } = get();
        if (timer) {
          clearInterval(timer);
        }
        get().setIsPlaying(false);
        set({ isRunning: false, timer: null }); // Set timer to null to indicate it's cleared.
      },
      
      resetTimer: () => {
        get().pauseTimer(); // Use pauseTimer to correctly clear interval and state.
        const { pomodoroSettings, currentSession } = get();
        
        const duration = currentSession === 'work' 
          ? pomodoroSettings.workDuration 
          : pomodoroSettings.breakDuration;
        
        set({ timeRemaining: duration });
      },

      skipSession: () => {
        get().pauseTimer(); // Safely stop the current timer before proceeding.

        const currentState = get();

        if (currentState.currentSession === 'work') {
          const completedSeconds = currentState.pomodoroSettings.workDuration - currentState.timeRemaining;
          const completedMinutes = Math.round(completedSeconds / 60);
          const newSessionsCompleted = currentState.pomodoroStats.sessionsCompleted + 1;

          set((state) => ({
            pomodoroStats: {
              totalMinutesToday: state.pomodoroStats.totalMinutesToday + completedMinutes,
              sessionsCompleted: newSessionsCompleted,
            },
            focusGoal: { mainGoal: '', howToAchieve: '' },
            workPlaylist: state.playlist,
            playlist: state.breakPlaylist.videos.length > 0 ? state.breakPlaylist : DEFAULT_PLAYLIST_DATA,
          }));
          
          const nextDuration = (newSessionsCompleted % currentState.pomodoroSettings.longBreakInterval === 0)
            ? currentState.pomodoroSettings.longBreakDuration
            : currentState.pomodoroSettings.breakDuration;
          
          set({
            currentSession: 'break',
            timeRemaining: nextDuration,
          });
          get().startTimer();

        } else { // Break session has ended
          (async () => {
            const { pendingPlaylist, workPlaylist } = get();
            let nextWorkPlaylist = workPlaylist.videos.length > 0 ? workPlaylist : DEFAULT_PLAYLIST_DATA;

            if (pendingPlaylist.url && pendingPlaylist.url !== workPlaylist.name) { // Also check if it's a new playlist
              try {
                const videos = await fetchPlaylistVideos(pendingPlaylist.url);
                const randomIndex = Math.floor(Math.random() * videos.length);
                nextWorkPlaylist = {
                  ...DEFAULT_PLAYLIST_DATA,
                  name: pendingPlaylist.name,
                  videos,
                  currentIndex: randomIndex,
                  shuffle: true,
                };
              } catch (error) {
                console.error("Failed to fetch pending playlist", error);
              }
            } else if (pendingPlaylist.name === 'None') {
                nextWorkPlaylist = DEFAULT_PLAYLIST_DATA;
            }
            
            set((state) => ({
              playlist: nextWorkPlaylist,
              workPlaylist: nextWorkPlaylist,
              currentSession: 'work',
              timeRemaining: state.pomodoroSettings.workDuration,
            }));
            
            get().startTimer();
          })();
        }
      },
      
      updateSettings: (settings) => {
        get().pauseTimer();
        
        set((state) => {
          const newSettings = { ...state.pomodoroSettings, ...settings };
          const newTimeRemaining = state.currentSession === 'work' 
            ? newSettings.workDuration 
            : newSettings.breakDuration;
            
          return {
            pomodoroSettings: newSettings,
            timeRemaining: newTimeRemaining,
          };
        });
      },
      
      updatePomodoroStats: (minutes) => {
        set((state) => ({
          pomodoroStats: { ...state.pomodoroStats, totalMinutesToday: state.pomodoroStats.totalMinutesToday + minutes },
        }));
      },

      clearAllData: () => {
        get().pauseTimer();
        set(DEFAULT_STATE);
      },
      
      setFocusGoal: (goal) => {
        set({ focusGoal: goal });
      },

      toggleFocusGoalModal: (isOpen) => {
        set({ isFocusGoalModalOpen: isOpen });
      },

      resetPomodoro: () => {
        get().pauseTimer();
        set({
          ...DEFAULT_STATE,
          pomodoroSettings: get().pomodoroSettings,
        });
      },

      exportData: () => {
        const state = get();
        const dataStr = JSON.stringify({ ...state, timer: null });
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = 'focus-dj-backup.json';
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
      },

      importData: (jsonData) => {
        try {
          const importedState = JSON.parse(jsonData);
          get().pauseTimer();
          set({ ...importedState, isRunning: false, timer: null });
        } catch (error) {
          console.error("Failed to parse or apply imported data", error);
        }
      },

      // Break Activity Actions
      addBreakActivity: (activity) => {
        set((state) => ({
          breakActivities: [...state.breakActivities, { ...activity, id: crypto.randomUUID() }],
        }));
      },
      updateBreakActivity: (activity) => {
        set((state) => ({
          breakActivities: state.breakActivities.map((a) => (a.id === activity.id ? activity : a)),
        }));
      },
      deleteBreakActivity: (id) => {
        set((state) => ({
          breakActivities: state.breakActivities.filter((a) => a.id !== id),
        }));
      },
      resetBreakActivities: () => {
        set({ breakActivities: defaultBreakActivities });
      },
      
      // Playlist Actions
      setPlaylist: (playlist) => {
        set({ 
          playlist: { ...playlist, isPlaying: get().isRunning && playlist.videos.length > 0 }, 
          workPlaylist: playlist 
        });
      },

      setBreakPlaylist: (playlist) => set({ breakPlaylist: playlist }),

      setPendingPlaylist: (playlist) => set({ pendingPlaylist: playlist }),
      
      setCurrentVideo: (index) => {
        set((state) => {
          const { videos, repeat, shuffle } = state.playlist;
          let newIndex = index;

          if (shuffle && index > state.playlist.currentIndex) {
            let randomIndex = Math.floor(Math.random() * videos.length);
            if(videos.length > 1) {
              while(randomIndex === state.playlist.currentIndex) {
                randomIndex = Math.floor(Math.random() * videos.length);
              }
            }
            newIndex = randomIndex;
          } else {
            if (repeat) {
                newIndex = (index + videos.length) % videos.length;
            } else {
                newIndex = Math.max(0, Math.min(videos.length - 1, index));
            }
          }

          return {
            playlist: { ...state.playlist, currentIndex: newIndex },
          };
        });
      },
      
      setIsPlaying: (isPlaying) => {
        set((state) => ({ playlist: { ...state.playlist, isPlaying } }));
      },
      
      setVolume: (volume) => {
        set({ globalVolume: volume });
      },

      setAudioOnly: (audioOnly) => {
        set((state) => ({ playlist: { ...state.playlist, audioOnly } }));
      },

      toggleShuffle: () => {
        set((state) => ({ playlist: { ...state.playlist, shuffle: !state.playlist.shuffle } }));
      },

      toggleRepeat: () => {
        set((state) => ({ playlist: { ...state.playlist, repeat: !state.playlist.repeat } }));
      },

      addCustomPlaylist: (playlist) => {
        set((state) => ({
            customPlaylists: [...state.customPlaylists, { ...playlist, id: crypto.randomUUID() }],
        }));
      },
      updateCustomPlaylist: (playlist) => {
        set((state) => ({
            customPlaylists: state.customPlaylists.map((p) => (p.id === playlist.id ? playlist : p)),
        }));
      },
      deleteCustomPlaylist: (id) => {
        set((state) => ({
            customPlaylists: state.customPlaylists.filter((p) => p.id !== id),
        }));
      },

      setClockFormat: (format) => {
        set({ clockFormat: format });
      },
    }),
    {
      name: 'focus-app-storage',
      version: 2, 
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: any, version: number) => {
        const state = { ...DEFAULT_STATE, ...persistedState };
        if (version < 2) {
          if (!persistedState.workPlaylist) state.workPlaylist = DEFAULT_PLAYLIST_DATA;
          if (!persistedState.breakPlaylist) state.breakPlaylist = DEFAULT_PLAYLIST_DATA;
          if (!persistedState.pendingPlaylist) state.pendingPlaylist = { name: null, url: null };
        }
        return state;
      },
    }
  )
);
