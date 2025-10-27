import React, { useState } from 'react';
import { FolderOpen, Check } from 'lucide-react';

interface FolderSelectionProps {
  onComplete: (folderName: string) => void;
}

const FolderSelection: React.FC<FolderSelectionProps> = ({ onComplete }) => {
  const [folderName, setFolderName] = useState('My Storyboard');
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async () => {
    setIsCreating(true);
    await onComplete(folderName);
    setIsCreating(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center space-x-3 mb-6">
          <FolderOpen className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <h2 className="text-2xl font-bold text-gray-−900 dark:text-white">
            Choose your project folder
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Folder Name
            </label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter folder name"
              autoFocus
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              This folder will be created in your Google Drive
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Secure Storage
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  All your documents, characters, and story data will be saved in this folder on your Google Drive.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isCreating || !folderName.trim()}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isCreating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Creating folder...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Create Folder & Continue</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FolderSelection;


