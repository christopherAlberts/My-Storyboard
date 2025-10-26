import React, { useState, useEffect } from 'react';
import { storageService } from '../../services/storageService';
import { googleDriveService, GoogleDriveConfig } from '../../services/googleDriveService';
import { Cloud, CloudOff, Upload, Download, Sync, Loader, Check } from 'lucide-react';

interface GoogleDriveSyncProps {
  projectName?: string;
}

const GoogleDriveSync: React.FC<GoogleDriveSyncProps> = ({ projectName = 'My Storyboard Project' }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [config, setConfig] = useState<GoogleDriveConfig | null>(null);
  const [status, setStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    loadConfig();
    checkConnection();
  }, []);

  const loadConfig = () => {
    // In production, these should come from environment variables
    const apiConfig: GoogleDriveConfig = {
      apiKey: import.meta.env.VITE_GOOGLE_API_KEY || '',
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
      scopes: 'https://www.googleapis.com/auth/drive.file',
    };

    if (apiConfig.apiKey && apiConfig.clientId) {
      setConfig(apiConfig);
      googleDriveService.initialize(apiConfig);
    }
  };

  const checkConnection = () => {
    const connected = googleDriveService.isAuthenticated();
    setIsConnected(connected);
  };

  const handleSignIn = async () => {
    if (!config) {
      alert('Google Drive API not configured. Please set VITE_GOOGLE_API_KEY and VITE_GOOGLE_CLIENT_ID environment variables.');
      return;
    }

    setIsLoading(true);
    try {
      await googleDriveService.signIn();
      setIsConnected(true);
      setStatusMessage('Successfully connected to Google Drive');
      setStatus('success');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (error) {
      console.error('Error signing in:', error);
      setStatusMessage('Failed to sign in to Google Drive');
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await googleDriveService.signOut();
      setIsConnected(false);
      setLastSynced(null);
      setStatusMessage('Disconnected from Google Drive');
      setStatus('success');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (error) {
      console.error('Error signing out:', error);
      setStatusMessage('Failed to sign out');
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadProject = async () => {
    if (!isConnected) {
      await handleSignIn();
      return;
    }

    setIsLoading(true);
    setStatus('syncing');
    setStatusMessage('Uploading project to Google Drive...');

    try {
      const projectData = storageService.getData();
      const result = await googleDriveService.syncProject(projectName, projectData);
      
      setLastSynced(new Date(result.lastSynced));
      setStatusMessage('Project uploaded successfully!');
      setStatus('success');
      
      // Store sync metadata
      localStorage.setItem('googleDriveSync', JSON.stringify(result));
      
      setTimeout(() => setStatus('idle'), 2000);
    } catch (error) {
      console.error('Error uploading project:', error);
      setStatusMessage('Failed to upload project');
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadProject = async () => {
    if (!isConnected) {
      await handleSignIn();
      return;
    }

    setIsLoading(true);
    setStatus('syncing');
    setStatusMessage('Downloading project from Google Drive...');

    try {
      const projectData = await googleDriveService.downloadProject(projectName);
      
      // Import the downloaded data
      storageService.importData(JSON.stringify(projectData));
      
      setStatusMessage('Project downloaded successfully!');
      setStatus('success');
      
      setTimeout(() => setStatus('idle'), 2000);
    } catch (error) {
      console.error('Error downloading project:', error);
      setStatusMessage('Failed to download project');
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    if (!isConnected) {
      await handleSignIn();
      return;
    }

    await handleUploadProject();
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'syncing':
        return <Loader className="w-4 h-4 animate-spin" />;
      case 'success':
        return <Check className="w-4 h-4" />;
      case 'error':
        return <CloudOff className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'syncing':
        return 'text-blue-500';
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
          <Cloud className="w-5 h-5" />
          <span>Google Drive Sync</span>
        </h3>
        {isConnected && (
          <span className="text-sm text-green-600 dark:text-green-400 flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Connected</span>
          </span>
        )}
      </div>

      {!config && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Google Drive API not configured. Please set the following environment variables:
          </p>
          <ul className="mt-2 text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside">
            <li><code>VITE_GOOGLE_API_KEY</code></li>
            <li><code>VITE_GOOGLE_CLIENT_ID</code></li>
          </ul>
        </div>
      )}

      {config && (
        <>
          <div className="space-y-3">
            {!isConnected ? (
              <button
                onClick={handleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Cloud className="w-4 h-4" />
                )}
                <span>Connect to Google Drive</span>
              </button>
            ) : (
              <>
                <button
                  onClick={handleSignOut}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CloudOff className="w-4 h-4" />
                  <span>Disconnect</span>
                </button>

                <div className="space-y-2">
                  <button
                    onClick={handleSync}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {getStatusIcon()}
                    <span>
                      {status === 'syncing' ? 'Syncing...' : 
                       status === 'success' ? 'Synced!' : 
                       'Sync to Google Drive'}
                    </span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleUploadProject}
                      disabled={isLoading}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload</span>
                    </button>
                    <button
                      onClick={handleDownloadProject}
                      disabled={isLoading}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {lastSynced && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Last synced: {lastSynced.toLocaleString()}
              </div>
            )}
          </div>

          {statusMessage && (
            <div className={`text-sm ${getStatusColor()}`}>
              {statusMessage}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GoogleDriveSync;

