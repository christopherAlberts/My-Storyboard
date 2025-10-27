import React, { useState, useEffect } from 'react';
import { storageService } from '../../services/storageService';
import { googleDriveService } from '../../services/googleDriveService';
import { Cloud, CloudOff, Upload, Download, Sync, Loader, Check } from 'lucide-react';

interface GoogleDriveSyncProps {
  projectName?: string;
}

const GoogleDriveSync: React.FC<GoogleDriveSyncProps> = ({ projectName = 'My Storyboard Project' }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [needsConfig, setNeedsConfig] = useState(false);
  const [status, setStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    initializeGoogleDrive();
    checkConnection();
  }, []);

  const initializeGoogleDrive = async () => {
    try {
      // Try to auto-initialize with environment variables if available
      await googleDriveService.initialize();
      
      // Check if we have the necessary credentials
      const hasClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
      if (!hasClientId) {
        setNeedsConfig(true);
      }
    } catch (error) {
      console.error('Error initializing Google Drive:', error);
      setNeedsConfig(true);
    }
  };

  const checkConnection = () => {
    const connected = googleDriveService.isAuthenticated();
    setIsConnected(connected);
  };

  const handleSignIn = async () => {
    setIsLoading(true);
    setStatusMessage('Connecting to Google...');
    setStatus('syncing');
    
    try {
      // Initialize if not already done
      await googleDriveService.initialize();
      
      await googleDriveService.signIn();
      setIsConnected(true);
      checkConnection();
      setStatusMessage('Successfully connected to Google Drive');
      setStatus('success');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (error: any) {
      console.error('Error signing in:', error);
      setStatusMessage(error.message || 'Failed to sign in to Google Drive');
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (!window.confirm('Signing out will reload the app. Are you sure you want to continue?')) {
      return;
    }

    setIsLoading(true);
    try {
      await googleDriveService.signOut();
      setIsConnected(false);
      setLastSynced(null);
      
      // Reload the app to show sign-in screen
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Error signing out:', error);
      setStatusMessage('Failed to sign out');
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
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
    setStatusMessage('Saving to Google Drive...');

    try {
      const projectData = storageService.getData();
      const folderId = localStorage.getItem('current_project_folder_id');
      
      if (!folderId || folderId === 'placeholder') {
        setStatusMessage('No project selected');
        setStatus('error');
        setTimeout(() => setStatus('idle'), 3000);
        setIsLoading(false);
        return;
      }
      
      // Force save everything to Google Drive
      await googleDriveService.saveProjectToFolder(folderId, projectData, true);
      
      // Save all documents
      for (const doc of projectData.documents) {
        try {
          await googleDriveService.saveDocumentToFolder(folderId, doc);
        } catch (error) {
          console.error(`Failed to save document ${doc.title}:`, error);
        }
      }
      
      setLastSynced(new Date());
      setStatusMessage('Successfully saved to Google Drive!');
      setStatus('success');
      
      setTimeout(() => setStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving to Google Drive:', error);
      setStatusMessage('Failed to save to Google Drive');
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
    setStatusMessage('Loading project from Google Drive...');

    try {
      const folderId = localStorage.getItem('current_project_folder_id');
      
      if (!folderId || folderId === 'placeholder') {
        setStatusMessage('No project selected');
        setStatus('error');
        setTimeout(() => setStatus('idle'), 3000);
        setIsLoading(false);
        return;
      }
      
      // Load project data from Google Drive
      const projectData = await googleDriveService.loadProjectFromFolder(folderId);
      const documents = await googleDriveService.loadDocumentsFromFolder(folderId);
      projectData.documents = documents;
      
      // Initialize storage service with Google Drive data
      await storageService.initialize(projectData);
      
      setStatusMessage('Project loaded successfully!');
      setStatus('success');
      
      setTimeout(() => setStatus('idle'), 2000);
    } catch (error) {
      console.error('Error loading project:', error);
      setStatusMessage('Failed to load project');
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

      {needsConfig && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
            To use Google Drive sync, you need to set up OAuth credentials:
          </p>
          <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-3">
            Create a <code>VITE_GOOGLE_CLIENT_ID</code> in your <code>.env</code> file. See the setup guide for details.
          </p>
          <a 
            href="HOW_TO_GET_GOOGLE_CREDENTIALS.md" 
            target="_blank"
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            View Setup Guide →
          </a>
        </div>
      )}

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
            <span>Sign in with Google</span>
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

                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-200 text-center">
                    ✅ Auto-save enabled - All changes save automatically to Google Drive
                  </p>
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
    </div>
  );
};

export default GoogleDriveSync;

