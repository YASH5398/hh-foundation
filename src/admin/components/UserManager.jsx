import React, { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { toast } from 'react-hot-toast';

const statusColors = {
  active: 'bg-green-100 text-green-800',
  blocked: 'bg-red-100 text-red-800',
};

const roleColors = {
  admin: 'bg-yellow-100 text-yellow-800',
  user: 'bg-blue-100 text-blue-800',
  agent: 'bg-purple-100 text-purple-800',
};

const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editUser, setEditUser] = useState({});
  const [makeAgentUserId, setMakeAgentUserId] = useState('');
  const [makingAgent, setMakingAgent] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'users'));
      const userList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(userList);
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch =
              (user.fullName || user.name)?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase()) ||
      user.phone?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleBlockToggle = async (user) => {
    try {
      await updateDoc(doc(db, 'users', user.id), {
        status: user.status === 'blocked' ? 'active' : 'blocked',
      });
      toast.success(`User ${user.status === 'blocked' ? 'unblocked' : 'blocked'} successfully!`);
      setUsers(users.map(u => u.id === user.id ? { ...u, status: user.status === 'blocked' ? 'active' : 'blocked' } : u));
    } catch (err) {
      toast.error('Failed to update user status');
    }
  };

  const handleEdit = (user) => {
    setEditUser(user);
    setEditMode(true);
    setShowModal(true);
  };

  const handleView = (user) => {
    setSelectedUser(user);
    setEditMode(false);
    setShowModal(true);
  };

  const handleEditSave = async () => {
    try {
      await updateDoc(doc(db, 'users', editUser.id), {
        name: editUser.fullName || editUser.name,
        phone: editUser.phone,
        role: editUser.role,
      });
      toast.success('User updated successfully!');
      setUsers(users.map(u => u.id === editUser.id ? { ...u, ...editUser } : u));
      setShowModal(false);
    } catch (err) {
      toast.error('Failed to update user');
    }
  };

  // Export to CSV (simple)
  const handleExport = () => {
    const csv = [
      ['Name', 'Email', 'Phone', 'Status', 'Role'],
      ...filteredUsers.map(u => [u.name, u.email, u.phone, u.status, u.role]),
    ].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleMakeAgent = async () => {
    if (!makeAgentUserId.trim()) {
      toast.error('Please enter a valid User ID');
      return;
    }

    setMakingAgent(true);
    try {
      // Find user by userId
      const targetUser = users.find(user => user.userId === makeAgentUserId.trim());
      
      if (!targetUser) {
        toast.error('User not found with the provided User ID');
        setMakingAgent(false);
        return;
      }

      // Update user role to agent
      await updateDoc(doc(db, 'users', targetUser.id), {
        role: 'agent',
        // Ensure all required fields for agent role are set
        status: targetUser.status || 'active',
        updatedAt: new Date().toISOString()
      });

      // Update local state
      setUsers(users.map(u => 
        u.id === targetUser.id 
          ? { ...u, role: 'agent', updatedAt: new Date().toISOString() }
          : u
      ));

      toast.success(`User ${targetUser.fullName || targetUser.name} has been made an agent successfully!`);
      setMakeAgentUserId('');
    } catch (error) {
      console.error('Error making user an agent:', error);
      toast.error('Failed to make user an agent. Please try again.');
    } finally {
      setMakingAgent(false);
    }
  };

  return (
    <div className="p-2 md:p-6">
      {/* Make Agent Section */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Make Agent</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Enter User ID"
            className="border border-gray-300 rounded-md px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={makeAgentUserId}
            onChange={(e) => setMakeAgentUserId(e.target.value)}
            disabled={makingAgent}
          />
          <button
            onClick={handleMakeAgent}
            disabled={makingAgent || !makeAgentUserId.trim()}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md font-medium transition-colors duration-200"
          >
            {makingAgent ? 'Making Agent...' : 'Make Agent'}
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Enter a User ID to promote the user to agent role. This will allow them to access the agent dashboard.
        </p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by name, email, phone..."
          className="border rounded px-3 py-2 w-full md:w-64"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="border rounded px-3 py-2"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>
        <button onClick={handleExport} className="bg-blue-600 text-white px-4 py-2 rounded">Export CSV</button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow text-sm">
          <thead>
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Phone</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8">Loading users...</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8">No users registered yet.</td></tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user.id} className="border-t">
                  <td className="px-4 py-2">{user.fullName || user.name || '-'}</td>
                  <td className="px-4 py-2">{user.email}</td>
                  <td className="px-4 py-2">{user.phone || '-'}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${roleColors[user.role] || 'bg-gray-100 text-gray-800'}`}>{user.role}</span>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[user.status] || 'bg-gray-100 text-gray-800'}`}>{user.status}</span>
                  </td>
                  <td className="px-4 py-2 space-x-2">
                    <button className="text-blue-600 hover:underline" onClick={() => handleView(user)}>View</button>
                    <button className="text-green-600 hover:underline" onClick={() => handleEdit(user)}>Edit</button>
                    <button className="text-red-600 hover:underline" onClick={() => handleBlockToggle(user)}>{user.status === 'blocked' ? 'Unblock' : 'Block'}</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Modal for view/edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow p-6 w-full max-w-md">
            <button className="absolute top-2 right-2 text-gray-500" onClick={() => setShowModal(false)}>&times;</button>
            {editMode ? (
              <div>
                <h2 className="text-lg font-bold mb-2">Edit User</h2>
                <input
                  type="text"
                  className="border p-2 w-full mb-2"
                  value={editUser.fullName || editUser.name}
                  onChange={e => setEditUser({ ...editUser, name: e.target.value })}
                  placeholder="Name"
                />
                <input
                  type="text"
                  className="border p-2 w-full mb-2"
                  value={editUser.phone}
                  onChange={e => setEditUser({ ...editUser, phone: e.target.value })}
                  placeholder="Phone"
                />
                <select
                  className="border p-2 w-full mb-2"
                  value={editUser.role}
                  onChange={e => setEditUser({ ...editUser, role: e.target.value })}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="agent">Agent</option>
                </select>
                <button className="bg-blue-600 text-white px-4 py-2 rounded w-full" onClick={handleEditSave}>Save</button>
              </div>
            ) : (
              <div>
                <h2 className="text-lg font-bold mb-2">User Details</h2>
                <div><b>Name:</b> {selectedUser?.name}</div>
                <div><b>Email:</b> {selectedUser?.email}</div>
                <div><b>Phone:</b> {selectedUser?.phone}</div>
                <div><b>Role:</b> {selectedUser?.role}</div>
                <div><b>Status:</b> {selectedUser?.status}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManager;