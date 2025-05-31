
import React from 'react';
import PlayIcon from './icons/PlayIcon';
import PauseIcon from './icons/PauseIcon';
import ResetIcon from './icons/ResetIcon';
import SkipIcon from './icons/SkipIcon';

interface ControlsProps {
  isRunning: boolean;
  onStartPause: () => void;
  onReset: () => void;
  onSkip: () => void;
}

const Controls: React.FC<ControlsProps> = ({ isRunning, onStartPause, onReset, onSkip }) => {
  return (
    <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 mt-8">
      <button
        onClick={onStartPause}
        className="flex items-center justify-center w-40 sm:w-auto px-8 py-3 bg-white text-slate-900 rounded-lg shadow-md hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-white transition-all duration-150 ease-in-out transform hover:scale-105"
      >
        {isRunning ? <PauseIcon className="w-5 h-5 mr-2" /> : <PlayIcon className="w-5 h-5 mr-2" />}
        {isRunning ? '暂停' : '开始'}
      </button>
      <button
        onClick={onReset}
        className="flex items-center justify-center w-40 sm:w-auto px-6 py-3 bg-white bg-opacity-10 text-slate-100 border border-white border-opacity-20 rounded-lg shadow-sm hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-white transition-all duration-150 ease-in-out transform hover:scale-105"
      >
        <ResetIcon className="w-5 h-5 mr-2" />
        重置
      </button>
      <button
        onClick={onSkip}
        className="flex items-center justify-center w-40 sm:w-auto px-6 py-3 bg-white bg-opacity-10 text-slate-100 border border-white border-opacity-20 rounded-lg shadow-sm hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-white transition-all duration-150 ease-in-out transform hover:scale-105"
      >
        <SkipIcon className="w-5 h-5 mr-2" />
        跳过
      </button>
    </div>
  );
};

export default Controls;
    