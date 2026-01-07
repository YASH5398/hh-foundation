import React, { useEffect, useState } from 'react';
import { Edit, Save, X, RefreshCw, Loader2, AlertTriangle, CheckCircle, TrendingUp, Users, Crown, Star, Award, Diamond } from 'lucide-react';
import { getLevels, updateLevel } from '../services/levelService';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

function LevelManager() {
  const { user } = useAuth();
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingLevel, setEditingLevel] = useState(null);
  const [newLevelName, setNewLevelName] = useState('');
  const [actionLoading, setActionLoading] = useState({});

  // Level icons mapping
  const getLevelIcon = (levelName) => {
    const lowerName = levelName.toLowerCase();
    if (lowerName.includes('star')) return <Star className="w-5 h-5 text-yellow-400" />;
    if (lowerName.includes('silver')) return <Award className="w-5 h-5 text-gray-300" />;
    if (lowerName.includes('gold')) return <Award className="w-5 h-5 text-yellow-500" />;
    if (lowerName.includes('platinum')) return <Crown className="w-5 h-5 text-purple-400" />;
    if (lowerName.includes('diamond')) return <Diamond className="w-5 h-5 text-blue-400" />;
    return <TrendingUp className="w-5 h-5 text-slate-400" />;
  };

  const getLevelColor = (levelName) => {
    const lowerName = levelName.toLowerCase();
    if (lowerName.includes('star')) return 'from-yellow-400 to-yellow-600';
    if (lowerName.includes('silver')) return 'from-gray-300 to-gray-500';
    if (lowerName.includes('gold')) return 'from-yellow-400 to-yellow-600';
    if (lowerName.includes('platinum')) return 'from-purple-400 to-purple-600';
    if (lowerName.includes('diamond')) return 'from-blue-400 to-blue-600';
    return 'from-slate-400 to-slate-600';
  };

  useEffect(() => {
    let unsubscribe;

    try {
      setLoading(true);
      setError(null);

      unsubscribe = getLevels((data) => {
        setLevels(data || []);
        setLoading(false);
      });
    } catch (err) {
      console.error('Error setting up levels listener:', err);
      setError('Failed to load levels');
      setLoading(false);
      toast.error('Failed to load levels');
    }

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const handleEditClick = (level) => {
    setEditingLevel(level.id);
    setNewLevelName(level.name || '');
  };

  const handleSaveLevel = async (id) => {
    if (!newLevelName.trim()) {
      toast.error('Level name cannot be empty');
      return;
    }

    setActionLoading(prev => ({ ...prev, [id]: true }));
    try {
      const result = await updateLevel(id, { name: newLevelName.trim() }, user);
      if (result.success) {
        setLevels(levels.map(level =>
          level.id === id ? { ...level, name: newLevelName.trim() } : level
        ));
        setEditingLevel(null);
        setNewLevelName('');
        toast.success('Level updated successfully');
      } else {
        toast.error(result.message || 'Failed to update level');
      }
    } catch (err) {
      console.error('Error updating level:', err);
      toast.error('Failed to update level');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleCancelEdit = () => {
    setEditingLevel(null);
    setNewLevelName('');
  };

  const refreshLevels = () => {
    setLoading(true);
    setError(null);
    // The useEffect will automatically refresh the data
    setTimeout(() => setLoading(false), 1000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-400" />
          <p className="text-slate-300 text-lg">Loading levels...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-2xl font-bold text-white mb-2">Error Loading Levels</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <button
            onClick={refreshLevels}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold flex items-center gap-4 text-white mb-2">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl shadow-lg">
              <TrendingUp className="text-white w-7 h-7" />
            </div>
            <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Level Management
            </span>
          </h1>
          <p className="text-slate-400 text-lg">Manage and configure system levels and their properties</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl group-hover:from-blue-500/30 group-hover:to-blue-600/30 transition-all duration-300">
                <TrendingUp className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-3xl font-bold text-white">{levels.length}</span>
            </div>
            <h3 className="text-slate-400 text-sm font-medium">Total Levels</h3>
            <p className="text-slate-500 text-xs mt-1">System levels configured</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl group-hover:from-green-500/30 group-hover:to-green-600/30 transition-all duration-300">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <span className="text-3xl font-bold text-white">
                {levels.filter(level => level.name && level.name.trim()).length}
              </span>
            </div>
            <h3 className="text-slate-400 text-sm font-medium">Active Levels</h3>
            <p className="text-slate-500 text-xs mt-1">Properly configured</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-xl group-hover:from-yellow-500/30 group-hover:to-yellow-600/30 transition-all duration-300">
                <Edit className="w-6 h-6 text-yellow-400" />
              </div>
              <span className="text-3xl font-bold text-white">
                {editingLevel ? 1 : 0}
              </span>
            </div>
            <h3 className="text-slate-400 text-sm font-medium">Editing</h3>
            <p className="text-slate-500 text-xs mt-1">Currently being edited</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl group-hover:from-purple-500/30 group-hover:to-purple-600/30 transition-all duration-300">
                <RefreshCw className="w-6 h-6 text-purple-400" />
              </div>
              <button
                onClick={refreshLevels}
                className="text-2xl font-bold text-white hover:text-purple-400 transition-colors"
              >
                ↻
              </button>
            </div>
            <h3 className="text-slate-400 text-sm font-medium">Refresh</h3>
            <p className="text-slate-500 text-xs mt-1">Reload level data</p>
          </div>
        </div>

        {/* Levels List */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-xl border border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-xl font-semibold text-white flex items-center gap-3">
              <Crown className="w-6 h-6 text-yellow-400" />
              System Levels
            </h2>
            <p className="text-slate-400 text-sm mt-1">Configure level names and properties</p>
          </div>

          <div className="divide-y divide-slate-700/50">
            {levels.length === 0 ? (
              <div className="text-center py-16">
                <Crown className="w-16 h-16 mx-auto mb-4 text-slate-500" />
                <h3 className="text-xl font-semibold text-white mb-2">No Levels Found</h3>
                <p className="text-slate-400">No levels have been configured in the system yet.</p>
              </div>
            ) : (
              levels.map((level, index) => (
                <div key={level.id} className="p-6 hover:bg-slate-800/30 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`p-3 rounded-xl bg-gradient-to-r ${getLevelColor(level.name || `Level ${index + 1}`)}`}>
                        {getLevelIcon(level.name || `Level ${index + 1}`)}
                      </div>
                      <div className="flex-1">
                        {editingLevel === level.id ? (
                          <div className="flex items-center gap-3">
                            <input
                              type="text"
                              value={newLevelName}
                              onChange={(e) => setNewLevelName(e.target.value)}
                              className="flex-1 px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                              placeholder="Enter level name"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') handleSaveLevel(level.id);
                                if (e.key === 'Escape') handleCancelEdit();
                              }}
                            />
                          </div>
                        ) : (
                          <div>
                            <h3 className="text-lg font-semibold text-white">
                              {level.name || `Level ${index + 1}`}
                            </h3>
                            <p className="text-slate-400 text-sm">Level ID: {level.id.slice(0, 8)}...</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {editingLevel === level.id ? (
                        <>
                          <button
                            onClick={() => handleSaveLevel(level.id)}
                            disabled={actionLoading[level.id] || !newLevelName.trim()}
                            className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-slate-600 disabled:to-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {actionLoading[level.id] ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="flex items-center gap-2 px-4 py-2 border border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg text-sm font-medium transition-all duration-200"
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleEditClick(level)}
                          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-lg"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Additional level info */}
                  <div className="mt-4 pt-4 border-t border-slate-700/50">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div className="text-slate-400">
                        <span className="font-medium text-slate-300">Created:</span>{' '}
                        {level.createdAt ? new Date(level.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown'}
                      </div>
                      <div className="text-slate-400">
                        <span className="font-medium text-slate-300">Updated:</span>{' '}
                        {level.updatedAt ? new Date(level.updatedAt.seconds * 1000).toLocaleDateString() : 'Never'}
                      </div>
                      <div className="text-slate-400">
                        <span className="font-medium text-slate-300">Status:</span>{' '}
                        <span className="text-green-400">Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            Level Management Guidelines
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-300">
            <div>
              <h4 className="font-medium text-white mb-2">⚠️ Important Notes</h4>
              <ul className="space-y-1 text-slate-400">
                <li>• Level names should be descriptive and unique</li>
                <li>• Changes affect all users in the system</li>
                <li>• Level order determines progression path</li>
                <li>• Some levels may have special requirements</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">🔧 Best Practices</h4>
              <ul className="space-y-1 text-slate-400">
                <li>• Use clear, professional level names</li>
                <li>• Test changes in a development environment first</li>
                <li>• Document any special level configurations</li>
                <li>• Regularly review and update level structures</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LevelManager;