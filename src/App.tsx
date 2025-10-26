import { useEffect, useState } from 'react';
import { useAppStore } from './store/useAppStore';
import { googleAuth } from './services/googleAuth';
import { googleDriveStorage } from './services/googleDriveStorage';
import Sidebar from './components/Sidebar/Sidebar';
import WindowManager from './components/WindowManager/WindowManager';
import SimpleSignIn from './components/Auth/SimpleSignIn';
import FolderSelection from './components/Setup/FolderSelection';
import { Menu, PanelLeft } from 'lucide-react';

function App() {
  const { sidebarOpen, setSidebarOpen, theme, toggleSidebar } = useAppStore();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showFolderSelection, setShowFolderSelection] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const isAuth = googleAuth.isAuthenticated();
      setIsAuthenticated(isAuth);
      
      if (isAuth) {
        // Check if folder is set up
        const folderId = googleDriveStorage.getFolderId();
        if (!folderId) {
          setShowFolderSelection(true);
        }
      }
      
      setIsInitializing(false);
    } catch (error) {
      console.error('Error checking authentication:', error);
      setIsAuthenticated(false);
      setIsInitializing(false);
    }
  };

  const handleFolderSelection = async (folderName: string) => {
    try {
      const accessToken = localStorage.getItem('google_access_token');
      
      if (accessToken) {
        await googleDriveStorage.initialize(accessToken);
        const folderId = await googleDriveStorage.createFolder(folderName);
        googleDriveStorage.setFolderId(folderId);
        console.log('Folder created:', folderId);
        setShowFolderSelection(false);
      } else {
        console.log('No access token available, using placeholder');
        // Fallback: just mark as setup
        localStorage.setItem('project_folder_id', 'placeholder');
        setShowFolderSelection(false);
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      // Fallback: mark as setup anyway
      localStorage.setItem('project_folder_id', 'placeholder');
      setShowFolderSelection(false);
    }
  };

  // Apply theme to document
  useEffect(() => {
    const isDark = theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
  }, [theme]);

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

  return (
    <>
      {/* Folder Selection Modal */}
      {showFolderSelection && (
        <FolderSelection onComplete={handleFolderSelection} />
      )}

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
