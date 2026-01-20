import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocialTasks } from '../hooks/useProfile';
import { FaInstagram, FaTelegramPlane, FaTwitter, FaCheckCircle, FaExternalLinkAlt, FaSpinner, FaTrophy } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const TASKS = [
  {
    key: 'instagram',
    label: 'Follow Instagram',
    icon: <FaInstagram className="text-white" />,
    url: 'https://www.instagram.com/invites/contact/?utm_source=ig_contact_invite&utm_medium=copy_link&utm_content=x1hgczn',
    gradient: 'from-pink-500 to-purple-600',
    placeholder: 'Enter your Instagram username',
    description: 'Follow our Instagram page and enter your username'
  },
  {
    key: 'telegram',
    label: 'Join Telegram',
    icon: <FaTelegramPlane className="text-white" />,
    url: 'https://t.me/HelpingHandsFoundationPvtLtd',
    gradient: 'from-blue-500 to-cyan-600',
    placeholder: 'Enter your Telegram username',
    description: 'Join our Telegram channel and enter your username'
  },
  {
    key: 'twitter',
    label: 'Follow Twitter',
    icon: <FaTwitter className="text-white" />,
    url: 'https://x.com/hhf_official0?t=x9t8NPW7MA7_NmvM7WxiIw&s=09',
    gradient: 'from-blue-400 to-blue-600',
    placeholder: 'Enter your Twitter/X username',
    description: 'Follow our Twitter/X account and enter your username'
  },
];

export default function Tasks() {
  const { user } = useAuth();
  const [loadingTask, setLoadingTask] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [openedTasks, setOpenedTasks] = useState({});
  const [userInputs, setUserInputs] = useState({});
  const [submittingTask, setSubmittingTask] = useState(null);
  const hasUid = !!user?.uid;
  const { tasks, loading, error, completeTask } = useSocialTasks(hasUid ? user.uid : undefined);
  
  // Dynamically count completed and total tasks
  const taskKeys = TASKS.map(t => t.key);
  const completedCount = taskKeys.filter(key => tasks && tasks[key] === true).length;
  const totalCount = taskKeys.length;
  const progressPercentage = (completedCount / totalCount) * 100;

  const handleOpenLink = (task) => {
    if (!user?.uid) {
      setAuthError('User not authenticated. Please log in again.');
      return;
    }
    setOpenedTasks(prev => ({ ...prev, [task.key]: true }));
    window.open(task.url, '_blank');
  };

  const handleSubmitTask = async (task) => {
    if (!user?.uid) {
      setAuthError('User not authenticated. Please log in again.');
      return;
    }
    
    const username = userInputs[task.key]?.trim();
    if (!username) {
      setAuthError('Please enter your username before submitting.');
      return;
    }
    
    setSubmittingTask(task.key);
    setAuthError(null);
    try {
      await completeTask(task.key, username);
      setOpenedTasks(prev => ({ ...prev, [task.key]: false }));
      setUserInputs(prev => ({ ...prev, [task.key]: '' }));
    } catch (err) {
      setAuthError('Failed to submit task. Please try again.');
    } finally {
      setSubmittingTask(null);
    }
  };

  const handleInputChange = (taskKey, value) => {
    setUserInputs(prev => ({ ...prev, [taskKey]: value }));
  };

  if (!hasUid) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center"
        >
          <FaSpinner className="animate-spin text-3xl text-blue-500 mr-3" />
          <span className="text-lg text-blue-700 font-semibold">Loading user...</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-6 px-4 sm:px-6 lg:px-8" style={{ fontFamily: 'Inter, Poppins, sans-serif' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            🎯 Complete Tasks
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Complete social media tasks to earn points and increase your chances of receiving help faster
          </p>
        </motion.div>

        {/* Task Score Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-6 mb-8 text-center shadow-lg"
        >
          <div className="flex items-center justify-center mb-2">
            <FaTrophy className="text-white text-3xl mr-3" />
            <span className="text-white text-2xl font-bold">Task Score: {tasks?.taskScore || 0}</span>
          </div>
          <p className="text-yellow-100 text-sm">
            Higher scores increase your priority in the help queue
          </p>
        </motion.div>

        {/* Tasks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {TASKS.map((task, index) => {
            const done = tasks && tasks[task.key];
            const isOpened = openedTasks[task.key];
            const isSubmitting = submittingTask === task.key;
            const userInput = userInputs[task.key] || '';
            
            return (
              <motion.div
                key={task.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                  done ? 'ring-2 ring-green-400' : ''
                }`}
              >
                {/* Card Header */}
                <div className={`bg-gradient-to-r ${task.gradient} p-6 text-white relative`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="text-3xl mr-3">{task.icon}</div>
                      <div>
                        <h3 className="text-xl font-bold">{task.label}</h3>
                        <p className="text-sm opacity-90">{task.description}</p>
                      </div>
                    </div>
                    {done && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="bg-green-500 rounded-full p-2"
                      >
                        <FaCheckCircle className="text-white text-xl" />
                      </motion.div>
                    )}
                  </div>
                  
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      done 
                        ? 'bg-green-500 text-white' 
                        : 'bg-white bg-opacity-20 text-white'
                    }`}>
                      {done ? 'Completed' : 'Pending'}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6">
                  {done ? (
                    <div className="text-center">
                      <FaCheckCircle className="text-green-500 text-4xl mx-auto mb-3" />
                      <p className="text-green-700 font-semibold mb-2">Task Completed!</p>
                      {tasks.taskDetails && tasks.taskDetails[task.key] && (
                        <p className="text-sm text-gray-500">
                          Completed: {new Date(tasks.taskDetails[task.key].seconds * 1000).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Open Link Button */}
                      <button
                        onClick={() => handleOpenLink(task)}
                        disabled={loading}
                        className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                          isOpened
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transform hover:scale-105'
                        }`}
                      >
                        <FaExternalLinkAlt className="text-sm" />
                        {isOpened ? 'Link Opened' : 'Open Link'}
                      </button>

                      {/* Input Field (shows after opening link) */}
                      <AnimatePresence>
                        {isOpened && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-3"
                          >
                            <input
                              type="text"
                              placeholder={task.placeholder}
                              value={userInput}
                              onChange={(e) => handleInputChange(task.key, e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                            <button
                              onClick={() => handleSubmitTask(task)}
                              disabled={!userInput.trim() || isSubmitting}
                              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold transition-all hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transform hover:scale-105 disabled:transform-none"
                            >
                              {isSubmitting ? (
                                <FaSpinner className="animate-spin" />
                              ) : (
                                <FaCheckCircle />
                              )}
                              {isSubmitting ? 'Submitting...' : 'Submit Task'}
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Progress Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Your Progress</h3>
            <p className="text-gray-600">Complete all tasks to maximize your benefits</p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span className="text-gray-700">{completedCount} / {totalCount} Tasks Completed</span>
              <span className="text-blue-600">{Math.round(progressPercentage)}%</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-full rounded-full"
              />
            </div>
            
            {completedCount === totalCount && totalCount > 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6 text-center bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200"
              >
                <FaCheckCircle className="text-green-500 text-4xl mx-auto mb-3" />
                <h4 className="text-green-800 font-bold text-xl mb-2">🎉 All Tasks Completed!</h4>
                <p className="text-green-700 text-lg">
                  Congratulations! You're now eligible to receive payments and have increased priority in our help system.
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Error Messages */}
        <AnimatePresence>
          {(error || authError) && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-center"
            >
              {error || authError}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}