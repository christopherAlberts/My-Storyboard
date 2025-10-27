import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { CheckCircle, Loader, AlertCircle, Save } from 'lucide-react';

const GlobalSaveStatus: React.FC = () => {
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'error'>('saved');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Subscribe to save status changes
    const unsubscribe = storageService.onSaveStatusChange((status) => {
      setSaveStatus(status);
      setIsVisible(true);
      
      // Hide indicator after 2 seconds if saved successfully
      if (status === 'saved') {
        setTimeout(() => setIsVisible(false), 2000);
      } else if (status === 'error') {
        // Keep error visible longer
        setTimeout(() => setIsVisible(false), 5000);
      }
    });

    return unsubscribe;
  }, []);

  if (!isVisible) return null;

  const getStatusConfig = () => {
    switch (saveStatus) {
      case 'saving':
        return {
          icon: Loader,
          text: 'Saving...',
          bgColor: 'bg-blue-600 dark:bg-blue-500',
          iconColor: 'text-white',
          textColor: 'text-white',
        };
      case 'saved':
        return {
          icon: CheckCircle,
          text: 'All changes saved',
          bgColor: 'bg-green-600 dark:bg-green-500',
          iconColor: 'text-white',
          textColor: 'text-white',
        };
      case 'error':
        return {
          icon: AlertCircle,
          text: 'Save failed',
          bgColor: 'bg-red-600 dark:bg-red-500',
          iconColor: 'text-white',
          textColor: 'text-white',
        };
      default:
        return {
          icon: Save,
          text: 'Ready',
          bgColor: 'bg-gray-600 dark:bg-gray-500',
          iconColor: 'text-white',
          textColor: 'text-white',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div
        className={`${config.bgColor} ${config.textColor} px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3 min-w-[160px] transition-all duration-200`}
      >
        <Icon
          className={`w-5 h-5 ${config.iconColor} ${
            saveStatus === 'saving' ? 'animate-spin' : ''
          }`}
        />
        <span className="text-sm font-medium">{config.text}</span>
      </div>
    </div>
  );
};

export default GlobalSaveStatus;

