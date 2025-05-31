
import { Settings } from '../types';
import { DEFAULT_SETTINGS, LOCAL_STORAGE_SETTINGS_KEY } from '../constants';

export const loadSettings = (): Settings => {
  try {
    const storedSettings = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
    if (storedSettings) {
      const parsedSettings = JSON.parse(storedSettings) as Partial<Settings>;
      // Ensure all keys are present, falling back to defaults if some are missing
      return {
        workMinutes: parsedSettings.workMinutes ?? DEFAULT_SETTINGS.workMinutes,
        shortBreakMinutes: parsedSettings.shortBreakMinutes ?? DEFAULT_SETTINGS.shortBreakMinutes,
        longBreakMinutes: parsedSettings.longBreakMinutes ?? DEFAULT_SETTINGS.longBreakMinutes,
        pomodorosPerLongBreak: parsedSettings.pomodorosPerLongBreak ?? DEFAULT_SETTINGS.pomodorosPerLongBreak,
      };
    }
  } catch (error) {
    console.error("Failed to load settings from localStorage:", error);
  }
  return DEFAULT_SETTINGS;
};

export const saveSettings = (settings: Settings): void => {
  try {
    localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save settings to localStorage:", error);
  }
};
    