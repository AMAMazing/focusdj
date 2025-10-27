export interface Video {
  id: string;
  title: string;
  duration: string;
  thumbnail: string;
}

export interface PlaylistData {
  name?: string;
  videos: Video[];
  currentIndex: number;
  isPlaying: boolean;
  volume: number;
  audioOnly: boolean;
  shuffle: boolean;
  repeat: boolean;
}

export interface PomodoroSettings {
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
}

export interface PomodoroStats {
  totalMinutesToday: number;
  sessionsCompleted: number;
}
