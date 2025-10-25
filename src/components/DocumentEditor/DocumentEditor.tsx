import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useAppStore } from '../../store/useAppStore';
import { db, Document } from '../../database/schema';

const DocumentEditor: React.FC = () => {
  const { documentState, updateDocumentState } = useAppStore();
  const [quill, setQuill] = useState<ReactQuill | null>(null);

  useEffect(() => {
    // Load document content when component mounts
    loadDocument();
  }, []);

  const loadDocument = async () => {
    try {
      const documents = await db.documents.toArray();
      if (documents.length > 0) {
        const latestDoc = documents[documents.length - 1];
        updateDocumentState({
          content: latestDoc.content,
          title: latestDoc.title,
          isDirty: false,
          lastSaved: latestDoc.updatedAt,
        });
      }
    } catch (error) {
      console.error('Error loading document:', error);
    }
  };

  const saveDocument = async () => {
    try {
      const doc: Omit<Document, 'id' | 'createdAt' | 'updatedAt'> = {
        title: documentState.title,
        content: documentState.content,
        type: 'story',
      };

      await db.documents.add(doc);
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

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ],
  };

  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'color', 'background', 'list', 'bullet', 'indent',
    'align', 'link', 'image'
  ];

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Document Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <input
          type="text"
          value={documentState.title}
          onChange={handleTitleChange}
          className="text-lg font-semibold bg-transparent border-none outline-none text-gray-900 dark:text-white"
          placeholder="Document Title"
        />
        <div className="flex items-center space-x-2">
          {documentState.isDirty && (
            <span className="text-sm text-orange-500">Unsaved changes</span>
          )}
          <button
            onClick={saveDocument}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Save
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <ReactQuill
          ref={setQuill}
          theme="snow"
          value={documentState.content}
          onChange={handleContentChange}
          modules={modules}
          formats={formats}
          style={{ height: '100%' }}
          className="h-full"
        />
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
    </div>
  );
};

export default DocumentEditor;
