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

  // Check if token is stored in localStorage
  private hasStoredToken(): boolean {
    return !!this.getStoredToken();
  }

  private getStoredToken(): any {
    try {
      const token = localStorage.getItem('google_drive_token');
      return token ? JSON.parse(token) : null;
    } catch {
      return null;
    }
  }

  private setStoredToken(token: any): void {
    if (token) {
      localStorage.setItem('google_drive_token', JSON.stringify(token));
    } else {
      localStorage.removeItem('google_drive_token');
    }
  }

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
    const apiScript = document.createElement('script');
    apiScript.src = 'https://apis.google.com/js/api.js';
    apiScript.onload = () => this.initializeGapi();
    document.head.appendChild(apiScript);
  }

  private initializeGapi(): void {
    gapi.load('client', async () => {
      this.gapiLoaded = true;
      // Load GSI (Google Sign-In) library
      const gsiScript = document.createElement('script');
      gsiScript.src = 'https://accounts.google.com/gsi/client';
      gsiScript.async = true;
      gsiScript.defer = true;
      document.head.appendChild(gsiScript);
    });
  }

  async initialize(config?: GoogleDriveConfig): Promise<void> {
    // Get client ID from environment or prompt user to configure
    const envClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    
    // Default development client ID for localhost testing
    // Users should replace this with their own from Google Cloud Console
    const defaultClientId = '518395988633-0v5mlv2h4p9kr4vl5eqq8ckuh5n7h7h3.apps.googleusercontent.com';
    
    this.config = config || {
      apiKey: import.meta.env.VITE_GOOGLE_API_KEY || '',
      clientId: envClientId || defaultClientId,
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
      scopes: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email',
    };

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

    // Only initialize with API key if provided
    if (this.config.apiKey) {
      await gapi.client.init({
        apiKey: this.config.apiKey,
        discoveryDocs: this.config.discoveryDocs,
      });
    } else {
      // Initialize without API key for OAuth-only flow
      await gapi.client.init({
        discoveryDocs: this.config.discoveryDocs,
      });
    }

    // Restore stored token if available
    const storedToken = this.getStoredToken();
    if (storedToken && storedToken.access_token) {
      console.log('🔑 Restoring stored token...');
      
      // Check if expires_at exists and is valid
      const hasValidExpiry = storedToken.expires_at && storedToken.expires_at > 1000000000000; // Must be after 2001
      
      if (hasValidExpiry) {
        console.log('Token expires at:', new Date(storedToken.expires_at));
        console.log('Current time:', new Date());
        
        // Check if token is expired
        const isExpired = Date.now() >= storedToken.expires_at;
        if (isExpired) {
          console.log('⚠️ Token is expired, will need to re-authenticate');
          this.setStoredToken(null);
          return; // Don't proceed further without valid token
        }
      } else {
        console.log('⚠️ Token has invalid expiration date, will need to re-authenticate');
        this.setStoredToken(null);
        return; // Don't proceed further without valid token
      }
      
      gapi.client.setToken(storedToken);
      this.isSignedIn = true;
      console.log('✅ Token restored successfully');
    } else {
      console.log('ℹ️ No stored token found');
    }

    // Wait for Google auth library and set up token client if client ID is provided
    if (this.config.clientId) {
      // Wait for window.google to be available
      await this.waitForGoogleAuth();
      
      if (window.google) {
        this.tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: this.config.clientId,
          scope: this.config.scopes,
          callback: (response: any) => {
            if (response.access_token) {
              gapi.client.setToken(response);
              this.setStoredToken(response);
              this.isSignedIn = true;
              console.log('Successfully signed in to Google Drive');
            }
          },
        });
      }
    }
  }

  private waitForGoogleAuth(): Promise<void> {
    return new Promise((resolve) => {
      if (window.google && window.google.accounts) {
        resolve();
      } else {
        const checkInterval = setInterval(() => {
          if (window.google && window.google.accounts) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
        
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve(); // Continue anyway after 5 seconds
        }, 5000);
      }
    });
  }

  async signIn(): Promise<void> {
    if (!this.tokenClient) {
      // Try to initialize if not already done
      if (!this.config) {
        await this.initialize();
      }
      
      if (!this.tokenClient) {
        throw new Error('Google Drive OAuth client not initialized. Please configure OAuth credentials.');
      }
    }

    return new Promise((resolve, reject) => {
      let resolved = false;
      
      // Store callback reference
      const tokenCallback = (response: any) => {
        console.log('Token callback called:', response);
        if (!resolved && response && !response.error) {
          if (response.access_token) {
            console.log('Setting token in gapi client');
            gapi.client.setToken(response);
            this.setStoredToken(response);
            this.isSignedIn = true;
            
            console.log('Successfully signed in to Google Drive');
            
            // Store user info placeholder
            const userInfo = {
              name: 'Google User',
              email: 'user@example.com'
            };
            localStorage.setItem('google_account_info', JSON.stringify(userInfo));
          }
          resolved = true;
          clearInterval(checkInterval);
          resolve();
        } else if (response && response.error && !resolved) {
          console.error('Token callback error:', response.error);
          resolved = true;
          clearInterval(checkInterval);
          reject(new Error(response.error || 'Sign-in failed'));
        }
      };
      
      // Override the callback
      this.tokenClient.callback = tokenCallback;

      this.tokenClient.requestAccessToken({ prompt: 'consent' });
      
      // Check sign-in status
      const checkInterval = setInterval(() => {
        if (this.isSignedIn && !resolved) {
          resolved = true;
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);

      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          clearInterval(checkInterval);
          reject(new Error('Sign-in timeout'));
        }
      }, 60000); // Increased timeout for OAuth flow
    });
  }

  async signOut(): Promise<void> {
    if (gapi.client.getToken()) {
      google.accounts.oauth2.revoke(gapi.client.getToken().access_token);
      gapi.client.setToken('');
      this.isSignedIn = false;
    }
    this.setStoredToken(null);
    // Clear authentication flag and account info
    localStorage.removeItem('google_drive_authenticated');
    localStorage.removeItem('google_account_info');
  }

  isAuthenticated(): boolean {
    // Check if we have a token stored or in gapi client
    try {
      const storedToken = this.getStoredToken();
      const gapiToken = gapi.client?.getToken();
      
      // Verify stored token is valid
      if (storedToken) {
        const hasValidExpiry = storedToken.expires_at && storedToken.expires_at > 1000000000000;
        const isExpired = hasValidExpiry && Date.now() >= storedToken.expires_at;
        
        if (!hasValidExpiry || isExpired) {
          // Token is invalid or expired
          return false;
        }
      }
      
      // If we have a stored token, set it in gapi client
      if (storedToken && !gapiToken) {
        gapi.client.setToken(storedToken);
        this.isSignedIn = true;
      }
      
      return this.isSignedIn || !!storedToken || !!gapiToken;
    } catch {
      return false;
    }
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

  // List all project folders (folders containing _data.json files)
  async listProjectFolders(): Promise<Array<{ id: string; name: string; lastModified?: string }>> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with Google Drive');
    }

    try {
      console.log('🔍 Listing project folders...');
      
      // Get all folders
      const foldersResponse = await gapi.client.drive.files.list({
        q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
        fields: 'files(id, name, modifiedTime)',
        orderBy: 'modifiedTime desc',
      });

      const folders = foldersResponse.result.files || [];
      console.log(`📁 Found ${folders.length} folders`);
      
      // For each folder, check if it contains a _data.json file
      const projectFolders = [];
      for (const folder of folders) {
        try {
          const files = await this.listFiles(folder.id);
          const hasDataFile = files.some(f => f.name.endsWith('_data.json'));
          
          if (hasDataFile) {
            projectFolders.push({
              id: folder.id,
              name: folder.name,
              lastModified: folder.modifiedTime,
            });
            console.log(`✅ Found project: ${folder.name}`);
          }
        } catch (error) {
          // Skip folders we can't access
          console.warn(`⚠️ Could not access folder ${folder.name}:`, error);
        }
      }

      console.log(`✅ Found ${projectFolders.length} project folders`);
      return projectFolders;
    } catch (error) {
      console.error('❌ Error listing project folders:', error);
      console.error('Error details:', error);
      throw error;
    }
  }

  // Load project data from a specific folder
  async loadProjectFromFolder(folderId: string): Promise<any> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with Google Drive');
    }

    const files = await this.listFiles(folderId);
    const dataFile = files.find((f) => f.name.endsWith('_data.json'));

    if (!dataFile) {
      throw new Error('Project data file not found in folder');
    }

    const content = await this.getFile(dataFile.id);
    return JSON.parse(content);
  }

  // Save project data to a specific folder
  async saveProjectToFolder(folderId: string, projectData: any): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with Google Drive');
    }

    const files = await this.listFiles(folderId);
    const existingFile = files.find((f) => f.name.endsWith('_data.json'));

    const fileName = existingFile ? existingFile.name : `${projectData.projectName || 'project'}_data.json`;
    
    // Save project metadata without documents (documents are stored separately)
    const projectMetadata = {
      ...projectData,
      documents: [] // Exclude documents from metadata, they're stored as separate files
    };
    const content = JSON.stringify(projectMetadata, null, 2);

    if (existingFile) {
      await this.updateFile(existingFile.id, content);
    } else {
      await this.uploadFile(folderId, fileName, content);
    }
  }

  // Save a document as a separate file in the project folder
  async saveDocumentToFolder(folderId: string, document: any): Promise<string> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with Google Drive');
    }

    if (!document.id) {
      throw new Error('Document must have an ID to save');
    }

    // Create a user-friendly filename: sanitize the title only
    const sanitizedTitle = (document.title || 'Untitled')
      .replace(/[^a-z0-9\s-]/gi, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 50); // Limit length
    const fileName = `${sanitizedTitle}.json`;
    const content = JSON.stringify(document, null, 2);

    console.log(`  📝 Preparing to save document: ${fileName} (title: ${document.title}, ID: ${document.id})`);

    try {
      // Get all files in the folder
      const files = await this.listFiles(folderId);
      
      // Find existing document files (any .json file that's not the metadata file)
      const documentFiles = files.filter((f) => f.name.endsWith('.json') && !f.name.endsWith('_data.json'));
      
      // Try to find the file by checking the document ID stored inside the file
      let existingFile = null;
      for (const file of documentFiles) {
        try {
          const fileContent = await this.getFile(file.id);
          const fileDoc = JSON.parse(fileContent);
          if (fileDoc.id === document.id) {
            existingFile = file;
            break;
          }
        } catch (error) {
          // Skip files that can't be parsed
          continue;
        }
      }

      if (existingFile) {
        // Update existing file
        console.log(`  ✏️ Updating existing document file: ${existingFile.name} (Drive file ID: ${existingFile.id})`);
        await this.updateFile(existingFile.id, content);
        
        // If the name changed, rename the file
        if (existingFile.name !== fileName) {
          console.log(`  🔄 Renaming file from ${existingFile.name} to ${fileName}`);
          // Use Drive API to update metadata
          await gapi.client.drive.files.update({
            fileId: existingFile.id,
            resource: { name: fileName }
          });
        }
        
        return existingFile.id;
      } else {
        // Check if filename already exists
        const fileWithSameName = files.find((f) => f.name === fileName);
        if (fileWithSameName) {
          // If there's a collision, add a number suffix
          let counter = 1;
          let newFileName = fileName;
          while (files.find((f) => f.name === newFileName)) {
            const nameWithoutExt = sanitizedTitle;
            newFileName = `${nameWithoutExt}_${counter}.json`;
            counter++;
          }
          console.log(`  ⚠️ Filename collision, using: ${newFileName}`);
          const fileId = await this.uploadFile(folderId, newFileName, content);
          console.log(`  ✅ Created document file with Drive ID: ${fileId}`);
          return fileId;
        } else {
          console.log(`  ➕ Creating new document file: ${fileName}`);
          const fileId = await this.uploadFile(folderId, fileName, content);
          console.log(`  ✅ Created document file with Drive ID: ${fileId}`);
          return fileId;
        }
      }
    } catch (error) {
      console.error(`  ❌ Error saving document ${fileName}:`, error);
      throw error;
    }
  }

  // Delete a document file from the project folder
  async deleteDocumentFromFolder(folderId: string, documentId: string): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with Google Drive');
    }

    const fileName = `doc_${documentId}.json`;
    const files = await this.listFiles(folderId);
    const documentFile = files.find((f) => f.name === fileName);

    if (documentFile) {
      await gapi.client.drive.files.delete({
        fileId: documentFile.id,
      });
    }
  }

  // Load all documents from a project folder
  async loadDocumentsFromFolder(folderId: string): Promise<any[]> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with Google Drive');
    }

    const files = await this.listFiles(folderId);
    // Documents now have format: {Title}_{ID}.json
    const documentFiles = files.filter((f) => f.name.endsWith('.json') && !f.name.endsWith('_data.json'));

    const documents = [];
    for (const file of documentFiles) {
      try {
        const content = await this.getFile(file.id);
        const document = JSON.parse(content);
        documents.push(document);
      } catch (error) {
        console.error(`Error loading document ${file.name}:`, error);
      }
    }

    return documents;
  }

  // Delete an entire project folder
  async deleteProjectFolder(folderId: string): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with Google Drive');
    }

    try {
      // Delete all files in the folder first
      const files = await this.listFiles(folderId);
      for (const file of files) {
        try {
          await gapi.client.drive.files.delete({ fileId: file.id });
        } catch (error) {
          console.error(`Error deleting file ${file.name}:`, error);
        }
      }

      // Delete the folder itself
      await gapi.client.drive.files.delete({ fileId: folderId });
      console.log('✅ Project folder deleted');
    } catch (error) {
      console.error('Error deleting project folder:', error);
      throw error;
    }
  }
}

export const googleDriveService = GoogleDriveService.getInstance();

