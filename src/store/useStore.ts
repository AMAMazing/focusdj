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

// New interfaces for gamification features
interface Streak {
    current: number;
    longest: number;
    lastSessionDate: string | null;
}

interface ContributionData {
    [date: string]: number; // Maps date string 'YYYY-MM-DD' to session count
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
  settings: PomodoroSettings;
  pomodoroStats: PomodoroStats;
  timer: number | null;
  focusGoal: FocusGoal;
  isFocusGoalModalOpen: boolean;
  
  // Gamification State
  dailyGoal: number;
  streak: Streak;
  totalSessions: number;
  contributionData: ContributionData;

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
  skipSession: (isCompleted: boolean) => void;
  updateSettings: (settings: Partial<PomodoroSettings>) => void;
  updatePomodoroStats: (minutes: number) => void;
  clearAllData: () => void;
  setFocusGoal: (goal: FocusGoal) => void;
  toggleFocusGoalModal: (isOpen: boolean) => void;
  resetPomodoro: () => void;
  setDailyGoal: (goal: number) => void;

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
  settings: DEFAULT_SETTINGS,
  pomodoroStats: {
    totalMinutesToday: 0,
    sessionsCompleted: 0,
    minutesFocused: 0,
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
  // New default states for gamification
  dailyGoal: 100,
  streak: {
      current: 0,
      longest: 0,
      lastSessionDate: null,
  },
  totalSessions: 0,
  contributionData: {},
};

// ... (keep shuffleArray if it's used, or remove)

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
        if (get().isRunning) return;

        if (get().playlist.videos.length > 0) {
          get().setIsPlaying(true);
        }
        
        const timerId = setInterval(() => {
          set(state => {
            if (state.timeRemaining > 1) {
              if (state.currentSession === 'work') {
                return { 
                  timeRemaining: state.timeRemaining - 1,
                  pomodoroStats: {
                    ...state.pomodoroStats,
                    minutesFocused: state.pomodoroStats.minutesFocused + 1/60,
                  }
                };
              }
              return { timeRemaining: state.timeRemaining - 1 };
            }
            get().skipSession(true); // Session completed
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
        set({ isRunning: false, timer: null });
      },
      
      resetTimer: () => {
        get().pauseTimer();
        const { pomodoroSettings, currentSession } = get();
        const duration = currentSession === 'work' 
          ? pomodoroSettings.workDuration 
          : pomodoroSettings.breakDuration;
        set({ timeRemaining: duration });
      },

      skipSession: (isCompleted) => {
          get().pauseTimer();
          const state = get();
      
          if (state.currentSession === 'work') {
              // Only update stats if the session was completed
              if (isCompleted) {
                  const today = new Date().toISOString().split('T')[0];
                  const yesterday = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0];
                  
                  set(s => {
                      const newTotalSessions = s.totalSessions + 1;
                      const newContributionData = { ...s.contributionData, [today]: (s.contributionData[today] || 0) + 1 };
      
                      let newStreak = { ...s.streak };
                      if (s.streak.lastSessionDate === today) {
                          // Already worked today, do nothing to streak
                      } else if (s.streak.lastSessionDate === yesterday) {
                          newStreak.current += 1; // Continue streak
                      } else {
                          newStreak.current = 1; // New streak
                      }
                      newStreak.lastSessionDate = today;
                      newStreak.longest = Math.max(newStreak.current, newStreak.longest);
      
                      return {
                          totalSessions: newTotalSessions,
                          contributionData: newContributionData,
                          streak: newStreak,
                          pomodoroStats: {
                            ...s.pomodoroStats,
                            sessionsCompleted: s.pomodoroStats.sessionsCompleted + 1,
                          }
                      };
                  });
              }
      
              // Switch to break
              const newSessionsCompleted = state.pomodoroStats.sessionsCompleted + (isCompleted ? 1 : 0);
              const nextDuration = (newSessionsCompleted % state.pomodoroSettings.longBreakInterval === 0)
                  ? state.pomodoroSettings.longBreakDuration
                  : state.pomodoroSettings.breakDuration;
      
              set({
                  currentSession: 'break',
                  timeRemaining: nextDuration,
                  focusGoal: { mainGoal: '', howToAchieve: '' },
                  playlist: state.breakPlaylist.videos.length > 0 ? state.breakPlaylist : DEFAULT_PLAYLIST_DATA,
              });
      
          } else { // Break session ended
              set({
                  currentSession: 'work',
                  timeRemaining: state.pomodoroSettings.workDuration,
                  playlist: state.workPlaylist.videos.length > 0 ? state.workPlaylist : DEFAULT_PLAYLIST_DATA,
              });
          }
      
          // Auto-start the next session's timer
          get().startTimer();
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
            settings: newSettings,
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
          settings: get().pomodoroSettings,
        });
      },

      setDailyGoal: (goal) => {
        set({ dailyGoal: Math.max(1, goal) });
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
            customPlaylists: state.customPlaylists.filter((p) => (p.id !== id)),
        }));
      },

      setClockFormat: (format) => {
        set({ clockFormat: format });
      },
    }),
    {
      name: 'focus-app-storage',
      version: 3, // Bump version for migration
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: any, version: number) => {
        let state = persistedState as StoreState;
        if (version < 3) {
            state.dailyGoal = 4;
            state.streak = { current: 0, longest: 0, lastSessionDate: null };
            state.totalSessions = 0;
            state.contributionData = {};
        }
        return state;
      },
    }
  )
);
