import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { FiUser, FiMail, FiPhone, FiMapPin, FiCreditCard, FiDollarSign, FiCalendar, FiEdit3, FiSave, FiX, FiEye, FiMessageSquare, FiAlertTriangle, FiCheck, FiClock, FiArrowLeft } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { getProfileImageUrl, PROFILE_IMAGE_CLASSES } from '../../utils/profileUtils';

const UserProfileView = ({ userId, onClose }) => {
  const { user: currentAgent } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [sendHelpHistory, setSendHelpHistory] = useState([]);
  const [receiveHelpHistory, setReceiveHelpHistory] = useState([]);
  const [agentNotes, setAgentNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);

  useEffect(() => {
    if (!userId) return;
    
    fetchUserProfile();
    setupRealTimeListeners();
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        setUserProfile({ id: userDoc.id, ...userDoc.data() });
      } else {
        toast.error('User not found');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const setupRealTimeListeners = () => {
    // Listen to sendHelp records
    const sendHelpQuery = query(
      collection(db, 'sendHelp'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeSendHelp = onSnapshot(sendHelpQuery, (snapshot) => {
      const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSendHelpHistory(records);
    });

    // Listen to receiveHelp records
    const receiveHelpQuery = query(
      collection(db, 'receiveHelp'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeReceiveHelp = onSnapshot(receiveHelpQuery, (snapshot) => {
      const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReceiveHelpHistory(records);
    });

    // Listen to agent notes
    const notesQuery = query(
      collection(db, 'agentNotes'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeNotes = onSnapshot(notesQuery, (snapshot) => {
      const notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAgentNotes(notes);
    });

    return () => {
      unsubscribeSendHelp();
      unsubscribeReceiveHelp();
      unsubscribeNotes();
    };
  };

  const addAgentNote = async () => {
    if (!newNote.trim()) return;
    
    setAddingNote(true);
    try {
      await addDoc(collection(db, 'agentNotes'), {
        userId,
        agentId: currentAgent.uid,
        agentName: currentAgent.displayName || currentAgent.email,
        note: newNote.trim(),
        createdAt: serverTimestamp(),
        type: 'internal'
      });
      
      setNewNote('');
      setShowNoteForm(false);
      toast.success('Note added successfully');
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    } finally {
      setAddingNote(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-orange-600 bg-orange-100';
      case 'failed':
      case 'rejected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method?.toLowerCase()) {
      case 'upi':
        return '📱';
      case 'bank':
        return '🏦';
      case 'wallet':
        return '💳';
      default:
        return '💰';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user profile...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 text-center">
          <FiAlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">User profile not found</p>
          <button 
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
      <div className="min-h-screen px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="max-w-6xl mx-auto bg-white rounded-lg shadow-xl"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                  <img 
                    src={getProfileImageUrl(userProfile)} 
                    alt={userProfile.fullName}
                    className={`${PROFILE_IMAGE_CLASSES.medium}`}
                    onError={(e) => {
                      e.target.src = getProfileImageUrl(null); // Fallback to default
                    }}
                  />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{userProfile.fullName}</h2>
                  <p className="text-sm text-gray-600">{userProfile.email}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                userProfile.isActivated ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
              }`}>
                {userProfile.isActivated ? 'Activated' : 'Not Activated'}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium text-blue-600 bg-blue-100">
                Level {userProfile.levelStatus || 1}
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6 border-b border-gray-200">
            <nav className="flex space-x-8">
              {[
                { id: 'profile', label: 'Profile Info', icon: FiUser },
                { id: 'sendHelp', label: 'Send Help History', icon: FiDollarSign },
                { id: 'receiveHelp', label: 'Receive Help History', icon: FiCreditCard },
                { id: 'notes', label: 'Agent Notes', icon: FiMessageSquare }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  {/* Personal Information */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <FiUser className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Full Name</p>
                          <p className="font-medium">{userProfile.fullName || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <FiMail className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-medium">{userProfile.email || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <FiPhone className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Phone</p>
                          <p className="font-medium">{userProfile.phone || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <FiPhone className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">WhatsApp</p>
                          <p className="font-medium">{userProfile.whatsapp || userProfile.phone || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <FiCalendar className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Joined</p>
                          <p className="font-medium">{formatDate(userProfile.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Account Information */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <FiCreditCard className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Level Status</p>
                          <p className="font-medium">Level {userProfile.levelStatus || 1}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <FiDollarSign className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Total Earnings</p>
                          <p className="font-medium">₹{(userProfile.totalEarnings || 0).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <FiUser className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Referral Count</p>
                          <p className="font-medium">{userProfile.referralCount || 0}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <FiCheck className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Activation Status</p>
                          <p className={`font-medium ${
                            userProfile.isActivated ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {userProfile.isActivated ? 'Activated' : 'Not Activated'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bank & UPI Information */}
                  <div className="bg-gray-50 rounded-lg p-6 md:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Bank Details</h4>
                        <div className="space-y-2 text-sm">
                          <p><span className="text-gray-600">Account Holder:</span> {userProfile.bank?.accountHolderName || 'N/A'}</p>
                          <p><span className="text-gray-600">Account Number:</span> {userProfile.bank?.accountNumber || 'N/A'}</p>
                          <p><span className="text-gray-600">IFSC Code:</span> {userProfile.bank?.ifscCode || 'N/A'}</p>
                          <p><span className="text-gray-600">Bank Name:</span> {userProfile.bank?.bankName || 'N/A'}</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">UPI Details</h4>
                        <div className="space-y-2 text-sm">
                          <p><span className="text-gray-600">UPI ID:</span> {userProfile.upi?.upiId || 'N/A'}</p>
                          <p><span className="text-gray-600">UPI Name:</span> {userProfile.upi?.upiName || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'sendHelp' && (
                <motion.div
                  key="sendHelp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Send Help History</h3>
                  {sendHelpHistory.length > 0 ? (
                    <div className="space-y-4">
                      {sendHelpHistory.map((record) => (
                        <div key={record.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{getPaymentMethodIcon(record.paymentMethod)}</span>
                              <span className="font-medium">₹{(record.amount || 0).toLocaleString()}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                                {record.status || 'Unknown'}
                              </span>
                            </div>
                            <span className="text-sm text-gray-500">{formatDate(record.createdAt)}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            <p><span className="font-medium">UTR:</span> {record.utr || 'N/A'}</p>
                            <p><span className="font-medium">Payment Method:</span> {record.paymentMethod || 'N/A'}</p>
                            {record.receiverId && <p><span className="font-medium">Receiver ID:</span> {record.receiverId}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FiDollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No send help records found</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'receiveHelp' && (
                <motion.div
                  key="receiveHelp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Receive Help History</h3>
                  {receiveHelpHistory.length > 0 ? (
                    <div className="space-y-4">
                      {receiveHelpHistory.map((record) => (
                        <div key={record.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{getPaymentMethodIcon(record.paymentMethod)}</span>
                              <span className="font-medium">₹{(record.amount || 0).toLocaleString()}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                                {record.status || 'Unknown'}
                              </span>
                            </div>
                            <span className="text-sm text-gray-500">{formatDate(record.createdAt)}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            <p><span className="font-medium">UTR:</span> {record.utr || 'N/A'}</p>
                            <p><span className="font-medium">Payment Method:</span> {record.paymentMethod || 'N/A'}</p>
                            {record.senderId && <p><span className="font-medium">Sender ID:</span> {record.senderId}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FiCreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No receive help records found</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'notes' && (
                <motion.div
                  key="notes"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Agent Notes</h3>
                    <button
                      onClick={() => setShowNoteForm(true)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                    >
                      <FiEdit3 className="h-4 w-4" />
                      <span>Add Note</span>
                    </button>
                  </div>

                  {showNoteForm && (
                    <div className="bg-blue-50 rounded-lg p-4 mb-6">
                      <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Add a private note about this user..."
                        className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                      />
                      <div className="flex items-center justify-end space-x-2 mt-3">
                        <button
                          onClick={() => {
                            setShowNoteForm(false);
                            setNewNote('');
                          }}
                          className="px-3 py-1 text-gray-600 hover:text-gray-800"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={addAgentNote}
                          disabled={!newNote.trim() || addingNote}
                          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                          {addingNote ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <FiSave className="h-4 w-4" />
                          )}
                          <span>{addingNote ? 'Saving...' : 'Save Note'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {agentNotes.length > 0 ? (
                    <div className="space-y-4">
                      {agentNotes.map((note) => (
                        <div key={note.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <FiMessageSquare className="h-4 w-4 text-gray-400" />
                              <span className="font-medium text-sm">{note.agentName}</span>
                            </div>
                            <span className="text-xs text-gray-500">{formatDate(note.createdAt)}</span>
                          </div>
                          <p className="text-gray-700">{note.note}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FiMessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No agent notes found</p>
                      <p className="text-sm text-gray-400 mt-1">Add the first note to track important information about this user</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default UserProfileView;