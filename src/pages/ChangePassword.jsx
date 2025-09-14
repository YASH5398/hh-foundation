import React, { useState } from "react";
import { auth } from "../config/firebase";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { toast } from "react-hot-toast";

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChanging, setIsChanging] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All fields are required.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setIsChanging(true);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error("User not authenticated");
      const cred = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPassword);
      toast.success("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err.message || "Failed to update password.");
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-8 bg-transparent">
      <div className="w-full max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center text-black/90">Change Password</h1>
        <form onSubmit={handleChangePassword} className="flex flex-col gap-4 bg-transparent">
          <div>
            <label className="block text-black/90 font-medium mb-1">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="w-full p-2 rounded-lg bg-white/10 backdrop-blur border border-white/30 text-black/90 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
              placeholder="Current Password"
            />
          </div>
          <div>
            <label className="block text-black/90 font-medium mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full p-2 rounded-lg bg-white/10 backdrop-blur border border-white/30 text-black/90 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
              placeholder="New Password"
            />
          </div>
          <div>
            <label className="block text-black/90 font-medium mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full p-2 rounded-lg bg-white/10 backdrop-blur border border-white/30 text-black/90 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
              placeholder="Confirm New Password"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold shadow hover:from-blue-600 hover:to-indigo-700 transition mt-2"
            disabled={isChanging}
          >
            {isChanging ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword; 