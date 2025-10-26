import React, { useState, useEffect } from 'react';
import { FolderOpen, Plus, Loader, ExternalLink, Search, Trash2 } from 'lucide-react';
import { googleDriveService } from '../../services/googleDriveService';

interface ProjectFolder {
  id: string;
  name: string;
  lastModified?: string;
}

interface ProjectSelectionModalProps {
  onSelectProject: (folderId: string, folderName: string) => void;
  onCreateProject: (folderName: string) => void;
  onDeleteProject?: (folderId: string, folderName: string) => void;
}

const ProjectSelectionModal: React.FC<ProjectSelectionModalProps> = ({ 
  onSelectProject, 
  onCreateProject,
  onDeleteProject
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectFolders, setProjectFolders] = useState<ProjectFolder[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Loading projects...');
      // Search for folders containing project data files
      const response = await googleDriveService.listProjectFolders();
      console.log('✅ Projects loaded:', response.length);
      setProjectFolders(response);
    } catch (err: any) {
      console.error('❌ Error loading projects:', err);
      console.error('Error details:', err);
      setError(err.message || 'Failed to load projects. Please check the console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectProject = (folder: ProjectFolder) => {
    onSelectProject(folder.id, folder.name);
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      setError('Please enter a project name');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      await onCreateProject(newProjectName.trim());
    } catch (err: any) {
      console.error('Error creating project:', err);
      setError(err.message || 'Failed to create project');
      setIsCreating(false);
    }
  };

  const handleOpenInDrive = (folderId: string) => {
    window.open(`https://drive.google.com/drive/folders/${folderId}`, '_blank');
  };

  const filteredFolders = projectFolders.filter(folder =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-6 p-6 border-b border-gray-200 dark:border-gray-700">
          <FolderOpen className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Select or Create Project
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              All your data will be stored securely in Google Drive
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
              <span className="ml-3 text-gray-600 dark:text-gray-400">Loading projects...</span>
            </div>
          ) : error && !projectFolders.length ? (
            <div className="text-center py-12">
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <button
                onClick={loadProjects}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Search */}
              {projectFolders.length > 0 && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search projects..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              )}

              {/* Existing Projects */}
              {projectFolders.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Existing Projects ({filteredFolders.length})
                  </h3>
                  <div className="space-y-2">
                    {filteredFolders.map((folder) => (
                      <div
                        key={folder.id}
                        className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer group"
                        onClick={() => handleSelectProject(folder)}
                      >
                        <div className="flex items-center space-x-3 flex-1">
                          <FolderOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {folder.name}
                            </div>
                            {folder.lastModified && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Last modified: {new Date(folder.lastModified).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenInDrive(folder.id);
                            }}
                            className="px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-all"
                            title="Open in Google Drive"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          {onDeleteProject && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Are you sure you want to delete "${folder.name}"? This action cannot be undone.`)) {
                                  onDeleteProject(folder.id, folder.name);
                                }
                              }}
                              className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                              title="Delete project"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Projects Found */}
              {projectFolders.length === 0 && !showCreateForm && (
                <div className="text-center py-12">
                  <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    No projects found. Create your first project to get started!
                  </p>
                </div>
              )}

              {/* Create New Project */}
              {showCreateForm ? (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Create New Project
                  </h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="Enter project name..."
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      autoFocus
                    />
                    {error && (
                      <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    )}
                    <div className="flex space-x-2">
                      <button
                        onClick={handleCreateProject}
                        disabled={isCreating || !newProjectName.trim()}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        {isCreating ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" />
                            <span>Creating...</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            <span>Create</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setShowCreateForm(false);
                          setNewProjectName('');
                          setError(null);
                        }}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-gray-700 dark:text-gray-300"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Create New Project</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectSelectionModal;

