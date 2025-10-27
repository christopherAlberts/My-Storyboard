// Simplified Google Authentication Service
// This handles ONLY the OAuth flow and user info

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

export interface GoogleUser {
  name: string;
  email: string;
  picture?: string;
}

class GoogleAuthService {
  private static instance: GoogleAuthService;
  private clientId: string;
  private isInitialized = false;
  private currentUser: GoogleUser | null = null;

  private constructor() {
    this.clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  }

  static getInstance(): GoogleAuthService {
    if (!GoogleAuthService.instance) {
      GoogleAuthService.instance = new GoogleAuthService();
    }
    return GoogleAuthService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Load Google Sign-In API
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    await new Promise((resolve) => {
      script.onload = () => resolve(null);
    });

    // Wait for Google to be available
    await this.waitForGoogle();

    this.isInitialized = true;
  }

  private waitForGoogle(): Promise<void> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (window.google && window.google.accounts) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, 5000);
    });
  }

  async signIn(): Promise<GoogleUser> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      window.google.accounts.id.initialize({
        client_id: this.clientId,
        callback: (response: any) => {
          try {
            // Decode JWT token
            const payload = JSON.parse(atob(response.credential.split('.')[1]));
            const user: GoogleUser = {
              name: payload.name || 'User',
              email: payload.email || '',
              picture: payload.picture
            };
            
            this.currentUser = user;
            localStorage.setItem('google_user', JSON.stringify(user));
            localStorage.setItem('google_authenticated', 'true');
            
            resolve(user);
          } catch (error) {
            reject(error);
          }
        }
      });

      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Show button instead
          window.google.accounts.id.renderButton(
            document.getElementById('google-signin-button')!,
            { theme: 'outline', size: 'large' }
          );
        }
      });
    });
  }

  async signOut(): Promise<void> {
    window.google.accounts.id.disableAutoSelect();
    this.currentUser = null;
    localStorage.removeItem('google_user');
    localStorage.removeItem('google_authenticated');
    localStorage.removeItem('project_folder_id');
  }

  isAuthenticated(): boolean {
    return localStorage.getItem('google_authenticated') === 'true';
  }

  getCurrentUser(): GoogleUser | null {
    if (this.currentUser) return this.currentUser;
    
    const stored = localStorage.getItem('google_user');
    if (stored) {
      try {
        this.currentUser = JSON.parse(stored);
        return this.currentUser;
      } catch {
        return null;
      }
    }
    
    return null;
  }
}

export const googleAuth = GoogleAuthService.getInstance();


