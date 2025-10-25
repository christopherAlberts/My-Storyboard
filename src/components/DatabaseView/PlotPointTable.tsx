import React, { useState } from 'react';
import { PlotPoint, Character, Location, Chapter } from '../../database/schema';
import { Edit, Trash2, Plus, Save, X } from 'lucide-react';

interface PlotPointTableProps {
  plotPoints: PlotPoint[];
  characters: Character[];
  locations: Location[];
  chapters: Chapter[];
  onUpdate: (type: string, id: number, updates: any) => void;
  onDelete: (type: string, id: number) => void;
  onAdd: () => void;
}

const PlotPointTable: React.FC<PlotPointTableProps> = ({
  plotPoints,
  characters,
  locations,
  chapters,
  onUpdate,
  onDelete,
  onAdd,
}) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<PlotPoint>>({});

  const handleEdit = (plotPoint: PlotPoint) => {
    setEditingId(plotPoint.id!);
    setEditData(plotPoint);
  };

  const handleSave = () => {
    if (editingId && editData) {
      onUpdate('plot_point', editingId, editData);
      setEditingId(null);
      setEditData({});
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleChange = (field: keyof PlotPoint, value: any) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const getTypeColor = (type: PlotPoint['type']) => {
    switch (type) {
      case 'inciting_incident':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      case 'rising_action':
        return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200';
      case 'climax':
        return 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200';
      case 'falling_action':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      case 'resolution':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'plot_twist':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'character_development':
        return 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200';
      case 'world_building':
        return 'bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  const getImportanceColor = (importance: PlotPoint['importance']) => {
    switch (importance) {
      case 'critical':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      case 'high':
        return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  const getCharacterNames = (characterIds: number[]) => {
    return characterIds
      .map(id => characters.find(c => c.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  const getLocationNames = (locationIds: number[]) => {
    return locationIds
      .map(id => locations.find(l => l.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Plot Points</h3>
        <button
          onClick={onAdd}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Plot Point</span>
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {plotPoints.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400 mb-4">
              No plot points yet. Create your first plot point to get started.
            </div>
            <button
              onClick={onAdd}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Add Plot Point
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Importance
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Characters
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Locations
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {plotPoints.map((plotPoint) => (
                  <tr key={plotPoint.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-4 whitespace-nowrap">
                      {editingId === plotPoint.id ? (
                        <input
                          type="text"
                          value={editData.title || ''}
                          onChange={(e) => handleChange('title', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      ) : (
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {plotPoint.title}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {editingId === plotPoint.id ? (
                        <select
                          value={editData.type || plotPoint.type}
                          onChange={(e) => handleChange('type', e.target.value)}
                          className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                          <option value="inciting_incident">Inciting Incident</option>
                          <option value="rising_action">Rising Action</option>
                          <option value="climax">Climax</option>
                          <option value="falling_action">Falling Action</option>
                          <option value="resolution">Resolution</option>
                          <option value="plot_twist">Plot Twist</option>
                          <option value="character_development">Character Development</option>
                          <option value="world_building">World Building</option>
                        </select>
                      ) : (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(plotPoint.type)}`}>
                          {plotPoint.type.replace('_', ' ')}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {editingId === plotPoint.id ? (
                        <select
                          value={editData.importance || plotPoint.importance}
                          onChange={(e) => handleChange('importance', e.target.value)}
                          className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      ) : (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getImportanceColor(plotPoint.importance)}`}>
                          {plotPoint.importance}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                        {getCharacterNames(plotPoint.characterIds) || 'None'}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                        {getLocationNames(plotPoint.locationIds) || 'None'}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {editingId === plotPoint.id ? (
                        <input
                          type="number"
                          value={editData.order || plotPoint.order}
                          onChange={(e) => handleChange('order', parseInt(e.target.value))}
                          className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      ) : (
                        <div className="text-sm text-gray-900 dark:text-white">
                          {plotPoint.order}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      {editingId === plotPoint.id ? (
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
                            onClick={() => handleEdit(plotPoint)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDelete('plot_point', plotPoint.id!)}
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

export default PlotPointTable;
