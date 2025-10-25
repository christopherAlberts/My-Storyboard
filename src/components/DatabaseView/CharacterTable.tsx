import React, { useState } from 'react';
import { Character } from '../../database/schema';
import { Edit, Trash2, Plus, Save, X } from 'lucide-react';

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

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {characters.length === 0 ? (
          <div className="text-center py-12">
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Age
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {characters.map((character) => (
                  <tr key={character.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-4 whitespace-nowrap">
                      {editingId === character.id ? (
                        <input
                          type="text"
                          value={editData.name || ''}
                          onChange={(e) => handleChange('name', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      ) : (
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {character.name}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {editingId === character.id ? (
                        <select
                          value={editData.role || character.role}
                          onChange={(e) => handleChange('role', e.target.value)}
                          className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                          <option value="protagonist">Protagonist</option>
                          <option value="antagonist">Antagonist</option>
                          <option value="supporting">Supporting</option>
                          <option value="minor">Minor</option>
                        </select>
                      ) : (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(character.role)}`}>
                          {character.role}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {editingId === character.id ? (
                        <textarea
                          value={editData.description || ''}
                          onChange={(e) => handleChange('description', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          rows={2}
                        />
                      ) : (
                        <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                          {character.description || 'No description'}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {editingId === character.id ? (
                        <input
                          type="number"
                          value={editData.age || ''}
                          onChange={(e) => handleChange('age', parseInt(e.target.value) || undefined)}
                          className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      ) : (
                        <div className="text-sm text-gray-900 dark:text-white">
                          {character.age || 'Unknown'}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      {editingId === character.id ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={handleSave}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancel}
                            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(character)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDelete('character', character.id!)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CharacterTable;
