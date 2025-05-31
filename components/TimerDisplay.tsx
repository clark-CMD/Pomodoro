
import React from 'react';
import { Stage, StageConfig } from '../types';
import { STAGE_CONFIGS } from '../constants';

interface TimerDisplayProps {
  timeLeft: number;
  currentStage: Stage;
  totalDurationForStage: number;
}

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

const TimerDisplay: React.FC<TimerDisplayProps> = ({ timeLeft, currentStage, totalDurationForStage }) => {
  const stageConfig = STAGE_CONFIGS[currentStage];
  const radius = 100; // This is effectively the center coordinate for a 200x200 viewBox
  const strokeWidth = 12; 
  const normalizedRadius = radius - strokeWidth / 2; // This is the r attribute for the circle paths
  const circumference = normalizedRadius * 2 * Math.PI;

  const progress = totalDurationForStage > 0 ? (totalDurationForStage - timeLeft) / totalDurationForStage : 0;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center">
      <svg 
        className="absolute inset-0 w-full h-full transform -rotate-90"
        viewBox={`0 0 ${radius * 2} ${radius * 2}`} // Added viewBox
      >
        <circle
          className="text-slate-700 opacity-30"
          stroke="currentColor"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius} // Center of the 200x200 viewBox
          cy={radius} // Center of the 200x200 viewBox
        />
        <circle
          className={`${stageConfig.color} transition-all duration-300 ease-linear`}
          stroke="currentColor"
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius} // Center of the 200x200 viewBox
          cy={radius} // Center of the 200x200 viewBox
          style={{ transition: 'stroke-dashoffset 0.3s ease-out' }}
        />
      </svg>
      <span className="relative text-5xl sm:text-7xl font-mono text-white z-10">
        {formatTime(timeLeft)}
      </span>
    </div>
  );
};

export default TimerDisplay;
