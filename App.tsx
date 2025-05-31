
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Stage, Settings, StageConfig } from './types';
import { DEFAULT_SETTINGS, STAGE_CONFIGS, LOCAL_STORAGE_SETTINGS_KEY, LOCAL_STORAGE_TIMER_STATE_KEY } from './constants';
import TimerDisplay from './components/TimerDisplay';
import Controls from './components/Controls';
import SettingsModal from './components/SettingsModal';
import SettingsIcon from './components/icons/SettingsIcon';
import { loadSettings as loadSettingsFromService, saveSettings as saveSettingsToService } from './services/settingsService';

interface PersistedTimerState {
  currentStage: Stage;
  timeLeft: number;
  pomodoroCount: number;
  completedPomodorosInCycle: number;
}

const App: React.FC = () => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [currentStage, setCurrentStage] = useState<Stage>(Stage.WORK);
  const [timeLeft, setTimeLeft] = useState<number>(settings.workMinutes * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [pomodoroCount, setPomodoroCount] = useState<number>(0);
  const [completedPomodorosInCycle, setCompletedPomodorosInCycle] = useState<number>(0);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState<boolean>(true);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [finishSoundBuffer, setFinishSoundBuffer] = useState<AudioBuffer | null>(null);

  // Refs for visibility change handling
  const lastHiddenTimeRef = useRef<number | null>(null);
  const timeLeftAtHideRef = useRef<number | null>(null);
  const wasRunningWhenHiddenRef = useRef<boolean>(false);

  const playSound = useCallback(() => {
    if (!audioContext || !finishSoundBuffer) return;
    try {
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      const source = audioContext.createBufferSource();
      source.buffer = finishSoundBuffer;
      source.connect(audioContext.destination);
      source.start(0);
    } catch (error) {
        console.error("Error playing sound:", error);
    }
  }, [audioContext, finishSoundBuffer]);

  // Effect for loading settings and persisted timer state
  useEffect(() => {
    const loadedSettings = loadSettingsFromService();
    setSettings(loadedSettings);

    try {
      const persistedTimerStateJSON = localStorage.getItem(LOCAL_STORAGE_TIMER_STATE_KEY);
      if (persistedTimerStateJSON) {
        const persistedState = JSON.parse(persistedTimerStateJSON) as PersistedTimerState;
        
        if (persistedState.currentStage && Object.values(Stage).includes(persistedState.currentStage)) {
          setCurrentStage(persistedState.currentStage);
          
          let stageDuration;
          switch (persistedState.currentStage) {
            case Stage.WORK: stageDuration = loadedSettings.workMinutes * 60; break;
            case Stage.SHORT_BREAK: stageDuration = loadedSettings.shortBreakMinutes * 60; break;
            case Stage.LONG_BREAK: stageDuration = loadedSettings.longBreakMinutes * 60; break;
            default: stageDuration = loadedSettings.workMinutes * 60;
          }
          
          if (typeof persistedState.timeLeft === 'number' && persistedState.timeLeft >= 0) {
            setTimeLeft(Math.min(persistedState.timeLeft, stageDuration));
          } else {
            setTimeLeft(stageDuration);
          }
        } else {
          setCurrentStage(Stage.WORK);
          setTimeLeft(loadedSettings.workMinutes * 60);
        }

        if (typeof persistedState.pomodoroCount === 'number' && persistedState.pomodoroCount >= 0) {
          setPomodoroCount(persistedState.pomodoroCount);
        }
        if (typeof persistedState.completedPomodorosInCycle === 'number' && persistedState.completedPomodorosInCycle >= 0) {
           const maxInCycle = loadedSettings.pomodorosPerLongBreak > 0 ? loadedSettings.pomodorosPerLongBreak : 1;
           setCompletedPomodorosInCycle(Math.min(persistedState.completedPomodorosInCycle, maxInCycle -1 < 0 ? 0 : maxInCycle -1 ));
        }

      } else {
        setCurrentStage(Stage.WORK);
        setTimeLeft(loadedSettings.workMinutes * 60);
      }
    } catch (error) {
      console.error("Failed to load persisted timer state:", error);
      setCurrentStage(Stage.WORK);
      setTimeLeft(loadedSettings.workMinutes * 60);
      setPomodoroCount(0);
      setCompletedPomodorosInCycle(0);
    }
    
    setIsRunning(false); 
    setIsLoadingSettings(false);

    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    setAudioContext(context);
    
    fetch('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU'+Array(1e3).join(String.fromCharCode(Math.random()*256|120)))
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => context.decodeAudioData(arrayBuffer))
      .then(audioBuffer => setFinishSoundBuffer(audioBuffer))
      .catch(error => console.error("Error loading sound:", error));
    
    return () => {
      if (context && context.state !== 'closed') {
        context.close();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Effect for saving timer state to localStorage
  useEffect(() => {
    if (isLoadingSettings) return; 

    const timerStateToPersist: PersistedTimerState = {
      currentStage,
      timeLeft,
      pomodoroCount,
      completedPomodorosInCycle,
    };
    try {
      localStorage.setItem(LOCAL_STORAGE_TIMER_STATE_KEY, JSON.stringify(timerStateToPersist));
    } catch (error) {
      console.error("Failed to save timer state to localStorage:", error);
    }
  }, [currentStage, timeLeft, pomodoroCount, completedPomodorosInCycle, isLoadingSettings]);


  const switchStage = useCallback((nextStage: Stage) => {
    setIsRunning(false); 
    setCurrentStage(nextStage);
    let newTimeLeft: number;
    switch (nextStage) {
      case Stage.WORK:
        newTimeLeft = settings.workMinutes * 60;
        break;
      case Stage.SHORT_BREAK:
        newTimeLeft = settings.shortBreakMinutes * 60;
        break;
      case Stage.LONG_BREAK:
        newTimeLeft = settings.longBreakMinutes * 60;
        break;
      default:
        newTimeLeft = settings.workMinutes * 60;
    }
    setTimeLeft(newTimeLeft);
    playSound();
    // Auto-start next stage is often desired, but let's ensure it's user-initiated or after focus restoration
    // For now, switchStage implies a transition that should then be started by user or visibility handler
  }, [settings, playSound]);


  useEffect(() => {
    let timer: number | undefined = undefined;
    if (isRunning && timeLeft > 0) {
      timer = window.setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      if (currentStage === Stage.WORK) {
        const newPomodoroCount = pomodoroCount + 1;
        const newCompletedInCycle = completedPomodorosInCycle + 1;
        setPomodoroCount(newPomodoroCount);
        setCompletedPomodorosInCycle(newCompletedInCycle);

        if (settings.pomodorosPerLongBreak > 0 && newCompletedInCycle >= settings.pomodorosPerLongBreak) {
          switchStage(Stage.LONG_BREAK);
          setCompletedPomodorosInCycle(0); 
        } else {
          switchStage(Stage.SHORT_BREAK);
        }
      } else { 
        switchStage(Stage.WORK);
      }
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft, currentStage, settings, pomodoroCount, completedPomodorosInCycle, switchStage]);


  useEffect(() => {
    if (isLoadingSettings) return; 
    const stageConfig = STAGE_CONFIGS[currentStage];
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    document.title = `${stageConfig.name} - ${timeStr} | 番茄钟`;
  }, [timeLeft, currentStage, isLoadingSettings]);


  const handleStartPause = useCallback(() => {
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume().then(() => setIsRunning(prev => !prev));
    } else {
        setIsRunning(prev => !prev);
    }
  }, [audioContext]);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    let baseTime: number;
    switch (currentStage) {
      case Stage.WORK:
        baseTime = settings.workMinutes * 60;
        break;
      case Stage.SHORT_BREAK:
        baseTime = settings.shortBreakMinutes * 60;
        break;
      case Stage.LONG_BREAK:
        baseTime = settings.longBreakMinutes * 60;
        break;
      default:
        baseTime = settings.workMinutes * 60;
    }
    setTimeLeft(baseTime);
  }, [currentStage, settings]);

  const handleSkip = useCallback(() => {
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
    // Stop current timer, play sound, then switch.
    // switchStage handles the sound and setting new time.
    setIsRunning(false); 
    if (currentStage === Stage.WORK) {
       switchStage(Stage.SHORT_BREAK);
    } else { 
      switchStage(Stage.WORK);
    }
  }, [currentStage, switchStage, audioContext]);

  const handleSaveSettings = useCallback((newSettings: Settings) => {
    saveSettingsToService(newSettings);
    setSettings(newSettings);
    setIsRunning(false); 
    setCurrentStage(Stage.WORK); 
    setTimeLeft(newSettings.workMinutes * 60);
    setCompletedPomodorosInCycle(0); 
  }, []);

  const getStageDuration = useCallback((stage: Stage, currentSettings: Settings): number => {
    switch (stage) {
        case Stage.WORK: return currentSettings.workMinutes * 60;
        case Stage.SHORT_BREAK: return currentSettings.shortBreakMinutes * 60;
        case Stage.LONG_BREAK: return currentSettings.longBreakMinutes * 60;
        default: return currentSettings.workMinutes * 60; // Fallback, should not happen
    }
  }, []);

  const handleVisibilityChange = useCallback(() => {
    if (isLoadingSettings) return;

    if (document.hidden) {
        if (isRunning) {
            lastHiddenTimeRef.current = Date.now();
            timeLeftAtHideRef.current = timeLeft;
            wasRunningWhenHiddenRef.current = true;
            setIsRunning(false); // Pause the interval
        }
    } else {
        if (wasRunningWhenHiddenRef.current && lastHiddenTimeRef.current !== null && timeLeftAtHideRef.current !== null) {
            const timeElapsedMs = Date.now() - lastHiddenTimeRef.current;
            const timeElapsedSec = Math.round(timeElapsedMs / 1000);

            let newTimeLeftState = timeLeftAtHideRef.current - timeElapsedSec;
            let newCurrentStageState = currentStage;
            let newPomodoroCountState = pomodoroCount;
            let newCompletedPomodorosInCycleState = completedPomodorosInCycle;
            let playSoundOnFocus = false;
            
            const currentSettingsSnapshot = settings; // Use a snapshot of settings

            // Loop to process multiple stage completions if necessary
            while (newTimeLeftState <= 0) {
                playSoundOnFocus = true; 
                const durationOfFinishedStage = getStageDuration(newCurrentStageState, currentSettingsSnapshot);
                const timeOverranBy = Math.abs(newTimeLeftState);

                if (newCurrentStageState === Stage.WORK) {
                    newPomodoroCountState++;
                    newCompletedPomodorosInCycleState++;
                    if (currentSettingsSnapshot.pomodorosPerLongBreak > 0 && newCompletedPomodorosInCycleState >= currentSettingsSnapshot.pomodorosPerLongBreak) {
                        newCurrentStageState = Stage.LONG_BREAK;
                        newCompletedPomodorosInCycleState = 0;
                    } else {
                        newCurrentStageState = Stage.SHORT_BREAK;
                    }
                } else { // SHORT_BREAK or LONG_BREAK finished
                    newCurrentStageState = Stage.WORK;
                }
                
                const durationOfNextStage = getStageDuration(newCurrentStageState, currentSettingsSnapshot);
                newTimeLeftState = durationOfNextStage - timeOverranBy;
            }
            
            setCurrentStage(newCurrentStageState);
            setPomodoroCount(newPomodoroCountState);
            setCompletedPomodorosInCycle(newCompletedPomodorosInCycleState);
            setTimeLeft(newTimeLeftState > 0 ? newTimeLeftState : 0); // Ensure timeLeft isn't negative

            if (playSoundOnFocus && audioContext && finishSoundBuffer) {
              // Explicitly call playSound to ensure audio context is handled
              if (audioContext.state === 'suspended') {
                audioContext.resume().then(() => playSound());
              } else {
                playSound();
              }
            }
            
            setIsRunning(true); // Resume timer
            
            lastHiddenTimeRef.current = null;
            timeLeftAtHideRef.current = null;
            wasRunningWhenHiddenRef.current = false;
        }
    }
  }, [
    isLoadingSettings, isRunning, timeLeft, currentStage, pomodoroCount, completedPomodorosInCycle, settings,
    setIsRunning, setCurrentStage, setPomodoroCount, setCompletedPomodorosInCycle, setTimeLeft,
    playSound, getStageDuration, audioContext, finishSoundBuffer // Added audioContext, finishSoundBuffer for playSound call
  ]);

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleVisibilityChange]);


  const currentStageConfig = STAGE_CONFIGS[currentStage];
  const totalDurationForStage = getStageDuration(currentStage, settings);


  if (isLoadingSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100">
        <p className="text-xl animate-pulse">加载中...</p>
      </div>
    );
  }

  return (
    <div 
      className={`min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-br ${currentStageConfig.gradient} text-slate-100 transition-all duration-700 ease-in-out`}
    >
      <button
        onClick={() => setIsSettingsModalOpen(true)}
        className="absolute top-6 right-4 sm:top-8 sm:right-6 p-3 bg-slate-900 bg-opacity-40 rounded-full backdrop-blur-sm text-white hover:bg-opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all"
        aria-label="打开设置"
      >
        <SettingsIcon className="w-6 h-6 sm:w-7 sm:h-7" />
      </button>

      <main className="flex flex-col items-center justify-center bg-slate-800 bg-opacity-60 backdrop-blur-lg rounded-3xl shadow-2xl p-6 sm:p-10 w-full max-w-lg sm:max-w-xl mb-10">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-white">
            {currentStageConfig.name}
          </h1>
          <p className="text-sm text-slate-300 mt-2">
            已完成番茄钟: {pomodoroCount}
            {currentStage === Stage.WORK && settings.pomodorosPerLongBreak > 0 && (
              <span className="block sm:inline sm:ml-2">
                (目标 {settings.pomodorosPerLongBreak} 个中的第 {completedPomodorosInCycle + 1} 个)
              </span>
            )}
          </p>
        </div>

        <TimerDisplay 
          timeLeft={timeLeft} 
          currentStage={currentStage} 
          totalDurationForStage={totalDurationForStage}
        />
        
        <Controls 
          isRunning={isRunning}
          onStartPause={handleStartPause}
          onReset={handleReset}
          onSkip={handleSkip}
        />
      </main>

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSave={handleSaveSettings}
        initialSettings={settings}
      />

      <footer className="absolute bottom-4 text-center w-full text-xs text-slate-100 text-opacity-50">
        番茄工作法计时器 - 专注每一刻
      </footer>
    </div>
  );
};

export default App;
