import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Video, PomodoroSettings, PlaylistData, PomodoroStats } from '../types';
import { BreakActivity, defaultBreakActivities } from '../data/breakActivities';
import { newPlaylists } from '../data/playlists';

interface FocusGoal {
  mainGoal: string;
  howToAchieve: string;
}

interface UserProfile {
    name: string;
    picture: string;
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
  
  // Actions
  login: (response: any) => void;
  logout: () => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
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
  setCurrentVideo: (index: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setVolume: (volume: number) => void;
  setAudioOnly: (audioOnly: boolean) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
}

const DEFAULT_SETTINGS: PomodoroSettings = {
  workDuration: 25 * 60,
  breakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  longBreakInterval: 4,
};

const DEFAULT_PLAYLIST_DATA: PlaylistData = {
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
  focusGoal: {
    mainGoal: '',
    howToAchieve: '',
  },
  isFocusGoalModalOpen: false,
  breakActivities: defaultBreakActivities,
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
        const state = get();
        if (state.isRunning && state.timer) return;

        if (state.timer) {
          clearInterval(state.timer);
        }

        if (state.playlist.videos.length > 0) {
          get().setIsPlaying(true);
        }
        
        const timer = setInterval(() => {
          const currentState = get();
          
          if (currentState.timeRemaining <= 0) {
            clearInterval(timer);

            if (currentState.currentSession === 'work') {
              const completedMinutes = Math.floor(currentState.pomodoroSettings.workDuration / 60);
              set((state) => ({
                pomodoroStats: {
                  ...state.pomodoroStats,
                  totalMinutesToday: state.pomodoroStats.totalMinutesToday + completedMinutes,
                  sessionsCompleted: state.pomodoroStats.sessionsCompleted + 1,
                },
                focusGoal: { mainGoal: '', howToAchieve: '' }, // Reset goal for next session
                workPlaylist: state.playlist, // Save work playlist
                playlist: state.breakPlaylist.videos.length > 0 ? state.breakPlaylist : DEFAULT_PLAYLIST_DATA,
              }));
              get().setIsPlaying(currentState.breakPlaylist.videos.length > 0);
              
              const nextDuration = (currentState.pomodoroStats.sessionsCompleted + 1) % currentState.pomodoroSettings.longBreakInterval === 0
                ? currentState.pomodoroSettings.longBreakDuration
                : currentState.pomodoroSettings.breakDuration;
              
              set({
                currentSession: 'break',
                timeRemaining: nextDuration,
                isRunning: false,
              });
              get().startTimer();

            } else { // Break session has ended
              set((state) => ({
                currentSession: 'work',
                timeRemaining: state.pomodoroSettings.workDuration,
                isRunning: false,
                playlist: state.workPlaylist.videos.length > 0 ? state.workPlaylist : state.playlist,
              }));
            }
            return;
          }
          
          set((state) => ({
            timeRemaining: state.timeRemaining - 1,
          }));
        }, 1000);
        
        set({
          isRunning: true,
          timer,
        });
      },
      
      pauseTimer: () => {
        const { timer } = get();
        if (timer) {
          clearInterval(timer);
        }
        get().setIsPlaying(false);
        set({
          isRunning: false,
          timer: null,
        });
      },
      
      resetTimer: () => {
        const { timer, pomodoroSettings, currentSession } = get();
        if (timer) {
          clearInterval(timer);
        }
        
        const duration = currentSession === 'work' 
          ? pomodoroSettings.workDuration 
          : pomodoroSettings.breakDuration;
        
        get().setIsPlaying(false);
        set({
          isRunning: false,
          timeRemaining: duration,
          timer: null,
        });
      },
      
      updateSettings: (settings) => {
        const { timer, currentSession } = get();
        if (timer) {
          clearInterval(timer);
        }
        
        get().setIsPlaying(false);
        set((state) => {
          const newSettings = { ...state.pomodoroSettings, ...settings };
          const newTimeRemaining = currentSession === 'work' 
            ? newSettings.workDuration 
            : newSettings.breakDuration;
            
          return {
            pomodoroSettings: newSettings,
            timeRemaining: newTimeRemaining,
            isRunning: false,
            timer: null,
          };
        });
      },
      
      updatePomodoroStats: (minutes) => {
        set((state) => ({
          pomodoroStats: {
            ...state.pomodoroStats,
            totalMinutesToday: state.pomodoroStats.totalMinutesToday + minutes,
          },
        }));
      },

      clearAllData: () => {
        const { timer, pomodoroSettings } = get();
        if (timer) {
          clearInterval(timer);
        }
      
        const defaultPlaylists = newPlaylists.reduce((acc: Record<string, PlaylistData>, playlist) => {
          acc[playlist.name] = {
            ...DEFAULT_PLAYLIST_DATA,
            ...playlist,
            videos: [], // Videos should be fetched separately
          };
          return acc;
        }, {} as Record<string, PlaylistData>);
      
        const currentWorkPlaylist = get().workPlaylist;
        const currentBreakPlaylist = get().breakPlaylist;
      
        const newWorkPlaylist = currentWorkPlaylist.name ? defaultPlaylists[currentWorkPlaylist.name] || DEFAULT_PLAYLIST_DATA : DEFAULT_PLAYLIST_DATA;
        const newBreakPlaylist = currentBreakPlaylist.name ? defaultPlaylists[currentBreakPlaylist.name] || DEFAULT_PLAYLIST_DATA : DEFAULT_PLAYLIST_DATA;
      
        set({
          ...DEFAULT_STATE,
          pomodoroSettings,
          breakActivities: defaultBreakActivities,
          workPlaylist: newWorkPlaylist,
          breakPlaylist: newBreakPlaylist,
          playlist: newWorkPlaylist,
        });
      },
      
      setFocusGoal: (goal) => {
        set({ focusGoal: goal });
      },

      toggleFocusGoalModal: (isOpen) => {
        set({ isFocusGoalModalOpen: isOpen });
      },

      resetPomodoro: () => {
        const { timer, pomodoroSettings } = get();
        if (timer) {
          clearInterval(timer);
        }
        get().setIsPlaying(false);
        set({
          isRunning: false,
          currentSession: 'work',
          timeRemaining: pomodoroSettings.workDuration,
          timer: null,
          focusGoal: { mainGoal: '', howToAchieve: '' },
        });
      },

      exportData: () => {
        const state = get();
        const dataStr = JSON.stringify(state);
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
          // You might want to add validation here to ensure the imported data has the correct structure
          set(importedState);
        } catch (error) {
          console.error("Failed to parse or apply imported data", error);
          // Optionally, show an error to the user
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
        const { currentSession } = get();
        if (currentSession === 'work') {
          set({ playlist, workPlaylist: playlist });
        } else {
          set({ playlist, breakPlaylist: playlist });
        }
      },

      setBreakPlaylist: (playlist) => set({ breakPlaylist: playlist }),
      
      setCurrentVideo: (index) => {
        const state = get();
        const { videos, shuffle } = state.playlist;
        
        if (shuffle) {
          const shuffledVideos = shuffleArray(videos);
          set({
            playlist: {
              ...state.playlist,
              videos: shuffledVideos,
              currentIndex: 0,
            },
          });
        } else {
          set({
            playlist: {
              ...state.playlist,
              currentIndex: index,
            },
          });
        }
      },
      
      setIsPlaying: (isPlaying) => {
        set((state) => ({
          playlist: {
            ...state.playlist,
            isPlaying,
          },
        }));
      },
      
      setVolume: (volume) => {
        set((state) => ({
          playlist: {
            ...state.playlist,
            volume,
          },
        }));
      },

      setAudioOnly: (audioOnly) => {
        set((state) => ({
          playlist: {
            ...state.playlist,
            audioOnly,
          },
        }));
      },

      toggleShuffle: () => {
        const state = get();
        const { videos, shuffle } = state.playlist;
        
        if (!shuffle) {
          const shuffledVideos = shuffleArray(videos);
          set({
            playlist: {
              ...state.playlist,
              videos: shuffledVideos,
              currentIndex: 0,
              shuffle: true,
            },
          });
        } else {
          set({
            playlist: {
              ...state.playlist,
              shuffle: false,
              currentIndex: 0,
            },
          });
        }
      },

      toggleRepeat: () => {
        set((state) => ({
          playlist: {
            ...state.playlist,
            repeat: !state.playlist.repeat,
          },
        }));
      },
    }),
    {
      name: 'focus-app-storage',
      version: 2, // Bump version due to state changes
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: any, version: number) => {
        if (version < 2) {
          persistedState.workPlaylist = DEFAULT_PLAYLIST_DATA;
          persistedState.breakPlaylist = DEFAULT_PLAYLIST_DATA;
        }
        
        const state = {
          ...DEFAULT_STATE,
          ...persistedState,
          playlist: {
            ...DEFAULT_STATE.playlist,
            ...persistedState?.playlist,
          },
        };

        if (!state.breakActivities) {
          state.breakActivities = defaultBreakActivities;
        }
        return state;
      },
    }
  )
);
