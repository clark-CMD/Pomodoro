
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Stage, Settings, StageConfig, DailyStat, PersistedTimerState } from './types';
import { DEFAULT_SETTINGS, STAGE_CONFIGS, LOCAL_STORAGE_SETTINGS_KEY, LOCAL_STORAGE_TIMER_STATE_KEY, LOCAL_STORAGE_DAILY_STATS_KEY } from './constants';
import TimerDisplay from './components/TimerDisplay';
import Controls from './components/Controls';
import SettingsModal from './components/SettingsModal';
import StatsModal from './components/StatsModal'; // Import new modal
import SettingsIcon from './components/icons/SettingsIcon';
import StatsIcon from './components/icons/StatsIcon'; // Import new icon
import { loadSettings as loadSettingsFromService, saveSettings as saveSettingsToService } from './services/settingsService';

const App: React.FC = () => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [currentStage, setCurrentStage] = useState<Stage>(Stage.WORK);
  const [timeLeft, setTimeLeft] = useState<number>(settings.workMinutes * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [pomodoroCount, setPomodoroCount] = useState<number>(0); // Today's pomodoros
  const [completedPomodorosInCycle, setCompletedPomodorosInCycle] = useState<number>(0);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState<boolean>(false); // State for new modal
  const [isLoadingSettings, setIsLoadingSettings] = useState<boolean>(true);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [finishSoundBuffer, setFinishSoundBuffer] = useState<AudioBuffer | null>(null);
  const [dailyStats, setDailyStats] = useState<Record<string, DailyStat>>({});

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

  useEffect(() => {
    const loadedSettings = loadSettingsFromService();
    setSettings(loadedSettings);

    let loadedDailyStats: Record<string, DailyStat> = {};
    try {
      const dailyStatsJSON = localStorage.getItem(LOCAL_STORAGE_DAILY_STATS_KEY);
      if (dailyStatsJSON) {
        loadedDailyStats = JSON.parse(dailyStatsJSON);
        setDailyStats(loadedDailyStats);
      }
    } catch (error) {
      console.error("Failed to load daily stats:", error);
    }
    
    const todayStr = new Date().toISOString().split('T')[0];

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

        if (persistedState.persistedDate === todayStr && typeof persistedState.pomodoroCount === 'number') {
          setPomodoroCount(persistedState.pomodoroCount);
        } else {
          setPomodoroCount(loadedDailyStats[todayStr]?.count || 0);
        }
        
        if (typeof persistedState.completedPomodorosInCycle === 'number' && persistedState.completedPomodorosInCycle >= 0) {
           const maxInCycle = loadedSettings.pomodorosPerLongBreak > 0 ? loadedSettings.pomodorosPerLongBreak : 1;
           setCompletedPomodorosInCycle(Math.min(persistedState.completedPomodorosInCycle, maxInCycle -1 < 0 ? 0 : maxInCycle -1 ));
        } else {
            setCompletedPomodorosInCycle(0);
        }

      } else { // No persisted timer state
        setCurrentStage(Stage.WORK);
        setTimeLeft(loadedSettings.workMinutes * 60);
        setPomodoroCount(loadedDailyStats[todayStr]?.count || 0);
        setCompletedPomodorosInCycle(0);
      }
    } catch (error) {
      console.error("Failed to load persisted timer state:", error);
      setCurrentStage(Stage.WORK);
      setTimeLeft(loadedSettings.workMinutes * 60);
      setPomodoroCount(loadedDailyStats[todayStr]?.count || 0);
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

  useEffect(() => {
    if (isLoadingSettings) return; 
    const todayStr = new Date().toISOString().split('T')[0];
    const timerStateToPersist: PersistedTimerState = {
      currentStage,
      timeLeft,
      pomodoroCount, // Today's pomodoro count
      completedPomodorosInCycle,
      persistedDate: todayStr,
    };
    try {
      localStorage.setItem(LOCAL_STORAGE_TIMER_STATE_KEY, JSON.stringify(timerStateToPersist));
    } catch (error) {
      console.error("Failed to save timer state to localStorage:", error);
    }
  }, [currentStage, timeLeft, pomodoroCount, completedPomodorosInCycle, isLoadingSettings]);

  useEffect(() => {
    if (isLoadingSettings) return;
    // Avoid writing to localStorage if dailyStats is empty and wasn't loaded from there
    if (Object.keys(dailyStats).length === 0 && !localStorage.getItem(LOCAL_STORAGE_DAILY_STATS_KEY)) {
        return;
    }
    try {
        localStorage.setItem(LOCAL_STORAGE_DAILY_STATS_KEY, JSON.stringify(dailyStats));
    } catch (error) {
        console.error("Failed to save daily stats to localStorage:", error);
    }
  }, [dailyStats, isLoadingSettings]);


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
  }, [settings, playSound]);


  useEffect(() => {
    let timer: number | undefined = undefined;
    if (isRunning && timeLeft > 0) {
      timer = window.setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      if (currentStage === Stage.WORK) {
        const todayStr = new Date().toISOString().split('T')[0];
        const currentTodayStats = dailyStats[todayStr] || { count: 0, totalWorkMinutes: 0 };
        const newTodayCount = currentTodayStats.count + 1;
        const newTodayWorkMinutes = currentTodayStats.totalWorkMinutes + settings.workMinutes;

        setPomodoroCount(newTodayCount); 
        setDailyStats(prevStats => ({
            ...prevStats,
            [todayStr]: {
                count: newTodayCount,
                totalWorkMinutes: newTodayWorkMinutes,
            },
        }));
        
        const newCompletedInCycle = completedPomodorosInCycle + 1;
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
  }, [isRunning, timeLeft, currentStage, settings, pomodoroCount, completedPomodorosInCycle, switchStage, dailyStats]);


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
    
    // Re-evaluate current stage time based on new settings, but don't change stage
    // If current stage is WORK, update timeLeft to new workMinutes, etc.
    let newTimeForCurrentStage;
    switch(currentStage) {
        case Stage.WORK: newTimeForCurrentStage = newSettings.workMinutes * 60; break;
        case Stage.SHORT_BREAK: newTimeForCurrentStage = newSettings.shortBreakMinutes * 60; break;
        case Stage.LONG_BREAK: newTimeForCurrentStage = newSettings.longBreakMinutes * 60; break;
        default: newTimeForCurrentStage = newSettings.workMinutes * 60;
    }
    setTimeLeft(newTimeForCurrentStage);
    // If settings change pomodorosPerLongBreak, completedPomodorosInCycle might need reset
    // or adjustment. Simplest is to reset it.
    setCompletedPomodorosInCycle(0); 
  }, [currentStage]); // Added currentStage dependency

  const getStageDuration = useCallback((stage: Stage, currentSettings: Settings): number => {
    switch (stage) {
        case Stage.WORK: return currentSettings.workMinutes * 60;
        case Stage.SHORT_BREAK: return currentSettings.shortBreakMinutes * 60;
        case Stage.LONG_BREAK: return currentSettings.longBreakMinutes * 60;
        default: return currentSettings.workMinutes * 60;
    }
  }, []);

  const handleVisibilityChange = useCallback(() => {
    if (isLoadingSettings) return;
    const todayStr = new Date().toISOString().split('T')[0];

    if (document.hidden) {
        if (isRunning) {
            lastHiddenTimeRef.current = Date.now();
            timeLeftAtHideRef.current = timeLeft;
            wasRunningWhenHiddenRef.current = true;
            setIsRunning(false);
        }
    } else {
        if (wasRunningWhenHiddenRef.current && lastHiddenTimeRef.current !== null && timeLeftAtHideRef.current !== null) {
            const timeElapsedMs = Date.now() - lastHiddenTimeRef.current;
            const timeElapsedSec = Math.round(timeElapsedMs / 1000);

            let newTimeLeftState = timeLeftAtHideRef.current - timeElapsedSec;
            let newCurrentStageState = currentStage;
            // let newPomodoroCountState = pomodoroCount; // Today's count will be updated based on dailyStats
            let newCompletedPomodorosInCycleState = completedPomodorosInCycle;
            let playSoundOnFocus = false;
            
            const currentSettingsSnapshot = settings;
            let tempDailyStats = {...dailyStats}; // Operate on a copy for calculations within this block
            let tempPomodoroCount = pomodoroCount;


            while (newTimeLeftState <= 0) {
                playSoundOnFocus = true; 
                // const durationOfFinishedStage = getStageDuration(newCurrentStageState, currentSettingsSnapshot);
                const timeOverranBy = Math.abs(newTimeLeftState);

                if (newCurrentStageState === Stage.WORK) {
                    const currentTodayStats = tempDailyStats[todayStr] || { count: 0, totalWorkMinutes: 0 };
                    tempPomodoroCount = currentTodayStats.count + 1;
                    const newTodayWorkMinutes = currentTodayStats.totalWorkMinutes + currentSettingsSnapshot.workMinutes;
                    tempDailyStats = {
                        ...tempDailyStats,
                        [todayStr]: { count: tempPomodoroCount, totalWorkMinutes: newTodayWorkMinutes }
                    };
                    
                    newCompletedPomodorosInCycleState++;
                    if (currentSettingsSnapshot.pomodorosPerLongBreak > 0 && newCompletedPomodorosInCycleState >= currentSettingsSnapshot.pomodorosPerLongBreak) {
                        newCurrentStageState = Stage.LONG_BREAK;
                        newCompletedPomodorosInCycleState = 0;
                    } else {
                        newCurrentStageState = Stage.SHORT_BREAK;
                    }
                } else { 
                    newCurrentStageState = Stage.WORK;
                }
                
                const durationOfNextStage = getStageDuration(newCurrentStageState, currentSettingsSnapshot);
                newTimeLeftState = durationOfNextStage - timeOverranBy;
            }
            
            setDailyStats(tempDailyStats); // Commit updated daily stats
            setPomodoroCount(tempDailyStats[todayStr]?.count || 0); // Update UI pomodoro count from potentially modified daily stats
            setCurrentStage(newCurrentStageState);
            setCompletedPomodorosInCycle(newCompletedPomodorosInCycleState);
            setTimeLeft(newTimeLeftState > 0 ? newTimeLeftState : 0); 

            if (playSoundOnFocus && audioContext && finishSoundBuffer) {
              if (audioContext.state === 'suspended') {
                audioContext.resume().then(() => playSound());
              } else {
                playSound();
              }
            }
            
            setIsRunning(true); 
            
            lastHiddenTimeRef.current = null;
            timeLeftAtHideRef.current = null;
            wasRunningWhenHiddenRef.current = false;
        }
    }
  }, [
    isLoadingSettings, isRunning, timeLeft, currentStage, pomodoroCount, completedPomodorosInCycle, settings, dailyStats,
    setIsRunning, setCurrentStage, setPomodoroCount, setCompletedPomodorosInCycle, setTimeLeft, setDailyStats,
    playSound, getStageDuration, audioContext, finishSoundBuffer
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
      <div className="absolute top-8 right-4 sm:top-10 sm:right-6 flex space-x-2 sm:space-x-3 z-30">
        <button
            onClick={() => setIsStatsModalOpen(true)}
            className="p-2 sm:p-3 bg-white bg-opacity-10 hover:bg-opacity-20 active:bg-opacity-30 backdrop-blur-md rounded-full text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:ring-opacity-75 transition-all duration-150 ease-in-out transform hover:scale-105 active:scale-95"
            aria-label="查看统计"
        >
            <StatsIcon className="w-6 h-6 sm:w-7 sm:h-7" />
        </button>
        <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="p-2 sm:p-3 bg-white bg-opacity-10 hover:bg-opacity-20 active:bg-opacity-30 backdrop-blur-md rounded-full text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:ring-opacity-75 transition-all duration-150 ease-in-out transform hover:scale-105 active:scale-95"
            aria-label="打开设置"
        >
            <SettingsIcon className="w-6 h-6 sm:w-7 sm:h-7" />
        </button>
      </div>


      <main className="flex flex-col items-center justify-center bg-slate-800 bg-opacity-60 backdrop-blur-lg rounded-3xl shadow-2xl p-6 sm:p-10 w-full max-w-lg sm:max-w-xl mb-10">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-white">
            {currentStageConfig.name}
          </h1>
          <p className="text-sm text-slate-300 mt-2">
            今日已完成番茄钟: {pomodoroCount}
            {currentStage === Stage.WORK && settings.pomodorosPerLongBreak > 0 && (
              <span className="block sm:inline sm:ml-2">
                (本轮目标 {settings.pomodorosPerLongBreak} 个中的第 {completedPomodorosInCycle + 1} 个)
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
      <StatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        dailyStats={dailyStats}
      />

      <footer className="absolute bottom-4 text-center w-full text-xs text-slate-100 text-opacity-50">
        番茄工作法计时器 - 专注每一刻
      </footer>
    </div>
  );
};

export default App;
