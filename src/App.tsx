import { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import Sidebar from './components/Sidebar/Sidebar';
import WindowManager from './components/WindowManager/WindowManager';
import { Menu } from 'lucide-react';

function App() {
  const { sidebarOpen, setSidebarOpen, theme } = useAppStore();

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <div className={`h-screen w-screen overflow-hidden ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg lg:hidden"
      >
        <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>

      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className={`h-full transition-all duration-300 ${
        sidebarOpen ? 'lg:ml-64' : 'ml-0'
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
              Click on the menu items in the sidebar to get started
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
