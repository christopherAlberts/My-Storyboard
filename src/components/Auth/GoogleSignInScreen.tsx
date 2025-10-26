import React, { useState, useEffect } from 'react';
import { googleDriveService } from '../../services/googleDriveService';
import { Cloud, Loader, CheckCircle, AlertCircle } from 'lucide-react';

// Global handler for Google Sign-In
declare global {
  interface Window {
    handleGoogleSignIn: (response: any) => void;
  }
}

const GoogleSignInScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasCredentials, setHasCredentials] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    checkAuthStatus();
    
    // Set up global Google Sign-In handler
    window.handleGoogleSignIn = (response: any) => {
      console.log('Google Sign-In response:', response);
      handleSignInComplete(response);
    };
    
    return () => {
      delete window.handleGoogleSignIn;
    };
  }, []);
  
  const handleSignInComplete = async (response: any) => {
    if (response.credential) {
      // Decode JWT token
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      const userInfo = {
        name: payload.name || 'Google User',
        email: payload.email || 'user@example.com'
      };
      
      localStorage.setItem('google_account_info', JSON.stringify(userInfo));
      localStorage.setItem('google_drive_authenticated', 'true');
      
      // Reload to show main app
      window.location.reload();
    }
  };

  const checkAuthStatus = async () => {
    try {
      // Always assume credentials are available (either from env or default)
      setHasCredentials(true);
      
      await googleDriveService.initialize();
      const isAuthenticated = googleDriveService.isAuthenticated();
      setIsInitializing(false);
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsInitializing(false);
    }
  };

  const handleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await googleDriveService.initialize();
      await googleDriveService.signIn();
      
      // Set authenticated flag in localStorage
      localStorage.setItem('google_drive_authenticated', 'true');
      
      // Account info will be stored from the token callback in googleDriveService
      
      // Force page reload to reinitialize app state
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setError(err.message || 'Failed to sign in to Google. Please try again.');
      setIsLoading(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Initializing...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
            <Cloud className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to Storyboard
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Sign in with Google to continue
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-6">
        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>All your projects are saved to your Google Drive</strong>
          </p>
        </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">Sign-in Failed</p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Sign In Button */}
          <div id="g_id_onload"
               data-client_id={import.meta.env.VITE_GOOGLE_CLIENT_ID || '518395988633-0v5mlv2h4p9kr4vl5eqq8ckuh5n7h7h3.apps.googleusercontent.com'}
               data-callback="handleGoogleSignIn"
               data-auto_prompt="false">
          </div>
          <div className="g_id_signin" 
               data-type="standard"
               data-size="large"
               data-theme="outline"
               data-text="sign_in_with"
               data-shape="rectangular"
               data-logo_alignment="left">
          </div>
          
          <button
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] mt-4"
          >
            {isLoading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Sign in with Google (Manual)</span>
              </>
            )}
          </button>

          {/* Additional Info */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Secure Storage</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your data is stored securely in your Google Drive
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Cloud Sync</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Access your projects from any device
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Privacy First</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Only you can access your data
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          By signing in, you agree to our terms of service and privacy policy
        </p>
      </div>
    </div>
  );
};

export default GoogleSignInScreen;

