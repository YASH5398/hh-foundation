import React, { useState } from 'react';
import { forceReceiverAssignment } from '../../services/adminService';
import './ForceReceiverAssignment.css';

const ForceReceiverAssignment = () => {
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userId.trim()) {
      setMessage('Please enter a valid User ID');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');
    
    try {
      const result = await forceReceiverAssignment(userId.trim());
      
      if (result.success) {
        setMessage(result.message);
        setMessageType('success');
        setUserId(''); // Clear the input on success
        console.log('Force Receiver Assignment successful:', result.userData);
      } else {
        setMessage(result.message);
        setMessageType('error');
        console.error('Force Receiver Assignment failed:', result.message);
      }
    } catch (error) {
      setMessage('An unexpected error occurred. Please try again.');
      setMessageType('error');
      console.error('Force Receiver Assignment error:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearMessage = () => {
    setMessage('');
    setMessageType('');
  };

  return (
    <div className="force-receiver-assignment">
      <div className="page-header">
        <h1>Force Receiver Assignment</h1>
        <p>Make a user eligible to receive help by updating their status</p>
      </div>
      
      <div className="assignment-form-container">
        <form onSubmit={handleSubmit} className="assignment-form">
          <div className="form-group">
            <label htmlFor="userId">User ID</label>
            <input
              type="text"
              id="userId"
              value={userId}
              onChange={(e) => {
                setUserId(e.target.value);
                if (message) clearMessage();
              }}
              placeholder="Enter User ID"
              disabled={loading}
              className="form-input"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading || !userId.trim()}
            className={`submit-btn ${loading ? 'loading' : ''}`}
          >
            {loading ? 'Processing...' : 'Make Eligible'}
          </button>
        </form>
        
        {message && (
          <div className={`message ${messageType}`}>
            <span>{message}</span>
            <button onClick={clearMessage} className="close-btn">×</button>
          </div>
        )}
        
        <div className="info-section">
          <h3>What this action does:</h3>
          <ul>
            <li>Sets <code>isActivated</code> to <strong>true</strong></li>
            <li>Sets <code>isOnHold</code> to <strong>false</strong></li>
            <li>Sets <code>isReceivingHeld</code> to <strong>false</strong></li>
            <li>Sets <code>helpVisibility</code> to <strong>true</strong></li>
            <li>Sets <code>kycDetails.levelStatus</code> to <strong>"active"</strong></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ForceReceiverAssignment;