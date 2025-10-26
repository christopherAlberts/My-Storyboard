import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { FileText, Layout, Database, Map, Settings, X, Sun, Moon, Folder, FolderOpen } from 'lucide-react';

const Sidebar: React.FC = () => {
  const {
    sidebarOpen,
    setSidebarOpen,
    openWindow,
    theme,
    toggleTheme,
  } = useAppStore();

  const menuItems = [
    {
      id: 'document',
      label: 'Document Editor',
      icon: FileText,
      description: 'Rich text editor for writing',
    },
    {
      id: 'storyboard',
      label: 'Storyboard View',
      icon: Layout,
      description: 'Infinite canvas for storyboarding',
    },
    {
      id: 'database',
      label: 'Database View',
      icon: Database,
      description: 'Manage characters, locations, and plot points',
    },
    {
      id: 'mapbuilder',
      label: 'Map Builder',
      icon: Map,
      description: 'Create interactive town maps with notes and characters',
    },
    {
      id: 'projectfiles',
      label: 'Project Files',
      icon: Folder,
      description: 'View and download project files',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      description: 'Appearance and preferences',
    },
  ] as const;

  const handleOpenWindow = (type: typeof menuItems[0]['id']) => {
    const titles = {
      document: 'Document Editor',
      storyboard: 'Storyboard View',
      database: 'Database View',
      mapbuilder: 'Map Builder',
      projectfiles: 'Project Files',
      settings: 'Settings',
    };
    
    openWindow(type, titles[type]);
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out z-50 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Storyboard
            </h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {localStorage.getItem('current_project_name') || 'No project'}
              </p>
            </div>
            <button
              onClick={() => {
                // Show project selection modal
                localStorage.removeItem('current_project_folder_id');
                localStorage.removeItem('current_project_name');
                window.location.reload();
              }}
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Switch Project"
            >
              <FolderOpen className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleOpenWindow(item.id)}
                className="w-full flex items-start space-x-3 p-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
              >
                <Icon className="w-5 h-5 text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-200 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {item.description}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Theme Toggle */}
        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center space-x-3 p-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5 text-gray-500" />
            ) : (
              <Sun className="w-5 h-5 text-gray-500" />
            )}
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
