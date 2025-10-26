import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Sun, Moon, Monitor, Coffee, Eye, EyeOff } from 'lucide-react';

const Settings: React.FC = () => {
  const { theme, setTheme, characterRecognitionEnabled, setCharacterRecognitionEnabled } = useAppStore();

  const themeOptions = [
    {
      value: 'light' as const,
      label: 'Light',
      icon: Sun,
      description: 'Light theme',
    },
    {
      value: 'dark' as const,
      label: 'Dark',
      icon: Moon,
      description: 'Dark theme',
    },
    {
      value: 'system' as const,
      label: 'System',
      icon: Monitor,
      description: 'Use system preference',
    },
  ];

  return (
    <div className="h-full bg-white dark:bg-gray-800 p-6 overflow-y-auto">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
          Settings
        </h1>

        {/* Theme Selection */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Appearance
          </h2>
          <div className="space-y-3">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = theme === option.value;
              
              return (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className={`w-full flex items-center space-x-3 p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${
                    isSelected 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`} />
                  <div className="flex-1 text-left">
                    <div className={`font-medium ${
                      isSelected
                        ? 'text-blue-900 dark:text-blue-100'
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {option.label}
                    </div>
                    <div className={`text-sm ${
                      isSelected
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {option.description}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Character Recognition */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Character Recognition
          </h2>
          <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center space-x-3">
              {characterRecognitionEnabled ? (
                <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              ) : (
                <EyeOff className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Enable Character Recognition
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Highlight character names in documents with their unique colors
                </p>
              </div>
            </div>
            <button
              onClick={() => setCharacterRecognitionEnabled(!characterRecognitionEnabled)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                characterRecognitionEnabled
                  ? 'bg-blue-600'
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  characterRecognitionEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Buy Me a Coffee */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Support
          </h2>
          <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <Coffee className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  Buy Me a Coffee
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Enjoying Storyboard? Consider buying me a coffee to support continued development!
                </p>
                <a
                  href="https://buymeacoffee.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors font-medium text-sm"
                >
                  <Coffee className="w-4 h-4 mr-2" />
                  Buy Me a Coffee
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-12 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            About Storyboard
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            A comprehensive storyboard webapp with document editing, infinite canvas, and database management.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
