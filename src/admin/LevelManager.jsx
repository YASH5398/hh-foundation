import { useEffect, useState } from 'react';
import { FaEdit } from 'react-icons/fa';
import { getLevels, updateLevel } from '../services/levelService';
import Table from '../components/ui/Table';
import InputField from '../components/ui/InputField';
import { showToast } from '../components/ui/Toast';

function LevelManager() {
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [levelsPerPage] = useState(10); // Number of levels per page
  const [totalLevels, setTotalLevels] = useState(0);
  const [editingLevel, setEditingLevel] = useState(null);
  const [newLevelName, setNewLevelName] = useState('');

  useEffect(() => {
    setLoading(true);
    const unsubscribe = getLevels((data) => {
      setLevels(data);
      setTotalLevels(data.length);
      setLoading(false);
      showToast('Levels fetched successfully!', 'success');
    });

    return () => unsubscribe();
  }, []);

  const handleEditClick = (level) => {
    setEditingLevel(level.id);
    setNewLevelName(level.name);
  };

  const handleSaveLevel = async (id) => {
    setLoading(true);
    try {
      await updateLevel(id, { name: newLevelName });
      setLevels(levels.map(level => level.id === id ? { ...level, name: newLevelName } : level));
      setEditingLevel(null);
      setNewLevelName('');
      showToast('Level updated successfully!', 'success');
    } catch (err) {
      setError('Failed to update level.');
      showToast('Failed to update level.', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(totalLevels / levelsPerPage); i++) {
    pageNumbers.push(i);
  }

  const handleCancelEdit = () => {
    setEditingLevel(null);
    setNewLevelName('');
  };

  if (loading) {
    return <div className="text-center py-8">Loading levels...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Level Management</h1>

      <Table
        headers={['Level Name', 'Actions']}
        data={levels}
        renderRow={(level) => (
          <tr key={level.id}>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {editingLevel === level.id ? (
                <InputField
                  type="text"
                  value={newLevelName}
                  onChange={(e) => setNewLevelName(e.target.value)}
                />
              ) : (
                level.name
              )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
              {editingLevel === level.id ? (
                <>
                  <button
                    onClick={() => handleSaveLevel(level.id)}
                    className="text-green-600 hover:text-green-900 mr-3"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleEditClick(level)}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  <FaEdit className="inline-block mr-1" />Edit
                </button>
              )}
            </td>
          </tr>
        )}
        emptyMessage="No levels found."
      />

      <nav className="mt-4">
        <ul className="flex justify-center">
          {pageNumbers.map(number => (
            <li key={number} className="mx-1">
              <button
                onClick={() => paginate(number)}
                className={`px-3 py-1 rounded-md ${currentPage === number ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
              >
                {number}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export default LevelManager;