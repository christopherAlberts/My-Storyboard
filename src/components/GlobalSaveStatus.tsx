import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { CheckCircle, Loader, AlertCircle, Save } from 'lucide-react';

const GlobalSaveStatus: React.FC = () => {
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'error'>('saved');

  useEffect(() => {
    // Subscribe to save status changes
    const unsubscribe = storageService.onSaveStatusChange((status) => {
      setSaveStatus(status);
    });

    return unsubscribe;
  }, []);

  const getStatusConfig = () => {
    switch (saveStatus) {
      case 'saving':
        return {
          icon: Loader,
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
          iconColor: 'text-blue-600 dark:text-blue-400',
          borderColor: 'border-blue-300 dark:border-blue-700',
        };
      case 'saved':
        return {
          icon: CheckCircle,
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          iconColor: 'text-green-600 dark:text-green-400',
          borderColor: 'border-green-300 dark:border-green-700',
        };
      case 'error':
        return {
          icon: AlertCircle,
          bgColor: 'bg-red-100 dark:bg-red-900/30',
          iconColor: 'text-red-600 dark:text-red-400',
          borderColor: 'border-red-300 dark:border-red-700',
        };
      default:
        return {
          icon: Save,
          bgColor: 'bg-gray-100 dark:bg-gray-800/50',
          iconColor: 'text-gray-500 dark:text-gray-400',
          borderColor: 'border-gray-300 dark:border-gray-700',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className="fixed bottom-3 right-3 z-50">
      <div
        className={`${config.bgColor} ${config.iconColor} ${config.borderColor} border p-1.5 rounded-md shadow-sm flex items-center justify-center transition-all duration-200`}
        title={
          saveStatus === 'saving' ? 'Saving changes...' :
          saveStatus === 'saved' ? 'All changes saved' :
          saveStatus === 'error' ? 'Save failed' :
          'Ready'
        }
      >
        <Icon
          className={`w-3.5 h-3.5 ${
            saveStatus === 'saving' ? 'animate-spin' : ''
          }`}
        />
      </div>
    </div>
  );
};

export default GlobalSaveStatus;

