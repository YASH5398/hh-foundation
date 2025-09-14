import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocialTasks } from '../hooks/useProfile';
import { FaInstagram, FaTelegramPlane, FaTwitter, FaCheckCircle, FaExternalLinkAlt, FaSpinner } from 'react-icons/fa';

const TASKS = [
  {
    key: 'instagram',
    label: 'Follow Instagram',
    icon: <FaInstagram className="text-pink-500" />,
    url: 'https://www.instagram.com/invites/contact/?utm_source=ig_contact_invite&utm_medium=copy_link&utm_content=x1hgczn',
  },
  {
    key: 'telegram',
    label: 'Join Telegram',
    icon: <FaTelegramPlane className="text-blue-500" />,
    url: 'https://t.me/HelpingHandsFoundationPvtLtd',
  },
  {
    key: 'twitter',
    label: 'Follow Twitter',
    icon: <FaTwitter className="text-blue-400" />,
    url: 'https://x.com/hhf_official0?t=x9t8NPW7MA7_NmvM7WxiIw&s=09',
  },
];

export default function Tasks() {
  const { user } = useAuth();
  const [loadingTask, setLoadingTask] = useState(null);
  const [authError, setAuthError] = useState(null);
  const hasUid = !!user?.uid;
  const { tasks, loading, error, completeTask } = useSocialTasks(hasUid ? user.uid : undefined);
  // Dynamically count completed and total tasks
  const taskKeys = TASKS.map(t => t.key);
  const completedCount = taskKeys.filter(key => tasks && tasks[key] === true).length;
  const totalCount = taskKeys.length;

  const handleTask = async (task) => {
    if (!user?.uid) {
      setAuthError('User not authenticated. Please log in again.');
      return;
    }
    setLoadingTask(task.key);
    setAuthError(null);
    try {
      await completeTask(task.key);
      window.open(task.url, '_blank');
    } finally {
      setLoadingTask(null);
    }
  };

  if (!hasUid) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <FaSpinner className="animate-spin text-3xl text-blue-500 mr-2" />
        <span className="text-lg text-blue-700 font-semibold">Loading user...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-purple-50 py-10 px-2 flex flex-col items-center" style={{ fontFamily: 'Inter, Poppins, sans-serif' }}>
      <h2 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">🎯 Complete Tasks to Earn</h2>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center">
        <div className="w-full flex flex-col gap-6">
          {TASKS.map((task) => {
            const done = tasks && tasks[task.key];
            const isLoading = loadingTask === task.key;
            return (
              <div key={task.key} className="flex items-center w-full px-4 py-3 rounded-lg border shadow transition-all font-semibold text-lg gap-4 bg-gray-50 border-gray-200">
                <span className="text-2xl">{task.icon}</span>
                <span className="flex-1 text-left">{task.label}</span>
                <button
                  disabled={done || loading || isLoading}
                  onClick={() => handleTask(task)}
                  className={`flex items-center gap-2 px-3 py-1 rounded bg-blue-600 text-white text-sm font-medium transition-all hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 ${done ? 'cursor-not-allowed' : ''}`}
                >
                  {isLoading ? <FaSpinner className="animate-spin" /> : done ? <FaCheckCircle className="text-green-400" /> : <FaExternalLinkAlt className="text-white" />} {isLoading ? 'Loading...' : done ? 'Completed' : 'Open Link'}
                </button>
              </div>
            );
          })}
        </div>
        <div className="w-full mt-8 flex flex-col items-center">
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all" style={{ width: `${(completedCount / totalCount) * 100}%` }} />
          </div>
          <div className="text-gray-700 font-medium">{completedCount} / {totalCount} Tasks Completed</div>
          {completedCount === totalCount && totalCount > 0 && (
            <div className="mt-4 flex flex-col items-center">
              <FaCheckCircle className="text-green-500 text-3xl mb-1" />
              <div className="text-green-700 font-bold text-lg text-center">
                🎉 Congratulations! You’re now eligible to receive payments.<br />
                ✅ Completing more tasks increases your chance of receiving help faster — even without referrals or active status.
              </div>
            </div>
          )}
        </div>
        {error && <div className="text-red-500 mt-4">{error}</div>}
        {authError && <div className="text-red-500 mt-4">{authError}</div>}
      </div>
    </div>
  );
} 