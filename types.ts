
export enum Stage {
  WORK = 'WORK',
  SHORT_BREAK = 'SHORT_BREAK',
  LONG_BREAK = 'LONG_BREAK',
}

export interface Settings {
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  pomodorosPerLongBreak: number;
}

export interface StageConfig {
  name: string;
  color: string; // Tailwind color class for progress, e.g., 'stroke-rose-500'
  gradient: string; // Tailwind gradient classes, e.g., 'from-rose-500 via-rose-600 to-rose-700'
}

export interface DailyStat {
  count: number;
  totalWorkMinutes: number;
}

export interface PersistedTimerState {
  currentStage: Stage;
  timeLeft: number;
  pomodoroCount: number; // Represents pomodoros for 'persistedDate'
  completedPomodorosInCycle: number;
  persistedDate?: string; // YYYY-MM-DD, for which pomodoroCount is valid
}
