import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { storageService, Document } from '../../services/storageService';
import DocumentList from './DocumentList';
import CustomEditor from './CustomEditor';
import { FileText, FolderOpen, Save } from 'lucide-react';

const DocumentEditor: React.FC = () => {
  const { documentState, updateDocumentState, loadDocument, createNewDocument } = useAppStore();
  const [showDocumentList, setShowDocumentList] = useState(false);

  // Don't auto-create a document - user must manually create or open one

  const handleDocumentSelect = async (document: Document) => {
    await loadDocument(document.id!);
    setShowDocumentList(false);
  };

  const handleNewDocument = () => {
    createNewDocument();
    setShowDocumentList(false);
  };

  const saveDocument = async () => {
    try {
      console.log('💾 Saving document...', { 
        hasId: !!documentState.id, 
        title: documentState.title 
      });
      
      if (documentState.id) {
        // Update existing document
        console.log('📝 Updating existing document:', documentState.id);
        await storageService.updateDocument(documentState.id as any, {
          title: documentState.title,
          content: documentState.content,
        });
      } else {
        // Create new document
        console.log('➕ Creating new document');
        const doc: Omit<Document, 'id' | 'createdAt' | 'updatedAt'> = {
          title: documentState.title,
          content: documentState.content,
          type: 'story',
        };
        const id = await storageService.addDocument(doc);
        console.log('✅ Document created with ID:', id);
        updateDocumentState({ id: id as any });
      }
      
      // Force immediate save to Google Drive
      console.log('📤 Force-saving to Google Drive...');
      await forceSaveToGoogleDrive();
      
      updateDocumentState({
        isDirty: false,
        lastSaved: new Date(),
      });
      
      console.log('✅ Document saved successfully');
    } catch (error) {
      console.error('❌ Error saving document:', error);
    }
  };

  const forceSaveToGoogleDrive = async () => {
    try {
      const folderId = localStorage.getItem('current_project_folder_id');
      const isAuthenticated = localStorage.getItem('google_authenticated') === 'true';
      
      if (folderId && isAuthenticated && folderId !== 'placeholder') {
        const { googleDriveService } = await import('../../services/googleDriveService');
        await googleDriveService.initialize();
        
        const projectData = storageService.getData();
        
        // Save project metadata
        console.log('💾 Saving project metadata...');
        await googleDriveService.saveProjectToFolder(folderId, projectData);
        console.log('✅ Project metadata saved');
        
        // Save only the current document (not all documents)
        if (documentState.id) {
          const currentDoc = projectData.documents.find(d => d.id === documentState.id);
          if (currentDoc) {
            console.log('💾 Saving current document...');
            await googleDriveService.saveDocumentToFolder(folderId, currentDoc);
            console.log('✅ Current document saved');
          }
        }
        
        console.log('✅ Force-saved to Google Drive');
      }
    } catch (error) {
      console.error('❌ Force-save failed:', error);
    }
  };

  const handleContentChange = (content: string) => {
    updateDocumentState({
      content,
      isDirty: true,
    });
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateDocumentState({
      title: e.target.value,
      isDirty: true,
    });
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Document Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowDocumentList(true)}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <FolderOpen className="w-4 h-4" />
            <span>Open</span>
          </button>
          <button
            onClick={handleNewDocument}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>New</span>
          </button>
        </div>
        <div className="flex items-center space-x-3">
          <input
            type="text"
            value={documentState.title || ''}
            onChange={handleTitleChange}
            className="text-lg font-semibold bg-transparent border-none outline-none text-gray-900 dark:text-white"
            placeholder="Document Title"
          />
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              saveDocument();
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded transition-colors ${
              documentState.isDirty
                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>{documentState.isDirty ? 'Unsaved' : 'Saved'}</span>
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!documentState.title ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Document Open
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Open an existing document or create a new one to start writing
              </p>
              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={() => setShowDocumentList(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Open Document
                </button>
                <button
                  onClick={handleNewDocument}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  New Document
                </button>
              </div>
            </div>
          </div>
        ) : (
          <CustomEditor
            content={documentState.content || ''}
            onChange={handleContentChange}
            showTableOfContents={false}
            onToggleTableOfContents={undefined}
          />
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between p-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
        <div>
          {documentState.lastSaved && (
            <span>Last saved: {new Date(documentState.lastSaved).toLocaleTimeString()}</span>
          )}
        </div>
        <div>
          Word count: {(documentState.content || '').replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length}
        </div>
      </div>

      {/* Document List Modal */}
      {showDocumentList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl h-3/4">
            <DocumentList
              onDocumentSelect={handleDocumentSelect}
              onNewDocument={handleNewDocument}
              onClose={() => setShowDocumentList(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentEditor;
