import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { storageService, Document } from '../../services/storageService';
import { googleAuth } from '../../services/googleAuth';
import { Download, FileText, Database, Calendar, HardDrive, Trash2, FolderOpen, Cloud, ExternalLink } from 'lucide-react';

const ProjectFiles: React.FC = () => {
  const [forceUpdate, setForceUpdate] = useState(0);
  const { loadDocument, openWindow } = useAppStore();
  const fileInfo = storageService.getFileInfo();
  const data = storageService.getData();
  
  // Get storage location from Google Drive
  const isGoogleDriveConnected = googleAuth.isAuthenticated();

  const refresh = () => {
    setForceUpdate(prev => prev + 1);
  };

  const handleOpenDocument = async (doc: Document) => {
    // Open document editor window if not already open
    openWindow('document', 'Document Editor');
    // Wait a bit for window to open, then load the document
    setTimeout(async () => {
      await loadDocument(doc.id!);
    }, 100);
  };

  const handleDownload = (filename: string, content: string, mimeType: string = 'application/json') => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllData = () => {
    const json = storageService.exportData();
    handleDownload('storyboard-project-data.json', json);
  };

  const handleDownloadDocument = (docId: string) => {
    const doc = data.documents.find(d => d.id === docId);
    if (doc) {
      // Download as HTML with the content
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${doc.title}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
    h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
    .metadata { color: #666; font-size: 0.9em; margin-bottom: 30px; }
  </style>
</head>
<body>
  <h1>${doc.title}</h1>
  <div class="metadata">
    <p><strong>Type:</strong> ${doc.type}</p>
    <p><strong>Created:</strong> ${new Date(doc.createdAt).toLocaleString()}</p>
    <p><strong>Modified:</strong> ${new Date(doc.updatedAt).toLocaleString()}</p>
  </div>
  <div>${doc.content}</div>
</body>
</html>
      `.trim();
      handleDownload(`${doc.title.replace(/[^a-z0-9]/gi, '_')}.html`, htmlContent, 'text/html');
    }
  };

  const handleDeleteDocument = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await storageService.deleteDocument(docId);
        refresh();
      } catch (error) {
        console.error('Error deleting document:', error);
        alert('Failed to delete document. Please try again.');
      }
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="h-full bg-white dark:bg-gray-800 p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Project Files
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage and download your project files
            </p>
          </div>
          <button
            onClick={handleDownloadAllData}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download All Data</span>
          </button>
        </div>

        {/* Project Overview */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 mb-8 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <HardDrive className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {data.projectName}
              </h3>
              
              {/* Storage Location Indicator */}
              {isGoogleDriveConnected && (
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <Cloud className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Storage: Google Drive</span>
                  </div>
                  <button
                    onClick={() => {
                      const folderId = localStorage.getItem('current_project_folder_id');
                      if (folderId) {
                        window.open(`https://drive.google.com/drive/folders/${folderId}`, '_blank');
                      }
                    }}
                    className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    title="Open project folder in Google Drive"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open in Drive</span>
                  </button>
                </div>
              )}
              
              {!isGoogleDriveConnected && (
                <div className="mb-3 flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <HardDrive className="w-4 h-4 text-gray-500" />
                  <span>Storage: Local Browser</span>
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-600 dark:text-gray-400">Characters</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {data.characters.length}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 dark:text-gray-400">Locations</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {data.locations.length}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 dark:text-gray-400">Documents</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {data.documents.length}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 dark:text-gray-400">Chapters</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {data.chapters.length}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>Last modified: {formatDate(data.lastModified)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Files List */}
        <div className="space-y-4">
          {/* Project Data File */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4 flex-1">
                <div className="flex-shrink-0">
                  <Database className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    Project Database
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Complete project data including characters, locations, chapters, and all metadata
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <span className="font-medium">Size:</span>
                      <span>{formatBytes(JSON.stringify(data).length)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="font-medium">Items:</span>
                      <span>{fileInfo[0].count} entries</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(fileInfo[0].lastModified)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={handleDownloadAllData}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex-shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Documents ({data.documents.length})
            </h3>
            {data.documents.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 italic">No documents yet</p>
            ) : (
              <div className="space-y-3">
                {data.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                            {doc.title}
                          </h4>
                          <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                            <span className="capitalize">{doc.type}</span>
                            <span>•</span>
                            <span>{formatBytes(doc.content.length)}</span>
                            <span>•</span>
                            <Calendar className="w-3 h-3 inline" />
                            <span>{formatDate(doc.updatedAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <button
                          onClick={() => handleOpenDocument(doc)}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                          title="Open document"
                        >
                          <FolderOpen className="w-4 h-4" />
                          <span className="text-sm">Open</span>
                        </button>
                        <button
                          onClick={() => handleDownloadDocument(doc.id!)}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                          title="Download document"
                        >
                          <Download className="w-4 h-4" />
                          <span className="text-sm">Download</span>
                        </button>
                        <button
                          onClick={(e) => handleDeleteDocument(doc.id!, e)}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                          title="Delete document"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="text-sm">Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectFiles;
