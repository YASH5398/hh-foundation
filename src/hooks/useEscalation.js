import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { agentService } from '../services/agentService';
import { toast } from 'react-hot-toast';

/**
 * Custom hook for managing escalation requests
 * @returns {Object} Escalation state and methods
 */
export const useEscalation = () => {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [escalationHistory, setEscalationHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  /**
   * Fetch escalation history for the current agent
   * @param {number} limit - Maximum number of requests to fetch
   */
  const fetchEscalationHistory = useCallback(async (limit = 10) => {
    if (!user?.uid) return;

    setLoadingHistory(true);

    try {
      const history = await agentService.getEscalationHistory(user.uid, limit);
      setEscalationHistory(history);
    } catch (error) {
      console.error('Error fetching escalation history:', error);
      toast.error('Failed to fetch escalation history');
    } finally {
      setLoadingHistory(false);
    }
  }, [user?.uid]);

  /**
   * Fetch pending escalation requests count for the current agent
   */
  const fetchPendingRequestsCount = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const pendingRequests = await agentService.getEscalationHistory(user.uid, 100);
      const pendingCount = pendingRequests.filter(req => req.status === 'pending').length;
      setPendingRequestsCount(pendingCount);
    } catch (error) {
      console.error('Error fetching pending requests count:', error);
    }
  }, [user?.uid]);

  /**
   * Submit escalation request to admin
   * @param {Object} escalationData - The escalation request data
   * @param {string} escalationData.userId - The UID of the user
   * @param {string} escalationData.userEmail - The email of the user
   * @param {string} escalationData.issue - Description of the issue
   * @returns {Promise<boolean>} Success status
   */
  const submitEscalation = useCallback(async (escalationData) => {
    if (!user?.uid) {
      toast.error('You must be logged in to submit escalation requests');
      return false;
    }

    setSubmitting(true);

    try {
      // Validate input data
      const { userId, userEmail, issue } = escalationData;
      
      if (!userId?.trim()) {
        toast.error('User ID is required');
        return false;
      }
      
      if (!userEmail?.trim()) {
        toast.error('User email is required');
        return false;
      }
      
      if (!issue?.trim()) {
        toast.error('Issue description is required');
        return false;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userEmail)) {
        toast.error('Please enter a valid email address');
        return false;
      }

      // Submit escalation request
      const requestData = {
        agentId: user.uid,
        userId: userId.trim(),
        userEmail: userEmail.trim(),
        issue: issue.trim()
      };

      const documentId = await agentService.createEscalationRequest(requestData);
      
      if (documentId) {
        toast.success('Escalation request submitted successfully!');
        
        // Refresh escalation history and pending count
        await fetchEscalationHistory();
        await fetchPendingRequestsCount();
        
        return true;
      } else {
        toast.error('Failed to submit escalation request');
        return false;
      }
    } catch (error) {
      console.error('Error submitting escalation:', error);
      toast.error(error.message || 'Failed to submit escalation request');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [user?.uid, fetchEscalationHistory, fetchPendingRequestsCount]);

  /**
   * Clear escalation history from state
   */
  const clearHistory = () => {
    setEscalationHistory([]);
    setPendingRequestsCount(0);
  };

  /**
   * Get formatted escalation data for display
   * @param {Object} escalation - Raw escalation data
   * @returns {Object} Formatted escalation data
   */
  const formatEscalation = (escalation) => {
    return {
      ...escalation,
      createdAtFormatted: escalation.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown',
      updatedAtFormatted: escalation.updatedAt?.toDate?.()?.toLocaleDateString() || 'Unknown',
      statusBadgeColor: getStatusBadgeColor(escalation.status)
    };
  };

  /**
   * Get badge color for escalation status
   * @param {string} status - Escalation status
   * @returns {string} Tailwind CSS color classes
   */
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return {
    submitting,
    escalationHistory,
    loadingHistory,
    pendingRequestsCount,
    submitEscalation,
    fetchEscalationHistory,
    fetchPendingRequestsCount,
    clearHistory,
    formatEscalation,
    getStatusBadgeColor
  };
};

export default useEscalation;