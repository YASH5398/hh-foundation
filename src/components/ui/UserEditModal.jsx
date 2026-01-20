import React, { useState, useEffect } from 'react';
import { updateUser } from '../../services/userService';
import { showToast } from './Toast';
import PropTypes from 'prop-types';

const UserEditModal = ({ user, isOpen, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    level: '',
    blocked: false,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.fullName || user.name || '',
        email: user.email || '',
        level: user.level || '',
        blocked: user.blocked || false,
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await updateUser(user.id, formData);
      
      if (result.success) {
        showToast(result.message || 'User updated successfully!', 'success');
      onUpdate(); // Trigger a refresh of user list
      onClose();
      } else {
        showToast(result.message || 'Failed to update user.', 'error');
      }
    } catch (error) {
      showToast('Failed to update user.', 'error');
      console.error('Error updating user:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Edit User</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">Name</label>
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">Email</label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              disabled // Email usually not editable
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="level">Level</label>
            <input
              type="text"
              name="level"
              id="level"
              value={formData.level}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="mb-4 flex items-center">
            <input
              type="checkbox"
              name="blocked"
              id="blocked"
              checked={formData.blocked}
              onChange={handleChange}
              className="mr-2 leading-tight"
            />
            <label className="text-sm text-gray-700" htmlFor="blocked">Blocked</label>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

UserEditModal.defaultProps = {
  onUpdate: () => {},
};

UserEditModal.propTypes = {
  user: PropTypes.object,
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  onUpdate: PropTypes.func,
};

export default UserEditModal;