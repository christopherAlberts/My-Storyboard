import { useEffect, useState } from 'react';
import { useAppStore } from './store/useAppStore';
import { googleAuth } from './services/googleAuth';
import { googleDriveService } from './services/googleDriveService';
import { storageService } from './services/storageService';
import Sidebar from './components/Sidebar/Sidebar';
import WindowManager from './components/WindowManager/WindowManager';
import SimpleSignIn from './components/Auth/SimpleSignIn';
import ProjectSelectionModal from './components/Setup/ProjectSelectionModal';
import GlobalSaveStatus from './components/GlobalSaveStatus';
import { Menu, PanelLeft } from 'lucide-react';

function App() {
  const { sidebarOpen, setSidebarOpen, theme, toggleSidebar } = useAppStore();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showProjectSelection, setShowProjectSelection] = useState(false);
  const [currentProjectFolderId, setCurrentProjectFolderId] = useState<string | null>(null);
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ stage: '', progress: 0 });

  // Check authentication status on mount
  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      console.log('🔍 Checking authentication...');
      
      // Initialize Google Drive service
      console.log('🔧 Initializing Google Drive service...');
      await googleDriveService.initialize();
      console.log('✅ Google Drive service initialized');
      
      // Check both Google Auth AND Google Drive API access
      const isGoogleAuth = googleAuth.isAuthenticated();
      const isDriveAuth = googleDriveService.isAuthenticated();
      console.log('🔐 Google Auth status:', isGoogleAuth);
      console.log('🔐 Drive Auth status:', isDriveAuth);
      
      // User must be authenticated with both
      const isAuth = isGoogleAuth && isDriveAuth;
      setIsAuthenticated(isAuth);
      
      if (isAuth) {
        // ALWAYS show project selection - never auto-load
        console.log('🔐 User authenticated - showing project selection');
        setShowProjectSelection(true);
        // Clear any previously stored project to force selection
        localStorage.removeItem('current_project_folder_id');
        localStorage.removeItem('current_project_name');
        setCurrentProjectFolderId(null);
      } else {
        console.log('⚠️ Not fully authenticated, user needs to sign in');
      }
      
      console.log('✅ Initialization complete');
      setIsInitializing(false);
    } catch (error) {
      console.error('❌ Error checking authentication:', error);
      setIsAuthenticated(false);
      setIsInitializing(false);
    }
  };

  const loadProjectFromDrive = async (folderId: string) => {
    setIsLoadingProject(true);
    try {
      setLoadingProgress({ stage: 'Loading project data...', progress: 10 });
      console.log('📥 Loading project data from folder:', folderId);
      
      const projectData = await googleDriveService.loadProjectFromFolder(folderId);
      console.log('✅ Project data loaded:', projectData.projectName);
      setLoadingProgress({ stage: 'Loading documents...', progress: 40 });
      
      // Load documents separately from the project folder
      console.log('📄 Loading documents from folder...');
      const documents = await googleDriveService.loadDocumentsFromFolder(folderId);
      console.log('✅ Loaded', documents.length, 'documents');
      setLoadingProgress({ stage: 'Initializing project...', progress: 80 });
      
      // Merge documents into project data
      projectData.documents = documents;
      
      console.log('💾 Initializing storage service with Google Drive data...');
      await storageService.initialize(projectData);
      console.log('✅ Project loaded from Google Drive with', documents.length, 'documents');
      
      // Sync settings from storage to app store after project loads
      const loadedSettings = storageService.getSettings();
      console.log('📥 Loading settings into app store:', loadedSettings);
      const { setTheme, setTooltipFields } = useAppStore.getState();
      setTheme(loadedSettings.theme);
      setTooltipFields(loadedSettings.tooltipFields);
      console.log('✅ Settings synced to app store');
      setLoadingProgress({ stage: 'Complete!', progress: 100 });
      
      // Small delay to show completion before hiding loader
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error('❌ Error loading project from Google Drive:', error);
      console.error('Error details:', error);
      // If loading fails, show project selection
      setShowProjectSelection(true);
    } finally {
      setIsLoadingProject(false);
      setLoadingProgress({ stage: '', progress: 0 });
    }
  };

  const handleSelectProject = async (folderId: string, folderName: string) => {
    try {
      setCurrentProjectFolderId(folderId);
      localStorage.setItem('current_project_folder_id', folderId);
      localStorage.setItem('current_project_name', folderName);
      
      // Load project data from Google Drive
      await loadProjectFromDrive(folderId);
      
      setShowProjectSelection(false);
    } catch (error) {
      console.error('Error selecting project:', error);
      alert('Failed to load project. Please try again.');
    }
  };

  const handleCreateProject = async (projectName: string) => {
    try {
      // Create folder in Google Drive
      const folderId = await googleDriveService.createProjectFolder(projectName);
      
      // Get default project data and save it
      const defaultData = storageService.getData();
      defaultData.projectName = projectName;
      
      await googleDriveService.saveProjectToFolder(folderId, defaultData, true); // Force save for new project
      
      // Set as current project
      await handleSelectProject(folderId, projectName);
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  };

  const handleDeleteProject = async (folderId: string, folderName: string) => {
    try {
      console.log('🗑️ Deleting project:', folderName);
      
      // Delete the project folder from Google Drive
      await googleDriveService.deleteProjectFolder(folderId);
      
      // If this was the current project, clear it
      const currentFolderId = localStorage.getItem('current_project_folder_id');
      if (currentFolderId === folderId) {
        localStorage.removeItem('current_project_folder_id');
        localStorage.removeItem('current_project_name');
        setCurrentProjectFolderId(null);
      }
      
      // Reload the page to refresh the project list
      window.location.reload();
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project. Please try again.');
    }
  };

  // Apply theme to document
  useEffect(() => {
    const isDark = theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
  }, [theme]);

  // Sync settings from storage when project is loaded
  useEffect(() => {
    if (currentProjectFolderId && storageService.isReady()) {
      const settings = storageService.getSettings();
      console.log('🔄 Syncing settings from storage to store:', settings);
      const { setTheme, setTooltipFields, setCharacterRecognitionEnabled, setLocationRecognitionEnabled, setCharacterNameCapitalization, setLocationNameCapitalization } = useAppStore.getState();
      
      setTheme(settings.theme);
      setTooltipFields(settings.tooltipFields);
      setCharacterRecognitionEnabled(settings.characterRecognitionEnabled);
      setLocationRecognitionEnabled(settings.locationRecognitionEnabled);
      setCharacterNameCapitalization(settings.characterNameCapitalization);
      setLocationNameCapitalization(settings.locationNameCapitalization);
      
      console.log('✅ Settings synced to store');
    }
  }, [currentProjectFolderId]);

  // Show sign-in screen if not authenticated
  if (isInitializing) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <SimpleSignIn />;
  }

  // Show loading indicator when loading project
  if (isLoadingProject) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center w-full max-w-md px-4">
          <div className="relative w-64 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-300 ease-out rounded-full"
              style={{ width: `${loadingProgress.progress}%` }}
            />
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Loading Project
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {loadingProgress.stage || 'Preparing...'}
          </p>
        </div>
      </div>
    );
  }

  // ALWAYS show project selection modal when authenticated - user must choose a project
  if (showProjectSelection || !currentProjectFolderId) {
    return (
      <ProjectSelectionModal 
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
        onDeleteProject={handleDeleteProject}
      />
    );
  }

  // Main app - only shown when user has selected a project
  return (
    <>
      <div className={`h-screen w-screen overflow-hidden bg-white dark:bg-gray-900 ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg lg:hidden"
      >
        <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>

      {/* Sidebar toggle button - only show when sidebar is hidden */}
      {!sidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="Show Sidebar"
        >
          <PanelLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      )}

      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className={`h-full transition-all duration-300 ${
        sidebarOpen ? 'ml-64' : 'ml-0'
      }`}>
        <WindowManager />
      </div>

      {/* Empty state when no windows are open */}
      {useAppStore.getState().windows.length === 0 && (
        <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome to Storyboard
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
              Create your story with our powerful document editor, infinite storyboard canvas, and database management system.
            </p>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Click the sidebar button in the top-left corner to open the menu
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

export default App;
