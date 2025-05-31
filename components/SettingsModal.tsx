
import React, { useState, useEffect } from 'react';
import { Settings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newSettings: Settings) => void;
  initialSettings: Settings;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, initialSettings }) => {
  const [settings, setSettings] = useState<Settings>(initialSettings);

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
  };

  const handleSave = () => {
    onSave(settings);
    onClose();
  };
  
  const InputField: React.FC<{label: string, name: keyof Settings, value: number, unit: string}> = ({label, name, value, unit}) => (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium text-slate-300 mb-1">
        {label} ({unit})
      </label>
      <input
        type="number"
        id={name}
        name={name}
        value={value}
        onChange={handleChange}
        min="1"
        className="w-full px-3 py-2 bg-slate-700 text-slate-100 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
      <div className="bg-slate-800 bg-opacity-90 backdrop-blur-xl rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-md transform transition-all duration-300 ease-out scale-100">
        <h2 className="text-2xl font-semibold text-white mb-6 text-center">计时器设置</h2>
        
        <InputField label="工作时长" name="workMinutes" value={settings.workMinutes} unit="分钟" />
        <InputField label="短时休息时长" name="shortBreakMinutes" value={settings.shortBreakMinutes} unit="分钟" />
        <InputField label="长时间休息时长" name="longBreakMinutes" value={settings.longBreakMinutes} unit="分钟" />
        <InputField label="长休前番茄钟数量" name="pomodorosPerLongBreak" value={settings.pomodorosPerLongBreak} unit="个" />

        <div className="mt-8 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-slate-500 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 transition-colors"
          >
            保存设置
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
    