import React, { useState } from 'react';
import { Location } from '../../database/schema';
import { Edit, Trash2, Plus, Save, X, MapPin, Settings, Minus } from 'lucide-react';

interface LocationTableProps {
  locations: Location[];
  onUpdate: (type: string, id: number, updates: any) => void;
  onDelete: (type: string, id: number) => void;
  onAdd: () => void;
}

const LocationTable: React.FC<LocationTableProps> = ({
  locations,
  onUpdate,
  onDelete,
  onAdd,
}) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<Location>>({});
  const [activeTab, setActiveTab] = useState<'basic' | 'details' | 'custom'>('basic');
  const [newCustomFieldName, setNewCustomFieldName] = useState('');
  const [newCustomFieldValue, setNewCustomFieldValue] = useState('');

  const handleEdit = (location: Location) => {
    setEditingId(location.id!);
    setEditData(location);
  };

  const handleSave = () => {
    if (editingId && editData) {
      onUpdate('location', editingId, editData);
      setEditingId(null);
      setEditData({});
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleChange = (field: keyof Location, value: any) => {
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

  const getTypeColor = (type: Location['type']) => {
    switch (type) {
      case 'indoor':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      case 'outdoor':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'urban':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
      case 'rural':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'fantasy':
        return 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200';
      case 'sci-fi':
        return 'bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  const renderBasicInfo = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Name
          </label>
          <input
            type="text"
            value={editData.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            className="form-input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Type
          </label>
          <select
            value={editData.type || 'indoor'}
            onChange={(e) => handleChange('type', e.target.value as Location['type'])}
            className="form-input"
          >
            <option value="indoor">Indoor</option>
            <option value="outdoor">Outdoor</option>
            <option value="urban">Urban</option>
            <option value="rural">Rural</option>
            <option value="fantasy">Fantasy</option>
            <option value="sci-fi">Sci-Fi</option>
          </select>
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
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Atmosphere
        </label>
        <textarea
          value={editData.atmosphere || ''}
          onChange={(e) => handleChange('atmosphere', e.target.value)}
          className="form-input"
          rows={2}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Significance
        </label>
        <textarea
          value={editData.significance || ''}
          onChange={(e) => handleChange('significance', e.target.value)}
          className="form-input"
          rows={2}
        />
      </div>
    </div>
  );

  const renderDetailedInfo = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Climate
          </label>
          <input
            type="text"
            value={editData.climate || ''}
            onChange={(e) => handleChange('climate', e.target.value)}
            className="form-input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Population
          </label>
          <input
            type="text"
            value={editData.population || ''}
            onChange={(e) => handleChange('population', e.target.value)}
            className="form-input"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          History
        </label>
        <textarea
          value={editData.history || ''}
          onChange={(e) => handleChange('history', e.target.value)}
          className="form-input"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Culture
        </label>
        <textarea
          value={editData.culture || ''}
          onChange={(e) => handleChange('culture', e.target.value)}
          className="form-input"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Economy
        </label>
        <textarea
          value={editData.economy || ''}
          onChange={(e) => handleChange('economy', e.target.value)}
          className="form-input"
          rows={2}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Politics
        </label>
        <textarea
          value={editData.politics || ''}
          onChange={(e) => handleChange('politics', e.target.value)}
          className="form-input"
          rows={2}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Dangers
        </label>
        <textarea
          value={editData.dangers || ''}
          onChange={(e) => handleChange('dangers', e.target.value)}
          className="form-input"
          rows={2}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Resources
        </label>
        <textarea
          value={editData.resources || ''}
          onChange={(e) => handleChange('resources', e.target.value)}
          className="form-input"
          rows={2}
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
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Locations</h3>
        <button
          onClick={onAdd}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Location</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {locations.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <div className="text-gray-500 dark:text-gray-400 mb-4">
              No locations yet. Create your first location to get started.
            </div>
            <button
              onClick={onAdd}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Add Location
            </button>
          </div>
        ) : (
          <div className="h-full flex">
            {/* Location List */}
            <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 overflow-auto">
              <div className="p-4 space-y-3">
                {locations.map((location) => (
                  <div
                    key={location.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      editingId === location.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => handleEdit(location)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {location.name}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(location.type)}`}>
                        {location.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {location.description || 'No description'}
                    </p>
                    {location.atmosphere && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        Atmosphere: {location.atmosphere}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Location Details */}
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
                      <MapPin className="w-4 h-4 inline mr-2" />
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
                      onClick={() => onDelete('location', editingId!)}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Location</span>
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
                    <MapPin className="w-12 h-12 mx-auto mb-4" />
                    <p>Select a location to view and edit details</p>
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

export default LocationTable;
