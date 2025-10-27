import React, { useState, useEffect } from 'react';
import { googleAuth } from '../../services/googleAuth';
import { Cloud, Loader, AlertCircle, Info } from 'lucide-react';

const SimpleSignIn: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [requestingDrive, setRequestingDrive] = useState(false);
  const [buttonError, setButtonError] = useState(false);
  const [currentOrigin, setCurrentOrigin] = useState('');
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    // Set current origin for error messages
    setCurrentOrigin(window.location.origin);
    
    // Listen for Google Sign-In errors
    const errorHandler = (event: ErrorEvent) => {
      if (event.message?.includes('origin') || event.message?.includes('403') || event.message?.includes('GSI_LOGGER') || event.filename?.includes('accounts.google.com')) {
        setButtonError(true);
        setError(`Origin not authorized: ${window.location.origin}. Please add this URL to Google Cloud Console.`);
      }
    };
    
    window.addEventListener('error', errorHandler);
    
    // Create the Google Sign-In button
    if (!signedIn) {
      const initButton = () => {
        const buttonDiv = document.getElementById('google-signin-button');
        if (buttonDiv && window.google) {
          try {
            // Clear any existing button
            buttonDiv.innerHTML = '';
            
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
            
            // Check if button rendered successfully after delay
            setTimeout(() => {
              const checkDiv = document.getElementById('google-signin-button');
              if (checkDiv && checkDiv.children.length === 0) {
                console.warn('Google Sign-In button did not render - likely origin not authorized');
                setButtonError(true);
              }
            }, 3000);
          } catch (err) {
            console.error('Error rendering Google button:', err);
            setButtonError(true);
          }
        } else if (window.google) {
          // Button div doesn't exist yet, wait and retry
          setTimeout(initButton, 500);
        } else {
          // Google library not loaded yet, wait and retry
          setTimeout(initButton, 1000);
        }
      };
      
      // Start initialization
      setTimeout(initButton, 1000);
    } else {
      // Hide the button when signed in
      const buttonDiv = document.getElementById('google-signin-button');
      if (buttonDiv) {
        buttonDiv.innerHTML = '';
      }
    }
    
    return () => {
      window.removeEventListener('error', errorHandler);
    };
  }, [signedIn]);

  const handleSignInResponse = async (response: any) => {
    setIsLoading(true);
    setError(null);

    try {
      // Decode JWT to get user info
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      const userData = {
        name: payload.name || 'User',
        email: payload.email || '',
        picture: payload.picture
      };
      
      // Store user info
      localStorage.setItem('google_user', JSON.stringify(userData));
      localStorage.setItem('google_authenticated', 'true');
      
      console.log('✅ Signed in user:', userData);
      
      setUser(userData);
      setSignedIn(true);
      setIsLoading(false);
      
      // Don't automatically request Drive access - let user click button
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setError(err.message || 'Failed to sign in');
      setIsLoading(false);
    }
  };

  const handleDriveAccess = async () => {
    setRequestingDrive(true);
    setError(null);
    
    try {
      await getDriveAccessToken();
      
      // Wait a moment to ensure token is stored
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Reload the page
      console.log('🔄 Reloading page...');
      window.location.reload();
    } catch (err: any) {
      console.error('Drive access error:', err);
      setError(err.message || 'Failed to get Drive access');
      setRequestingDrive(false);
    }
  };

  const getDriveAccessToken = async () => {
    return new Promise<void>((resolve, reject) => {
      try {
        console.log('Initializing Drive OAuth client...');
        
        if (!window.google || !window.google.accounts) {
          throw new Error('Google Sign-In library not loaded. Please refresh the page.');
        }
        
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
                if (response.error === 'popup_blocked' || response.error === 'popup_closed_by_user') {
                  setError('Popup was blocked. Please allow popups for this site and try again.');
                } else {
                  setError(`Failed to get Drive access: ${response.error}`);
                }
                resolved = true;
                reject(new Error(response.error));
              }
            }
          },
        });

        console.log('📤 Requesting Drive access token with consent...');
        
        // Check if popup might be blocked
        const checkPopup = () => {
          setTimeout(() => {
            if (!resolved) {
              console.log('⏱️ OAuth timeout - popup may have been blocked');
              // Don't set error immediately, wait for user to see popup
            }
          }, 3000);
        };
        
        checkPopup();
        tokenClient.requestAccessToken({ prompt: 'consent' });
        
        // Timeout after 60 seconds
        setTimeout(() => {
          if (!resolved) {
            console.log('⏱️ OAuth timeout - user may have dismissed popup');
            setError('Drive access request timed out. If a popup was blocked, please allow popups and try again.');
            resolved = true;
            reject(new Error('Timeout'));
          }
        }, 60000);
      } catch (error: any) {
        console.error('Error setting up Drive OAuth:', error);
        setError(error.message || 'Failed to initialize Drive access');
        reject(error);
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
            {signedIn ? 'Grant Drive access to continue' : 'Sign in with Google to get started'}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-6 transition-all duration-300">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">Error</p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                {error.includes('origin') && (
                  <div className="mt-3 text-xs text-red-600 dark:text-red-400">
                    <p className="font-medium mb-1">To fix this:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></li>
                      <li>Select your OAuth 2.0 Client ID</li>
                      <li>Add <code className="bg-red-100 dark:bg-red-900/30 px-1 rounded">http://localhost:5174</code> to Authorized JavaScript origins</li>
                      <li>Save and wait a few minutes for changes to propagate</li>
                    </ol>
                  </div>
                )}
                {error.includes('popup') && (
                  <div className="mt-3 text-xs text-red-600 dark:text-red-400">
                    <p className="font-medium mb-1">To allow popups:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Click the popup blocker icon in your browser's address bar</li>
                      <li>Select "Always allow popups from this site"</li>
                      <li>Refresh the page and try again</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {!signedIn ? (
            <>
              <div className="space-y-4 transition-opacity duration-300">
                {/* Google Sign-In Button */}
                <div id="google-signin-button" className="w-full flex justify-center scale-110 min-h-[50px]"></div>
                
                {/* Fallback Manual Sign-In Button */}
                {(buttonError || !window.google) && (
                  <div className="space-y-3">
                    <button
                      onClick={handleManualSignIn}
                      disabled={isLoading}
                      className="w-full bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-200 font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
                    >
                      {isLoading ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          <span>Signing in...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          <span>Sign in with Google</span>
                        </>
                      )}
                    </button>
                    
                    {/* Configuration Help */}
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                            Origin Not Authorized
                          </p>
                          <p className="text-xs text-red-700 dark:text-red-300 mb-3">
                            The Google Sign-In button isn't loading because <code className="bg-red-100 dark:bg-red-900/30 px-1 rounded font-mono">{currentOrigin}</code> is not authorized in Google Cloud Console.
                          </p>
                          <div className="text-xs text-red-700 dark:text-red-300 space-y-2">
                            <p className="font-medium">To fix this:</p>
                            <ol className="list-decimal list-inside space-y-1 ml-2">
                              <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="underline font-medium">Google Cloud Console → Credentials</a></li>
                              <li>Click on your OAuth 2.0 Client ID</li>
                              <li>Under "Authorized JavaScript origins", click "Add URI"</li>
                              <li>Add: <code className="bg-red-100 dark:bg-red-900/30 px-1 rounded font-mono">{currentOrigin}</code></li>
                              <li>Click "Save" and wait 2-3 minutes</li>
                              <li>Refresh this page</li>
                            </ol>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {!buttonError && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Your stories will be stored securely in your Google Drive.
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="space-y-6 transition-opacity duration-300">
                {/* User Info Section */}
                <div className="flex flex-col items-center space-y-3 pb-2">
                  {/* Profile Picture with Fallback */}
                  <div className="relative">
                    {user?.picture && !imageError ? (
                      <img 
                        src={user.picture} 
                        alt={user.name} 
                        className="w-16 h-16 rounded-full border-2 border-blue-200 dark:border-blue-700 shadow-md object-cover"
                        onError={(e) => {
                          console.warn('Profile image failed to load:', user.picture);
                          setImageError(true);
                        }}
                        onLoad={() => {
                          console.log('Profile image loaded successfully');
                        }}
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full border-2 border-blue-200 dark:border-blue-700 shadow-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white text-2xl font-bold">
                          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-lg text-gray-900 dark:text-white">{user?.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{user?.email}</p>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Signed in successfully</span>
                  </div>
                </div>

                {/* Drive Access Button */}
                <div className="space-y-4">
                  <button
                    onClick={handleDriveAccess}
                    disabled={requestingDrive || isLoading}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {requestingDrive ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        <span>Requesting Drive Access...</span>
                      </>
                    ) : (
                      <>
                        <Cloud className="w-5 h-5" />
                        <span>Grant Google Drive Access</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Popup Warning */}
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                        Allow Popups
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        Your browser may block the authorization popup. Click the popup blocker icon in your address bar and allow popups for this site.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleSignIn;

