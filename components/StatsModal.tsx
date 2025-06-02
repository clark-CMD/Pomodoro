
import React from 'react';
import { DailyStat } from '../types';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyStats: Record<string, DailyStat>;
}

const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose, dailyStats }) => {
  if (!isOpen) return null;

  const sortedDates = Object.entries(dailyStats)
    .sort((a, b) => b[0].localeCompare(a[0])); // Sort by date, descending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4" onClick={onClose}>
      <div 
        className="bg-slate-800 bg-opacity-90 backdrop-blur-xl rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-md transform transition-all duration-300 ease-out scale-100 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()} // Prevent click inside from closing modal
      >
        <h2 className="text-2xl font-semibold text-white mb-6 text-center">每日统计</h2>
        
        {sortedDates.length === 0 ? (
          <p className="text-slate-400 text-center">暂无统计数据。</p>
        ) : (
          <ul className="space-y-4">
            {sortedDates.map(([date, stats]) => (
              <li key={date} className="p-4 bg-slate-700 bg-opacity-50 rounded-lg shadow">
                <h3 className="text-lg font-medium text-sky-400 mb-1">{date}</h3>
                <p className="text-sm text-slate-300">已完成番茄钟: {stats.count} 个</p>
                <p className="text-sm text-slate-300">总工作时长: {stats.totalWorkMinutes} 分钟</p>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatsModal;
