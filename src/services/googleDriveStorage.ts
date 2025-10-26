// Google Drive Storage Service
// Handles actual file storage in Google Drive

declare global {
  interface Window {
    gapi: any;
  }
}

class GoogleDriveStorageService {
  private static instance: GoogleDriveStorageService;
  private accessToken: string | null = null;
  private folderId: string | null = null;

  private constructor() {}

  static getInstance(): GoogleDriveStorageService {
    if (!GoogleDriveStorageService.instance) {
      GoogleDriveStorageService.instance = new GoogleDriveStorageService();
    }
    return GoogleDriveStorageService.instance;
  }

  async initialize(token: string): Promise<void> {
    this.accessToken = token;
    
    // Load gapi
    if (!window.gapi) {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      document.head.appendChild(script);
      
      await new Promise((resolve) => {
        script.onload = () => {
          window.gapi.load('client', resolve);
        };
      });
    }

    await window.gapi.client.init({
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
    });

    // Set the access token
    window.gapi.client.setToken({ access_token: token });
  }

  async createFolder(name: string, parentId?: string): Promise<string> {
    const metadata: any = {
      name,
      mimeType: 'application/vnd.google-apps.folder',
    };

    if (parentId) {
      metadata.parents = [parentId];
    }

    const response = await window.gapi.client.drive.files.create({
      resource: metadata,
      fields: 'id',
    });

    this.folderId = response.result.id;
    localStorage.setItem('project_folder_id', this.folderId);
    
    return this.folderId;
  }

  async uploadFile(fileName: string, content: string, mimeType: string = 'application/json'): Promise<void> {
    if (!this.folderId) {
      throw new Error('No folder selected');
    }

    const file = new Blob([content], { type: mimeType });
    const metadata = {
      name: fileName,
      parents: [this.folderId],
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: form,
      }
    );

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
  }

  async updateFile(fileName: string, content: string): Promise<void> {
    // First find the file
    const files = await this.listFiles();
    const file = files.find(f => f.name === fileName);

    if (file) {
      // Update existing file
      const fileBlob = new Blob([content], { type: 'application/json' });
      
      await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${file.id}?uploadType=media`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: fileBlob,
        }
      );
    } else {
      // Create new file
      await this.uploadFile(fileName, content);
    }
  }

  async listFiles(): Promise<Array<{ id: string; name: string }>> {
    if (!this.folderId) return [];

    const response = await window.gapi.client.drive.files.list({
      q: `'${this.folderId}' in parents and trashed=false`,
      fields: 'files(id, name)',
    });

    return response.result.files || [];
  }

  async downloadFile(fileName: string): Promise<string> {
    const files = await this.listFiles();
    const file = files.find(f => f.name === fileName);

    if (!file) {
      throw new Error('File not found');
    }

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );

    return await response.text();
  }

  setFolderId(folderId: string): void {
    this.folderId = folderId;
    localStorage.setItem('project_folder_id', folderId);
  }

  getFolderId(): string | null {
    return this.folderId || localStorage.getItem('project_folder_id');
  }
}

export const googleDriveStorage = GoogleDriveStorageService.getInstance();

