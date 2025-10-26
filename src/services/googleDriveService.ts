// Google Drive integration for project sync
// Uses Google Drive API to store projects, documents, and database as JSON files

// Declare global types for Google API
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

declare const gapi: any;
declare const google: any;

export interface GoogleDriveConfig {
  apiKey: string;
  clientId: string;
  discoveryDocs: string[];
  scopes: string;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
}

export interface ProjectMetadata {
  name: string;
  folderId: string;
  lastSynced: string;
}

class GoogleDriveService {
  private static instance: GoogleDriveService;
  private gapiLoaded = false;
  private tokenClient: any = null;
  private config: GoogleDriveConfig | null = null;
  private isSignedIn = false;

  private constructor() {
    // Load gapi script
    this.loadGapi();
  }

  static getInstance(): GoogleDriveService {
    if (!GoogleDriveService.instance) {
      GoogleDriveService.instance = new GoogleDriveService();
    }
    return GoogleDriveService.instance;
  }

  private loadGapi(): void {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => this.initializeGapi();
    document.head.appendChild(script);
  }

  private initializeGapi(): void {
    gapi.load('client', async () => {
      this.gapiLoaded = true;
    });
  }

  async initialize(config: GoogleDriveConfig): Promise<void> {
    this.config = config;

    if (!this.gapiLoaded) {
      await new Promise((resolve) => {
        const checkGapi = setInterval(() => {
          if (this.gapiLoaded) {
            clearInterval(checkGapi);
            resolve(null);
          }
        }, 100);
      });
    }

    await gapi.client.init({
      apiKey: config.apiKey,
      discoveryDocs: config.discoveryDocs,
    });

    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: config.clientId,
      scope: config.scopes,
      callback: (response: any) => {
        this.isSignedIn = true;
        console.log('Successfully signed in to Google Drive');
      },
    });
  }

  async signIn(): Promise<void> {
    if (!this.tokenClient) {
      throw new Error('Google Drive service not initialized');
    }

    return new Promise((resolve, reject) => {
      this.tokenClient.requestAccessToken({ prompt: 'consent' });
      
      // Check sign-in status
      const checkInterval = setInterval(() => {
        if (this.isSignedIn) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('Sign-in timeout'));
      }, 10000);
    });
  }

  async signOut(): Promise<void> {
    if (gapi.client.getToken()) {
      google.accounts.oauth2.revoke(gapi.client.getToken().access_token);
      gapi.client.setToken('');
      this.isSignedIn = false;
    }
  }

  isAuthenticated(): boolean {
    return this.isSignedIn && gapi.client.getToken() !== null;
  }

  // Create a new project folder on Google Drive
  async createProjectFolder(projectName: string): Promise<string> {
    const metadata: DriveFile = {
      name: projectName,
      mimeType: 'application/vnd.google-apps.folder',
    };

    const response = await gapi.client.drive.files.create({
      resource: metadata,
      fields: 'id',
    });

    return response.result.id as string;
  }

  // Get or create a project folder
  async getProjectFolder(projectName: string): Promise<string> {
    try {
      // Search for existing folder
      const response = await gapi.client.drive.files.list({
        q: `name='${projectName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
      });

      if (response.result.files && response.result.files.length > 0) {
        return response.result.files[0].id as string;
      }

      // Create new folder if not found
      return await this.createProjectFolder(projectName);
    } catch (error) {
      console.error('Error getting project folder:', error);
      throw error;
    }
  }

  // Upload JSON file to Google Drive
  async uploadFile(
    folderId: string,
    fileName: string,
    content: string,
    mimeType: string = 'application/json'
  ): Promise<string> {
    try {
      const file = new Blob([content], { type: mimeType });
      const metadata: DriveFile = {
        name: fileName,
        mimeType: mimeType,
        parents: [folderId],
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);

      const response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${gapi.client.getToken().access_token}`,
          },
          body: form,
        }
      );

      const result = await response.json();
      return result.id as string;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  // Update existing file on Google Drive
  async updateFile(fileId: string, content: string, mimeType: string = 'application/json'): Promise<void> {
    try {
      const file = new Blob([content], { type: mimeType });

      await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${gapi.client.getToken().access_token}`,
            'Content-Type': mimeType,
          },
          body: file,
        }
      );
    } catch (error) {
      console.error('Error updating file:', error);
      throw error;
    }
  }

  // Get file from Google Drive
  async getFile(fileId: string): Promise<string> {
    try {
      const response = await gapi.client.drive.files.get({
        fileId,
        alt: 'media',
      });

      return response.body as string;
    } catch (error) {
      console.error('Error getting file:', error);
      throw error;
    }
  }

  // List files in a folder
  async listFiles(folderId: string): Promise<DriveFile[]> {
    try {
      const response = await gapi.client.drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'files(id, name, mimeType)',
      });

      return response.result.files as DriveFile[];
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  // Sync entire project to Google Drive
  async syncProject(projectName: string, projectData: any): Promise<ProjectMetadata> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with Google Drive');
    }

    // Get or create project folder
    const folderId = await this.getProjectFolder(projectName);

    // Upload project database as JSON
    const projectDataJson = JSON.stringify(projectData, null, 2);
    const dataFileName = `${projectName}_data.json`;

    try {
      // Try to find existing file
      const files = await this.listFiles(folderId);
      const existingFile = files.find((f) => f.name === dataFileName);

      if (existingFile) {
        await this.updateFile(existingFile.id, projectDataJson);
      } else {
        await this.uploadFile(folderId, dataFileName, projectDataJson);
      }
    } catch (error) {
      console.error('Error syncing project data:', error);
    }

    return {
      name: projectName,
      folderId,
      lastSynced: new Date().toISOString(),
    };
  }

  // Download project from Google Drive
  async downloadProject(projectName: string): Promise<any> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with Google Drive');
    }

    const folderId = await this.getProjectFolder(projectName);
    const files = await this.listFiles(folderId);
    const dataFile = files.find((f) => f.name.endsWith('_data.json'));

    if (!dataFile) {
      throw new Error('Project data file not found');
    }

    const content = await this.getFile(dataFile.id);
    return JSON.parse(content);
  }
}

export const googleDriveService = GoogleDriveService.getInstance();

