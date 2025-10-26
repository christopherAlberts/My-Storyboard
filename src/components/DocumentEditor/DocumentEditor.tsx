import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { db, Document } from '../../database/schema';
import DocumentList from './DocumentList';
import CustomEditor from './CustomEditor';
import { FileText, FolderOpen, Save } from 'lucide-react';

const DocumentEditor: React.FC = () => {
  const { documentState, updateDocumentState, loadDocument, createNewDocument } = useAppStore();
  const [showDocumentList, setShowDocumentList] = useState(false);

  useEffect(() => {
    // Initialize with a new document if none exists
    if (!documentState.id) {
      createNewDocument();
    }
  }, []);

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
      if (documentState.id) {
        // Update existing document
        await db.documents.update(documentState.id, {
          title: documentState.title,
          content: documentState.content,
        });
      } else {
        // Create new document
        const doc: Omit<Document, 'id' | 'createdAt' | 'updatedAt'> = {
          title: documentState.title,
          content: documentState.content,
          type: 'story',
        };
        const id = await db.documents.add(doc);
        updateDocumentState({ id: id as number });
      }
      
      updateDocumentState({
        isDirty: false,
        lastSaved: new Date(),
      });
    } catch (error) {
      console.error('Error saving document:', error);
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
            value={documentState.title}
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
        {documentState.content !== undefined && (
          <CustomEditor
            content={documentState.content}
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
            <span>Last saved: {documentState.lastSaved.toLocaleTimeString()}</span>
          )}
        </div>
        <div>
          Word count: {documentState.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length}
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
