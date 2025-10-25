import React, { useState } from 'react';
import { Chapter, PlotPoint } from '../../database/schema';
import { Edit, Trash2, Plus, Save, X, BookOpen, Settings, Minus } from 'lucide-react';

interface ChapterTableProps {
  chapters: Chapter[];
  plotPoints: PlotPoint[];
  onUpdate: (type: string, id: number, updates: any) => void;
  onDelete: (type: string, id: number) => void;
  onAdd: () => void;
}

const ChapterTable: React.FC<ChapterTableProps> = ({
  chapters,
  plotPoints,
  onUpdate,
  onDelete,
  onAdd,
}) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<Chapter>>({});
  const [activeTab, setActiveTab] = useState<'basic' | 'details' | 'custom'>('basic');
  const [newCustomFieldName, setNewCustomFieldName] = useState('');
  const [newCustomFieldValue, setNewCustomFieldValue] = useState('');

  const handleEdit = (chapter: Chapter) => {
    setEditingId(chapter.id!);
    setEditData(chapter);
  };

  const handleSave = () => {
    if (editingId && editData) {
      onUpdate('chapter', editingId, editData);
      setEditingId(null);
      setEditData({});
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleChange = (field: keyof Chapter, value: any) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleCustomFieldChange = (fieldName: string, value: any) => {
    setEditData(prev => ({
      ...prev,
      customFields: {
        ...prev.customFields,
        [fieldName]: value
      }
    }));
  };

  const handleAddCustomField = () => {
    if (newCustomFieldName.trim()) {
      handleCustomFieldChange(newCustomFieldName.trim(), newCustomFieldValue);
      setNewCustomFieldName('');
      setNewCustomFieldValue('');
    }
  };

  const handleRemoveCustomField = (fieldName: string) => {
    const customFields = { ...editData.customFields };
    delete customFields[fieldName];
    setEditData(prev => ({ ...prev, customFields }));
  };

  const getStatusColor = (status: Chapter['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
      case 'in_progress':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'completed':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'archived':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  const getPlotPointNames = (plotPointIds: number[]) => {
    return plotPointIds
      .map(id => plotPoints.find(p => p.id === id)?.title)
      .filter(Boolean)
      .join(', ');
  };

  const renderBasicInfo = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Title
          </label>
          <input
            type="text"
            value={editData.title || ''}
            onChange={(e) => handleChange('title', e.target.value)}
            className="form-input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Order
          </label>
          <input
            type="number"
            value={editData.order || 1}
            onChange={(e) => handleChange('order', parseInt(e.target.value))}
            className="form-input"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status
          </label>
          <select
            value={editData.status || 'draft'}
            onChange={(e) => handleChange('status', e.target.value as Chapter['status'])}
            className="form-input"
          >
            <option value="draft">Draft</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Word Count
          </label>
          <input
            type="number"
            value={editData.wordCount || 0}
            onChange={(e) => handleChange('wordCount', parseInt(e.target.value) || 0)}
            className="form-input"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <textarea
          value={editData.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          className="form-input"
          rows={4}
        />
      </div>
    </div>
  );

  const renderDetailedInfo = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            POV Character ID
          </label>
          <input
            type="number"
            value={editData.povCharacter || 0}
            onChange={(e) => handleChange('povCharacter', parseInt(e.target.value) || 0)}
            className="form-input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Main Location ID
          </label>
          <input
            type="number"
            value={editData.mainLocation || 0}
            onChange={(e) => handleChange('mainLocation', parseInt(e.target.value) || 0)}
            className="form-input"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Mood
          </label>
          <input
            type="text"
            value={editData.mood || ''}
            onChange={(e) => handleChange('mood', e.target.value)}
            className="form-input"
            placeholder="e.g., tense, hopeful, mysterious"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Pacing
          </label>
          <select
            value={editData.pacing || 'medium'}
            onChange={(e) => handleChange('pacing', e.target.value as Chapter['pacing'])}
            className="form-input"
          >
            <option value="slow">Slow</option>
            <option value="medium">Medium</option>
            <option value="fast">Fast</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Conflict
        </label>
        <textarea
          value={editData.conflict || ''}
          onChange={(e) => handleChange('conflict', e.target.value)}
          className="form-input"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Resolution
        </label>
        <textarea
          value={editData.resolution || ''}
          onChange={(e) => handleChange('resolution', e.target.value)}
          className="form-input"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Themes (comma-separated)
        </label>
        <input
          type="text"
          value={Array.isArray(editData.themes) ? editData.themes.join(', ') : ''}
          onChange={(e) => {
            const themes = e.target.value.split(',').map(item => item.trim()).filter(item => item);
            handleChange('themes', themes);
          }}
          className="form-input"
          placeholder="e.g., love, betrayal, redemption"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Notes
        </label>
        <textarea
          value={editData.notes || ''}
          onChange={(e) => handleChange('notes', e.target.value)}
          className="form-input"
          rows={3}
        />
      </div>
    </div>
  );

  const renderCustomFields = () => (
    <div className="space-y-4">
      {/* Add new custom field */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Add Custom Field</h4>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            value={newCustomFieldName}
            onChange={(e) => setNewCustomFieldName(e.target.value)}
            placeholder="Field name"
            className="form-input"
          />
          <input
            type="text"
            value={newCustomFieldValue}
            onChange={(e) => setNewCustomFieldValue(e.target.value)}
            placeholder="Field value"
            className="form-input"
          />
        </div>
        <button
          onClick={handleAddCustomField}
          className="mt-3 flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Field</span>
        </button>
      </div>

      {/* Existing custom fields */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Custom Fields</h4>
        {Object.keys(editData.customFields || {}).length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">No custom fields added yet</p>
        ) : (
          Object.entries(editData.customFields || {}).map(([fieldName, fieldValue]) => (
            <div key={fieldName} className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {fieldName}
                </label>
                <input
                  type="text"
                  value={fieldValue || ''}
                  onChange={(e) => handleCustomFieldChange(fieldName, e.target.value)}
                  className="form-input"
                />
              </div>
              <button
                onClick={() => handleRemoveCustomField(fieldName)}
                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Chapters</h3>
        <button
          onClick={onAdd}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Chapter</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {chapters.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <div className="text-gray-500 dark:text-gray-400 mb-4">
              No chapters yet. Create your first chapter to get started.
            </div>
            <button
              onClick={onAdd}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Add Chapter
            </button>
          </div>
        ) : (
          <div className="h-full flex">
            {/* Chapter List */}
            <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 overflow-auto">
              <div className="p-4 space-y-3">
                {chapters
                  .sort((a, b) => a.order - b.order)
                  .map((chapter) => (
                  <div
                    key={chapter.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      editingId === chapter.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => handleEdit(chapter)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {chapter.title}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(chapter.status)}`}>
                        {chapter.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {chapter.description || 'No description'}
                    </p>
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Order: {chapter.order} | Words: {chapter.wordCount || 0} | Plot Points: {chapter.plotPointIds.length}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chapter Details */}
            <div className="flex-1 flex flex-col">
              {editingId ? (
                <>
                  {/* Tabs */}
                  <div className="flex border-b border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => setActiveTab('basic')}
                      className={`px-4 py-3 text-sm font-medium transition-colors ${
                        activeTab === 'basic'
                          ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      <BookOpen className="w-4 h-4 inline mr-2" />
                      Basic Info
                    </button>
                    <button
                      onClick={() => setActiveTab('details')}
                      className={`px-4 py-3 text-sm font-medium transition-colors ${
                        activeTab === 'details'
                          ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      <Settings className="w-4 h-4 inline mr-2" />
                      Details
                    </button>
                    <button
                      onClick={() => setActiveTab('custom')}
                      className={`px-4 py-3 text-sm font-medium transition-colors ${
                        activeTab === 'custom'
                          ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      <Settings className="w-4 h-4 inline mr-2" />
                      Custom Fields
                    </button>
                  </div>

                  {/* Tab Content */}
                  <div className="flex-1 overflow-auto p-6">
                    {activeTab === 'basic' && renderBasicInfo()}
                    {activeTab === 'details' && renderDetailedInfo()}
                    {activeTab === 'custom' && renderCustomFields()}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => onDelete('chapter', editingId!)}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Chapter</span>
                    </button>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={handleCancel}
                        className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <BookOpen className="w-12 h-12 mx-auto mb-4" />
                    <p>Select a chapter to view and edit details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChapterTable;
