import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { db, Document } from '../../database/schema';
import { FileText, Plus, Edit, Trash2, Calendar, Upload, File } from 'lucide-react';

interface DocumentListProps {
  onDocumentSelect: (document: Document) => void;
  onNewDocument: () => void;
  onClose: () => void;
}

const DocumentList: React.FC<DocumentListProps> = ({
  onDocumentSelect,
  onNewDocument,
  onClose,
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const docs = await db.documents.orderBy('updatedAt').reverse().toArray();
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await db.documents.delete(id);
        await loadDocuments();
      } catch (error) {
        console.error('Error deleting document:', error);
      }
    }
  };

  const handleFileImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const content = await readFileContent(file);
      const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
      
      const doc: Omit<Document, 'id' | 'createdAt' | 'updatedAt'> = {
        title: fileName,
        content: content,
        type: 'story',
      };

      const id = await db.documents.add(doc);
      await loadDocuments();
      
      // Auto-select the imported document
      const importedDoc = await db.documents.get(id);
      if (importedDoc) {
        onDocumentSelect(importedDoc);
      }
    } catch (error) {
      console.error('Error importing file:', error);
      alert('Error importing file. Please try again.');
    } finally {
      setImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      // Handle different file types
      const extension = file.name.split('.').pop()?.toLowerCase();
      
      switch (extension) {
        case 'txt':
        case 'md':
        case 'markdown':
          reader.readAsText(file);
          break;
        case 'html':
        case 'htm':
          reader.readAsText(file);
          break;
        case 'json':
          reader.readAsText(file);
          break;
        default:
          // For unsupported files, try to read as text
          reader.readAsText(file);
          break;
      }
    });
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getDocumentTypeColor = (type: Document['type']) => {
    switch (type) {
      case 'story':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      case 'outline':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'notes':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'research':
        return 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-500 dark:text-gray-400">Loading documents...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Documents
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleFileImport}
            disabled={importing}
            className="flex items-center space-x-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-4 h-4" />
            <span>{importing ? 'Importing...' : 'Import'}</span>
          </button>
          <button
            onClick={onNewDocument}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ×
          </button>
        </div>
      </div>

      {/* Document List */}
      <div className="flex-1 overflow-auto p-4">
        {documents.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No documents yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Create your first document to get started with writing.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleFileImport}
                disabled={importing}
                className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-4 h-4" />
                <span>{importing ? 'Importing...' : 'Import File'}</span>
              </button>
              <button
                onClick={onNewDocument}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Create Document
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => onDocumentSelect(doc)}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {doc.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDocumentTypeColor(doc.type)}`}>
                        {doc.type}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>Updated {formatDate(doc.updatedAt)}</span>
                      </div>
                      <div>
                        {doc.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length} words
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleDeleteDocument(doc.id!, e)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.markdown,.html,.htm,.json"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default DocumentList;
