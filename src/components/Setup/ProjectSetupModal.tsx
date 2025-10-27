import React, { useState } from 'react';
import { X, FolderOpen, Save } from 'lucide-react';

interface ProjectSetupModalProps {
  isOpen: boolean;
  onComplete: (projectName: string, parentFolderId: string | null) => void;
  defaultProjectName?: string;
}

const ProjectSetupModal: React.FC<ProjectSetupModalProps> = ({ 
  isOpen, 
  onComplete,
  defaultProjectName = 'My Storyboard Project'
}) => {
  const [projectName, setProjectName] = useState(defaultProjectName);
  const [parentFolderId, setParentFolderId] = useState<string | null>(null);
  const [parentFolderName, setParentFolderName] = useState('My Drive (root)');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setIsLoading(true);
    onComplete(projectName, parentFolderId);
    setTimeout(() => setIsLoading(false), 500);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome! Set up your project
          </h2>
          <button
            onClick={() => onComplete(projectName, null)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Project Name
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter project name"
              autoFocus
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              This name will be used as the folder name in your Google Drive
            </p>
          </div>

          {/* Storage Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Storage Location
            </label>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <FolderOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {parentFolderName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Your project will be saved to: {parentFolderName}/{projectName}
                  </p>
                </div>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              For now, projects are saved to your Google Drive root folder. 
              Folder selection will be available in a future update.
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Save className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Your project data will be synced automatically
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  All your characters, locations, documents, and storyboards will be saved to your Google Drive. 
                  You can access your work from any device.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => onComplete(projectName, null)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Skip
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading || !projectName.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Project</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectSetupModal;


