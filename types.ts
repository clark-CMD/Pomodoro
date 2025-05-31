
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
    