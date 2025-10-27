import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { googleAuth } from '../../services/googleAuth';
import { Sun, Moon, Monitor, Coffee, ChevronDown, ChevronUp, LogOut, User, Shield } from 'lucide-react';

const Settings: React.FC = () => {
  const { theme, setTheme, characterRecognitionEnabled, characterNameCapitalization, setCharacterNameCapitalization, locationRecognitionEnabled, locationNameCapitalization, setLocationNameCapitalization, tooltipFields, setTooltipFields } = useAppStore();
  const [googleAccount, setGoogleAccount] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    loadGoogleAccount();
  }, []);

  const loadGoogleAccount = async () => {
    try {
      const isAuth = googleAuth.isAuthenticated();
      setIsAuthenticated(isAuth);
      
      if (isAuth) {
        const user = googleAuth.getCurrentUser();
        if (user) {
          setGoogleAccount(user);
        }
      }
    } catch (error) {
      console.error('Error loading Google account:', error);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to sign out? Your local progress will be saved.')) {
      try {
        await googleAuth.signOut();
        window.location.reload();
      } catch (error) {
        console.error('Error signing out:', error);
        alert('Error signing out. Please try again.');
      }
    }
  };
  const [capDropdownOpen, setCapDropdownOpen] = React.useState(false);
  const [locationCapDropdownOpen, setLocationCapDropdownOpen] = React.useState(false);
  const [tooltipDropdownOpen, setTooltipDropdownOpen] = React.useState(false);
  const [locationTooltipDropdownOpen, setLocationTooltipDropdownOpen] = React.useState(false);

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

        {/* Google Account Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Account
          </h2>
          
          {isAuthenticated ? (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {googleAccount?.name || 'Logged In'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {googleAccount?.email || ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
              <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                <div className="flex items-center space-x-2 text-xs text-green-700 dark:text-green-300">
                  <Shield className="w-4 h-4" />
                  <span>Your data is synced to your Google Drive</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Not Signed In
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Sign in with Google to sync your data to the cloud
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

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

        {/* Character Name Capitalization */}
        {characterRecognitionEnabled && (
          <div className="mb-8 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setCapDropdownOpen(!capDropdownOpen)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Character Name Capitalization
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {characterNameCapitalization === 'uppercase' && 'Upper Case'}
                  {characterNameCapitalization === 'lowercase' && 'Lower Case'}
                  {characterNameCapitalization === 'leave-as-is' && 'Leave As Is'}
                </p>
              </div>
              {capDropdownOpen ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            {capDropdownOpen && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="space-y-2">
                  {[
                    { value: 'uppercase', label: 'Upper Case', description: 'First letter capitalized' },
                    { value: 'lowercase', label: 'Lower Case', description: 'All lowercase' },
                    { value: 'leave-as-is', label: 'Leave As Is', description: 'Match user\'s typing' }
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <input
                        type="radio"
                        name="capitalization"
                        value={option.value}
                        checked={characterNameCapitalization === option.value}
                        onChange={(e) => setCharacterNameCapitalization(e.target.value as any)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {option.label}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {option.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Character Tooltip Fields */}
        {characterRecognitionEnabled && (
          <div className="mb-8 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setTooltipDropdownOpen(!tooltipDropdownOpen)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Character Hover Tooltip Fields
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {Object.values(tooltipFields).filter(Boolean).length} fields selected
                </p>
              </div>
              {tooltipDropdownOpen ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            {tooltipDropdownOpen && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Select which information to show when hovering over character names
                </p>
                <div className="space-y-3">
              {[
                { key: 'description', label: 'Description', description: 'Character description' },
                { key: 'role', label: 'Role', description: 'Protagonist, antagonist, etc.' },
                { key: 'occupation', label: 'Occupation', description: 'Character\'s job/profession' },
                { key: 'age', label: 'Age', description: 'Character age' },
                { key: 'appearance', label: 'Appearance', description: 'Physical appearance description' },
                { key: 'personality', label: 'Personality', description: 'Personality traits' },
                { key: 'background', label: 'Background', description: 'Character background' },
                { key: 'characterArc', label: 'Character Arc', description: 'Character development arc' },
                { key: 'motivation', label: 'Motivation', description: 'What drives the character' },
                { key: 'goals', label: 'Goals', description: 'Character objectives' },
                { key: 'fears', label: 'Fears', description: 'Character fears and weaknesses' },
                { key: 'notes', label: 'Notes', description: 'General notes about the character' },
              ].map((field) => {
                const isEnabled = tooltipFields[field.key] || false;
                
                return (
                  <div key={field.key} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {field.label}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {field.description}
                      </div>
                    </div>
                    <button
                      onClick={() => setTooltipFields({ [field.key]: !isEnabled })}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        isEnabled
                          ? 'bg-blue-600'
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Location Recognition */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Location Recognition
          </h2>

        {/* Location Name Capitalization */}
        {locationRecognitionEnabled && (
          <div className="mb-8 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setLocationCapDropdownOpen(!locationCapDropdownOpen)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Location Name Capitalization
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {locationNameCapitalization === 'uppercase' && 'Upper Case'}
                  {locationNameCapitalization === 'lowercase' && 'Lower Case'}
                  {locationNameCapitalization === 'leave-as-is' && 'Leave As Is'}
                </p>
              </div>
              {locationCapDropdownOpen ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            {locationCapDropdownOpen && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="space-y-2">
                  {[
                    { value: 'uppercase', label: 'Upper Case', description: 'First letter capitalized' },
                    { value: 'lowercase', label: 'Lower Case', description: 'All lowercase' },
                    { value: 'leave-as-is', label: 'Leave As Is', description: 'Match user\'s typing' }
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <input
                        type="radio"
                        name="locationCapitalization"
                        value={option.value}
                        checked={locationNameCapitalization === option.value}
                        onChange={(e) => setLocationNameCapitalization(e.target.value as any)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {option.label}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {option.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Location Tooltip Fields */}
        {locationRecognitionEnabled && (
          <div className="mb-8 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setLocationTooltipDropdownOpen(!locationTooltipDropdownOpen)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Location Hover Tooltip Fields
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Select fields to show in location tooltips
                </p>
              </div>
              {locationTooltipDropdownOpen ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            {locationTooltipDropdownOpen && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Select which information to show when hovering over location names
                </p>
                <div className="space-y-3">
              {[
                { key: 'description', label: 'Description', description: 'Location description' },
                { key: 'type', label: 'Type', description: 'Indoor, outdoor, urban, etc.' },
                { key: 'atmosphere', label: 'Atmosphere', description: 'Atmosphere and mood' },
                { key: 'significance', label: 'Significance', description: 'Story significance' },
                { key: 'climate', label: 'Climate', description: 'Weather and climate' },
                { key: 'population', label: 'Population', description: 'Population details' },
                { key: 'history', label: 'History', description: 'Historical background' },
                { key: 'culture', label: 'Culture', description: 'Cultural aspects' },
                { key: 'notes', label: 'Notes', description: 'General notes about the location' },
              ].map((field) => {
                const isEnabled = tooltipFields[field.key] || false;
                
                return (
                  <div key={field.key} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {field.label}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {field.description}
                      </div>
                    </div>
                    <button
                      onClick={() => setTooltipFields({ [field.key]: !isEnabled })}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        isEnabled
                          ? 'bg-blue-600'
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
                </div>
              </div>
            )}
          </div>
        )}

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
