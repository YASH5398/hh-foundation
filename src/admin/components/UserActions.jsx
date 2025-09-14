import React, { useState } from "react";
import { db } from "../../firebase";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { toast } from "react-toastify";

export default function UserActions({ user, onClose, onUserUpdated }) {
  const [loading, setLoading] = useState(false);

  const handleBlockToggle = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", user.id), { paymentBlocked: !user.paymentBlocked });
      toast.success(user.paymentBlocked ? "User unblocked" : "User blocked");
      onUserUpdated();
      onClose();
    } catch (err) {
      toast.error("Failed to update block status");
    } finally {
      setLoading(false);
    }
  };

  const handleResetLevel = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", user.id), { level: "Star" });
      toast.success("User level reset to Star");
      onUserUpdated();
      onClose();
    } catch (err) {
      toast.error("Failed to reset level");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, "users", user.id));
      toast.success("User deleted");
      onUserUpdated();
      onClose();
    } catch (err) {
      toast.error("Failed to delete user");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-lg">
        <h2 className="text-xl font-bold mb-4">User Actions</h2>
        <p className="mb-2"><strong>{user.fullName}</strong> ({user.email})</p>
        <div className="space-y-3">
          <button className="w-full bg-yellow-500 text-white py-2 rounded" onClick={handleBlockToggle} disabled={loading}>
            {user.paymentBlocked ? "Unblock User" : "Block User"}
          </button>
          <button className="w-full bg-blue-500 text-white py-2 rounded" onClick={handleResetLevel} disabled={loading}>
            Reset Level to Star
          </button>
          <button className="w-full bg-red-600 text-white py-2 rounded" onClick={handleDelete} disabled={loading}>
            Delete User
          </button>
          <button className="w-full bg-gray-300 text-gray-800 py-2 rounded" onClick={onClose} disabled={loading}>
            Cancel
          </button>
        </div>
        {loading && <div className="mt-4 text-center">Processing...</div>}
      </div>
    </div>
  );
} 