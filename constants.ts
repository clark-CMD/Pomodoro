import { Stage, Settings, StageConfig } from './types';

export const DEFAULT_SETTINGS: Settings = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  pomodorosPerLongBreak: 4,
};

export const STAGE_CONFIGS: Record<Stage, StageConfig> = {
  [Stage.WORK]: {
    name: '工作',
    color: 'stroke-rose-500',
    gradient: 'from-rose-500 via-rose-600 to-rose-700',
  },
  [Stage.SHORT_BREAK]: {
    name: '短时休息',
    color: 'stroke-sky-500',
    gradient: 'from-sky-400 via-sky-500 to-sky-600',
  },
  [Stage.LONG_BREAK]: {
    name: '长时间休息',
    color: 'stroke-emerald-500',
    gradient: 'from-emerald-400 via-emerald-500 to-emerald-600',
  },
};

export const LOCAL_STORAGE_SETTINGS_KEY = 'pomodoroSettings';
export const LOCAL_STORAGE_TIMER_STATE_KEY = 'pomodoroTimerState';
export const LOCAL_STORAGE_DAILY_STATS_KEY = 'pomodoroDailyStats'; // New key for daily stats
