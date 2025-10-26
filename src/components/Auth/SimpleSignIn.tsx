import React, { useState, useEffect } from 'react';
import { googleAuth } from '../../services/googleAuth';
import { Cloud, Loader, AlertCircle } from 'lucide-react';

const SimpleSignIn: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Create the Google Sign-In button
    setTimeout(() => {
      const buttonDiv = document.getElementById('google-signin-button');
      if (buttonDiv && window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
          callback: handleSignInResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        
        window.google.accounts.id.renderButton(buttonDiv, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
        });
      }
    }, 1000);
  }, []);

  const handleSignInResponse = async (response: any) => {
    setIsLoading(true);
    setError(null);

    try {
      // Decode JWT to get user info
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      const user = {
        name: payload.name || 'User',
        email: payload.email || '',
        picture: payload.picture
      };
      
      // Store user info
      localStorage.setItem('google_user', JSON.stringify(user));
      localStorage.setItem('google_authenticated', 'true');
      
      console.log('✅ Signed in user:', user);
      
      // Wait a moment before requesting Drive access
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Now get OAuth token for Drive API
      console.log('🔐 Requesting Google Drive access...');
      await getDriveAccessToken();
      
      // Wait a moment to ensure token is stored
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Reload the page
      console.log('🔄 Reloading page...');
      window.location.reload();
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setError(err.message || 'Failed to sign in');
      setIsLoading(false);
    }
  };

  const getDriveAccessToken = async () => {
    return new Promise<void>((resolve) => {
      try {
        console.log('Initializing Drive OAuth client...');
        
        let resolved = false;
        
        // Use OAuth flow to get Drive access token
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
          scope: 'https://www.googleapis.com/auth/drive.file',
          callback: (response: any) => {
            console.log('OAuth callback received:', response);
            if (!resolved) {
              if (response.access_token) {
                // Store the full token response including expires_at
                const tokenData = {
                  access_token: response.access_token,
                  expires_at: Date.now() + (response.expires_in * 1000),
                  expires_in: response.expires_in
                };
                localStorage.setItem('google_drive_token', JSON.stringify(tokenData));
                console.log('✅ Drive access token stored successfully');
                console.log('Token expires in:', response.expires_in, 'seconds');
                resolved = true;
                resolve();
              } else if (response.error) {
                console.error('❌ OAuth error:', response.error);
                setError(`Failed to get Drive access: ${response.error}`);
                resolved = true;
                resolve();
              }
            }
          },
        });

        console.log('📤 Requesting Drive access token with consent...');
        tokenClient.requestAccessToken({ prompt: 'consent' });
        
        // Timeout after 60 seconds
        setTimeout(() => {
          if (!resolved) {
            console.log('⏱️ OAuth timeout - user may have dismissed popup');
            setError('Drive access request timed out. Please try clicking the button again.');
            resolved = true;
            resolve();
          }
        }, 60000);
      } catch (error) {
        console.error('Error setting up Drive OAuth:', error);
        setError('Failed to initialize Drive access');
        resolve();
      }
    });
  };

  const handleManualSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const user = await googleAuth.signIn();
      console.log('Signed in user:', user);
      window.location.reload();
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setError(err.message || 'Failed to sign in');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
            <Cloud className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to Storyboard
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Sign in with Google to get started
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">Error</p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div id="google-signin-button" className="w-full flex justify-center scale-110"></div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Your stories will be stored securely in your Google Drive.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleSignIn;

