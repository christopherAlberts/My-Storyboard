import React, { useState } from 'react';
import { Character } from '../../database/schema';
import { Edit, Trash2, Plus, Save, X, User, Briefcase, Heart, Users, Sword, MessageSquare, BookOpen } from 'lucide-react';

interface CharacterTableProps {
  characters: Character[];
  onUpdate: (type: string, id: number, updates: any) => void;
  onDelete: (type: string, id: number) => void;
  onAdd: () => void;
}

const CharacterTable: React.FC<CharacterTableProps> = ({
  characters,
  onUpdate,
  onDelete,
  onAdd,
}) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<Character>>({});
  const [activeTab, setActiveTab] = useState<'basic' | 'details' | 'relationships' | 'chapters'>('basic');

  const handleEdit = (character: Character) => {
    setEditingId(character.id!);
    setEditData(character);
  };

  const handleSave = () => {
    if (editingId && editData) {
      onUpdate('character', editingId, editData);
      setEditingId(null);
      setEditData({});
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleChange = (field: keyof Character, value: any) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field: keyof Character, value: string) => {
    const arrayValue = value.split(',').map(item => item.trim()).filter(item => item);
    setEditData(prev => ({ ...prev, [field]: arrayValue }));
  };

  const getRoleColor = (role: Character['role']) => {
    switch (role) {
      case 'protagonist':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'antagonist':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      case 'supporting':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      case 'minor':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
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
            Age
          </label>
          <input
            type="number"
            value={editData.age || ''}
            onChange={(e) => handleChange('age', parseInt(e.target.value) || undefined)}
            className="form-input"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Role
        </label>
        <select
          value={editData.role || 'supporting'}
          onChange={(e) => handleChange('role', e.target.value as Character['role'])}
          className="form-input"
        >
          <option value="protagonist">Protagonist</option>
          <option value="antagonist">Antagonist</option>
          <option value="supporting">Supporting</option>
          <option value="minor">Minor</option>
        </select>
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
          Appearance
        </label>
        <textarea
          value={editData.appearance || ''}
          onChange={(e) => handleChange('appearance', e.target.value)}
          className="form-input"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Personality
        </label>
        <textarea
          value={editData.personality || ''}
          onChange={(e) => handleChange('personality', e.target.value)}
          className="form-input"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Background
        </label>
        <textarea
          value={editData.background || ''}
          onChange={(e) => handleChange('background', e.target.value)}
          className="form-input"
          rows={3}
        />
      </div>
    </div>
  );

  const renderDetailedInfo = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Occupation
          </label>
          <input
            type="text"
            value={editData.occupation || ''}
            onChange={(e) => handleChange('occupation', e.target.value)}
            className="form-input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Social Status
          </label>
          <input
            type="text"
            value={editData.socialStatus || ''}
            onChange={(e) => handleChange('socialStatus', e.target.value)}
            className="form-input"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Motivation
        </label>
        <textarea
          value={editData.motivation || ''}
          onChange={(e) => handleChange('motivation', e.target.value)}
          className="form-input"
          rows={2}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Goals
        </label>
        <textarea
          value={editData.goals || ''}
          onChange={(e) => handleChange('goals', e.target.value)}
          className="form-input"
          rows={2}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Fears
        </label>
        <textarea
          value={editData.fears || ''}
          onChange={(e) => handleChange('fears', e.target.value)}
          className="form-input"
          rows={2}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Skills (comma-separated)
        </label>
        <input
          type="text"
          value={Array.isArray(editData.skills) ? editData.skills.join(', ') : ''}
          onChange={(e) => handleArrayChange('skills', e.target.value)}
          className="form-input"
          placeholder="e.g., sword fighting, magic, diplomacy"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Common Phrases (comma-separated)
        </label>
        <input
          type="text"
          value={Array.isArray(editData.commonPhrases) ? editData.commonPhrases.join(', ') : ''}
          onChange={(e) => handleArrayChange('commonPhrases', e.target.value)}
          className="form-input"
          placeholder="e.g., 'By the gods!', 'That's interesting...'"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Character Arc
        </label>
        <textarea
          value={editData.characterArc || ''}
          onChange={(e) => handleChange('characterArc', e.target.value)}
          className="form-input"
          rows={3}
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

  const renderRelationships = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Family Relationships
        </label>
        <textarea
          value={editData.familyRelations || ''}
          onChange={(e) => handleChange('familyRelations', e.target.value)}
          className="form-input"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Romantic Relationships
        </label>
        <textarea
          value={editData.romanticRelations || ''}
          onChange={(e) => handleChange('romanticRelations', e.target.value)}
          className="form-input"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Friendships
        </label>
        <textarea
          value={editData.friendships || ''}
          onChange={(e) => handleChange('friendships', e.target.value)}
          className="form-input"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Enemies
        </label>
        <textarea
          value={editData.enemies || ''}
          onChange={(e) => handleChange('enemies', e.target.value)}
          className="form-input"
          rows={3}
        />
      </div>
    </div>
  );

  const renderChapterInfo = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Chapter Notes
        </label>
        <textarea
          value={editData.chapterNotes || ''}
          onChange={(e) => handleChange('chapterNotes', e.target.value)}
          className="form-input"
          rows={4}
          placeholder="Notes about what happens to this character across chapters..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Chapter Events
        </label>
        <textarea
          value={editData.chapterEvents || ''}
          onChange={(e) => handleChange('chapterEvents', e.target.value)}
          className="form-input"
          rows={4}
          placeholder="Specific events involving this character..."
        />
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Characters</h3>
        <button
          onClick={onAdd}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Character</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {characters.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <div className="text-gray-500 dark:text-gray-400 mb-4">
              No characters yet. Create your first character to get started.
            </div>
            <button
              onClick={onAdd}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Add Character
            </button>
          </div>
        ) : (
          <div className="h-full flex">
            {/* Character List */}
            <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 overflow-auto">
              <div className="p-4 space-y-3">
                {characters.map((character) => (
                  <div
                    key={character.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      editingId === character.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => handleEdit(character)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {character.name}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(character.role)}`}>
                        {character.role}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {character.description || 'No description'}
                    </p>
                    {character.occupation && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {character.occupation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Character Details */}
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
                      <User className="w-4 h-4 inline mr-2" />
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
                      <Briefcase className="w-4 h-4 inline mr-2" />
                      Details
                    </button>
                    <button
                      onClick={() => setActiveTab('relationships')}
                      className={`px-4 py-3 text-sm font-medium transition-colors ${
                        activeTab === 'relationships'
                          ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      <Users className="w-4 h-4 inline mr-2" />
                      Relationships
                    </button>
                    <button
                      onClick={() => setActiveTab('chapters')}
                      className={`px-4 py-3 text-sm font-medium transition-colors ${
                        activeTab === 'chapters'
                          ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      <BookOpen className="w-4 h-4 inline mr-2" />
                      Chapters
                    </button>
                  </div>

                  {/* Tab Content */}
                  <div className="flex-1 overflow-auto p-6">
                    {activeTab === 'basic' && renderBasicInfo()}
                    {activeTab === 'details' && renderDetailedInfo()}
                    {activeTab === 'relationships' && renderRelationships()}
                    {activeTab === 'chapters' && renderChapterInfo()}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 dark:border-gray-700">
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
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <User className="w-12 h-12 mx-auto mb-4" />
                    <p>Select a character to view and edit details</p>
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

export default CharacterTable;