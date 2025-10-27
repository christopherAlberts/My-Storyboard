import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { storageService, Document } from '../../services/storageService';
import DocumentList from './DocumentList';
import CustomEditor from './CustomEditor';
import { FileText, FolderOpen, Loader, CheckCircle, AlertCircle } from 'lucide-react';

const DocumentEditor: React.FC = () => {
  const { documentState, updateDocumentState, loadDocument, createNewDocument } = useAppStore();
  const [showDocumentList, setShowDocumentList] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'error'>('saved');
  const [showTableOfContents, setShowTableOfContents] = useState(false);

  // Don't auto-create a document - user must manually create or open one

  const handleDocumentSelect = async (document: Document) => {
    await loadDocument(document.id!);
    setShowDocumentList(false);
  };

  const handleNewDocument = () => {
    createNewDocument();
    setShowDocumentList(false);
  };


  // Subscribe to save status changes
  useEffect(() => {
    const unsubscribe = storageService.onSaveStatusChange((status) => {
      setSaveStatus(status);
    });
    return unsubscribe;
  }, []);

  const handleContentChange = async (content: string) => {
    updateDocumentState({
      content,
      isDirty: true,
    });
    
    // Auto-save: Create document if new, or update if exists
    if (!documentState.id) {
      // Create new document if no ID yet
      if (documentState.title) {
        const doc: Omit<Document, 'id' | 'createdAt' | 'updatedAt'> = {
          title: documentState.title,
          content,
          type: 'story',
        };
        const id = await storageService.addDocument(doc);
        updateDocumentState({ id: id as any, isDirty: false });
      }
    } else {
      // Update existing document
      await storageService.updateDocument(documentState.id as any, {
        content,
      });
    }
  };

  const handleTitleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    updateDocumentState({
      title: newTitle,
      isDirty: true,
    });
    
    // Auto-save title
    if (documentState.id) {
      await storageService.updateDocument(documentState.id as any, {
        title: newTitle,
      });
    } else if (newTitle && documentState.content) {
      // Create new document with title
      const doc: Omit<Document, 'id' | 'createdAt' | 'updatedAt'> = {
        title: newTitle,
        content: documentState.content,
        type: 'story',
      };
      const id = await storageService.addDocument(doc);
      updateDocumentState({ id: id as any, isDirty: false });
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Document Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 relative">
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
        <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center">
          <input
            type="text"
            value={documentState.title || ''}
            onChange={handleTitleChange}
            className="text-lg font-semibold bg-transparent border-none outline-none text-gray-900 dark:text-white text-center"
            placeholder="Document Title"
          />
        </div>
        <div className="w-20">
          {/* Spacer to balance the layout */}
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
            showTableOfContents={showTableOfContents}
            onToggleTableOfContents={() => setShowTableOfContents(prev => !prev)}
          />
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between p-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          {saveStatus === 'saving' && <span>Auto-saving...</span>}
          {saveStatus === 'saved' && <span className="text-green-600 dark:text-green-400">✓ Saved</span>}
          {saveStatus === 'error' && <span className="text-red-600 dark:text-red-400">Save failed</span>}
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
