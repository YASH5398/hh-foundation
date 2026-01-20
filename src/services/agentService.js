import { 
  doc, 
  getDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  serverTimestamp,
  updateDoc 
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Agent Service for handling agent-related Firestore operations
 */
class AgentService {
  /**
   * Fetch agent profile data from users collection
   * @param {string} agentId - The UID of the agent
   * @returns {Promise<Object|null>} Agent profile data or null if not found
   */
  async getAgentProfile(agentId) {
    try {
      const agentDocRef = doc(db, 'users', agentId);
      const agentDoc = await getDoc(agentDocRef);
      
      if (agentDoc.exists()) {
        const agentData = agentDoc.data();
        
        // Get total tickets handled count
        const ticketsHandled = await this.getTicketsHandledCount(agentId);
        
        // Get pending agent requests count
        const pendingRequests = await this.getPendingRequestsCount(agentId);
        
        return {
          id: agentDoc.id,
          ...agentData,
          totalTicketsHandled: ticketsHandled,
          pendingRequests: pendingRequests
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching agent profile:', error);
      throw new Error('Failed to fetch agent profile');
    }
  }

  /**
   * Get count of tickets handled by agent
   * @param {string} agentId - The UID of the agent
   * @returns {Promise<number>} Number of tickets handled
   */
  async getTicketsHandledCount(agentId) {
    try {
      // This would depend on your ticket/support system structure
      // For now, returning a placeholder - you can modify based on your actual collection
      const ticketsQuery = query(
        collection(db, 'supportTickets'),
        where('assignedAgent', '==', agentId),
        where('status', '==', 'resolved')
      );
      
      const ticketsSnapshot = await getDocs(ticketsQuery);
      return ticketsSnapshot.size;
    } catch (error) {
      console.error('Error fetching tickets count:', error);
      return 0;
    }
  }

  /**
   * Get count of pending agent requests
   * @param {string} agentId - The UID of the agent
   * @returns {Promise<number>} Number of pending requests
   */
  async getPendingRequestsCount(agentId) {
    try {
      const requestsQuery = query(
        collection(db, 'agentRequests'),
        where('agentId', '==', agentId),
        where('status', '==', 'pending')
      );
      
      const requestsSnapshot = await getDocs(requestsQuery);
      return requestsSnapshot.size;
    } catch (error) {
      console.error('Error fetching pending requests count:', error);
      return 0;
    }
  }

  /**
   * Create a new escalation request to admin
   * @param {Object} escalationData - The escalation request data
   * @param {string} escalationData.agentId - The UID of the agent
   * @param {string} escalationData.userId - The UID of the user
   * @param {string} escalationData.userEmail - The email of the user
   * @param {string} escalationData.issue - Description of the issue
   * @returns {Promise<string>} Document ID of the created request
   */
  async createEscalationRequest(escalationData) {
    try {
      const { agentId, userId, userEmail, issue } = escalationData;
      
      // Validate required fields
      if (!agentId || !userId || !userEmail || !issue) {
        throw new Error('All fields are required for escalation request');
      }
      
      const requestData = {
        agentId,
        userId,
        userEmail,
        issue,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Add document to collection
      const docRef = await addDoc(collection(db, 'agentRequests'), requestData);
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating escalation request:', error);
      throw new Error('Failed to create escalation request');
    }
  }

  /**
   * Get escalation requests history for an agent
   * @param {string} agentId - The UID of the agent
   * @param {number} limit - Maximum number of requests to fetch
   * @returns {Promise<Array>} Array of escalation requests
   */
  async getEscalationHistory(agentId, limit = 10) {
    try {
      const requestsQuery = query(
        collection(db, 'agentRequests'),
        where('agentId', '==', agentId),
        orderBy('createdAt', 'desc'),
        limit(limit)
      );
      
      const requestsSnapshot = await getDocs(requestsQuery);
      const requests = [];
      
      requestsSnapshot.forEach((doc) => {
        requests.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return requests;
    } catch (error) {
      console.error('Error fetching escalation history:', error);
      return [];
    }
  }

  /**
   * Update escalation request status
   * @param {string} requestId - The ID of the request
   * @param {string} status - New status
   * @returns {Promise<void>}
   */
  async updateEscalationStatus(requestId, status) {
    try {
      const requestRef = doc(db, 'agentRequests', requestId);
      await updateDoc(requestRef, {
        status,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating escalation status:', error);
      throw new Error('Failed to update escalation status');
    }
  }
}

// Export singleton instance
export const agentService = new AgentService();
export default agentService;