import { db } from '../config/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  doc,
  Timestamp 
} from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import auditService, { AUDIT_EVENTS, AUDIT_SEVERITY } from './auditService';

class RealtimeService {
  constructor() {
    this.listeners = new Map();
    this.subscriptions = new Map();
    this.connectionStatus = 'connected';
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    
    // Monitor connection status
    this.setupConnectionMonitoring();
  }

  /**
   * Setup connection monitoring
   */
  setupConnectionMonitoring() {
    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.connectionStatus = 'connected';
      this.reconnectAttempts = 0;
      this.reconnectAllListeners();
      toast.success('Connection restored');
    });

    window.addEventListener('offline', () => {
      this.connectionStatus = 'disconnected';
      toast.error('Connection lost - working offline');
    });
  }

  /**
   * Generate unique listener ID
   */
  generateListenerId(collection, filters = {}) {
    const filterString = JSON.stringify(filters);
    return `${collection}_${Date.now()}_${btoa(filterString).slice(0, 8)}`;
  }

  /**
   * Subscribe to support tickets with real-time updates
   */
  subscribeToTickets(callback, filters = {}) {
    const listenerId = this.generateListenerId('tickets', filters);

    try {
      // Require at least one filter to prevent unfiltered access
      if (!filters.status && !filters.priority && !filters.assignedTo && !filters.type) {
        throw new Error('subscribeToTickets requires at least one filter (status, priority, assignedTo, or type)');
      }

      let ticketsQuery = collection(db, 'supportTickets');

      // Apply filters
      if (filters.status) {
        ticketsQuery = query(ticketsQuery, where('status', '==', filters.status));
      }
      
      if (filters.priority) {
        ticketsQuery = query(ticketsQuery, where('priority', '==', filters.priority));
      }
      
      if (filters.assignedTo) {
        ticketsQuery = query(ticketsQuery, where('assignedTo', '==', filters.assignedTo));
      }
      
      if (filters.type) {
        ticketsQuery = query(ticketsQuery, where('type', '==', filters.type));
      }
      
      // Order by creation date
      ticketsQuery = query(ticketsQuery, orderBy('createdAt', 'desc'));
      
      if (filters.limit) {
        ticketsQuery = query(ticketsQuery, limit(filters.limit));
      }
      
      const unsubscribe = onSnapshot(ticketsQuery, 
        (snapshot) => {
          const tickets = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Track changes for audit
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              auditService.logEvent(
                AUDIT_EVENTS.TICKET_CREATED,
                { ticketId: change.doc.id },
                null,
                AUDIT_SEVERITY.LOW
              );
            }
          });
          
          callback(tickets);
          this.connectionStatus = 'connected';
          this.reconnectAttempts = 0;
        },
        (error) => {
          console.error('Error in tickets subscription:', error);
          this.handleSubscriptionError(error, listenerId);
          toast.error('Failed to load tickets');
        }
      );
      
      this.listeners.set(listenerId, unsubscribe);
      this.subscriptions.set(listenerId, { type: 'tickets', filters, callback });
      
      return listenerId;
    } catch (error) {
      console.error('Error setting up tickets subscription:', error);
      throw error;
    }
  }

  /**
   * Subscribe to payment verifications
   */
  subscribeToPayments(callback, type = 'sendHelp', filters = {}) {
    const listenerId = this.generateListenerId(`payments_${type}`, filters);

    try {
      // Require at least one filter to prevent unfiltered access
      if (!filters.status && !filters.verifiedBy && !filters.userId) {
        throw new Error('subscribeToPayments requires at least one filter (status, verifiedBy, or userId)');
      }

      let paymentsQuery = collection(db, type);

      // Apply filters
      if (filters.status) {
        paymentsQuery = query(paymentsQuery, where('status', '==', filters.status));
      }
      
      if (filters.verificationStatus) {
        paymentsQuery = query(paymentsQuery, where('verificationStatus', '==', filters.verificationStatus));
      }
      
      if (filters.userId) {
        paymentsQuery = query(paymentsQuery, where('userId', '==', filters.userId));
      }
      
      if (filters.dateFrom) {
        paymentsQuery = query(paymentsQuery, where('createdAt', '>=', Timestamp.fromDate(filters.dateFrom)));
      }
      
      if (filters.dateTo) {
        paymentsQuery = query(paymentsQuery, where('createdAt', '<=', Timestamp.fromDate(filters.dateTo)));
      }
      
      // Order by creation date
      paymentsQuery = query(paymentsQuery, orderBy('createdAt', 'desc'));
      
      if (filters.limit) {
        paymentsQuery = query(paymentsQuery, limit(filters.limit));
      }
      
      const unsubscribe = onSnapshot(paymentsQuery,
        (snapshot) => {
          const payments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Track verification changes for audit
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'modified') {
              const data = change.doc.data();
              if (data.verificationStatus) {
                auditService.logEvent(
                  AUDIT_EVENTS.PAYMENT_STATUS_CHANGED,
                  { 
                    paymentId: change.doc.id, 
                    newStatus: data.verificationStatus,
                    type 
                  },
                  data.verifiedBy,
                  AUDIT_SEVERITY.HIGH
                );
              }
            }
          });
          
          callback(payments);
          this.connectionStatus = 'connected';
          this.reconnectAttempts = 0;
        },
        (error) => {
          console.error(`Error in ${type} payments subscription:`, error);
          this.handleSubscriptionError(error, listenerId);
          toast.error(`Failed to load ${type} payments`);
        }
      );
      
      this.listeners.set(listenerId, unsubscribe);
      this.subscriptions.set(listenerId, { type: `payments_${type}`, filters, callback });
      
      return listenerId;
    } catch (error) {
      console.error(`Error setting up ${type} payments subscription:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to users with real-time updates
   */
  subscribeToUsers(callback, filters = {}) {
    const listenerId = this.generateListenerId('users', filters);

    try {
      // Require at least one filter to prevent unfiltered access
      if (!filters.status && !filters.kycStatus && !filters.urgentLevel) {
        throw new Error('subscribeToUsers requires at least one filter (status, kycStatus, or urgentLevel)');
      }

      let usersQuery = collection(db, 'users');

      // Apply filters
      if (filters.status) {
        usersQuery = query(usersQuery, where('status', '==', filters.status));
      }
      
      if (filters.kycStatus) {
        usersQuery = query(usersQuery, where('kycStatus', '==', filters.kycStatus));
      }
      
      if (filters.urgentLevel) {
        usersQuery = query(usersQuery, where('urgentLevel', '>=', filters.urgentLevel));
      }
      
      // Order by creation date
      usersQuery = query(usersQuery, orderBy('createdAt', 'desc'));
      
      if (filters.limit) {
        usersQuery = query(usersQuery, limit(filters.limit));
      }
      
      const unsubscribe = onSnapshot(usersQuery,
        (snapshot) => {
          const users = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          callback(users);
          this.connectionStatus = 'connected';
          this.reconnectAttempts = 0;
        },
        (error) => {
          console.error('Error in users subscription:', error);
          this.handleSubscriptionError(error, listenerId);
          toast.error('Failed to load users');
        }
      );
      
      this.listeners.set(listenerId, unsubscribe);
      this.subscriptions.set(listenerId, { type: 'users', filters, callback });
      
      return listenerId;
    } catch (error) {
      console.error('Error setting up users subscription:', error);
      throw error;
    }
  }

  /**
   * Subscribe to conversations for communication
   */
  subscribeToConversations(callback, filters = {}) {
    const listenerId = this.generateListenerId('conversations', filters);

    try {
      // Require at least one filter to prevent unfiltered access
      if (!filters.agentId && !filters.status && !filters.type) {
        throw new Error('subscribeToConversations requires at least one filter (agentId, status, or type)');
      }

      let conversationsQuery = collection(db, 'conversations');

      // Apply filters
      if (filters.agentId) {
        conversationsQuery = query(conversationsQuery, where('agentId', '==', filters.agentId));
      }
      
      if (filters.status) {
        conversationsQuery = query(conversationsQuery, where('status', '==', filters.status));
      }
      
      if (filters.type) {
        conversationsQuery = query(conversationsQuery, where('type', '==', filters.type));
      }
      
      // Order by last message time
      conversationsQuery = query(conversationsQuery, orderBy('lastMessageAt', 'desc'));
      
      if (filters.limit) {
        conversationsQuery = query(conversationsQuery, limit(filters.limit));
      }
      
      const unsubscribe = onSnapshot(conversationsQuery,
        (snapshot) => {
          const conversations = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          callback(conversations);
          this.connectionStatus = 'connected';
          this.reconnectAttempts = 0;
        },
        (error) => {
          console.error('Error in conversations subscription:', error);
          this.handleSubscriptionError(error, listenerId);
          toast.error('Failed to load conversations');
        }
      );
      
      this.listeners.set(listenerId, unsubscribe);
      this.subscriptions.set(listenerId, { type: 'conversations', filters, callback });
      
      return listenerId;
    } catch (error) {
      console.error('Error setting up conversations subscription:', error);
      throw error;
    }
  }

  /**
   * Subscribe to messages in a conversation
   */
  subscribeToMessages(conversationId, callback, filters = {}) {
    const listenerId = this.generateListenerId(`messages_${conversationId}`, filters);
    
    try {
      let messagesQuery = collection(db, 'conversations', conversationId, 'messages');
      
      // Order by timestamp
      messagesQuery = query(messagesQuery, orderBy('timestamp', 'asc'));
      
      if (filters.limit) {
        messagesQuery = query(messagesQuery, limit(filters.limit));
      }
      
      const unsubscribe = onSnapshot(messagesQuery,
        (snapshot) => {
          const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Track new messages for audit
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const data = change.doc.data();
              auditService.logEvent(
                AUDIT_EVENTS.MESSAGE_SENT,
                { 
                  conversationId,
                  messageId: change.doc.id,
                  messageType: data.type || 'text'
                },
                data.senderId,
                AUDIT_SEVERITY.LOW
              );
            }
          });
          
          callback(messages);
          this.connectionStatus = 'connected';
          this.reconnectAttempts = 0;
        },
        (error) => {
          console.error('Error in messages subscription:', error);
          this.handleSubscriptionError(error, listenerId);
          toast.error('Failed to load messages');
        }
      );
      
      this.listeners.set(listenerId, unsubscribe);
      this.subscriptions.set(listenerId, { type: 'messages', conversationId, filters, callback });
      
      return listenerId;
    } catch (error) {
      console.error('Error setting up messages subscription:', error);
      throw error;
    }
  }

  /**
   * Subscribe to knowledge base articles
   */
  subscribeToKnowledgeBase(callback, filters = {}) {
    const listenerId = this.generateListenerId('knowledgeBase', filters);

    try {
      // Require at least one filter to prevent unfiltered access
      if (!filters.category && !filters.status && !filters.type) {
        throw new Error('subscribeToKnowledgeBase requires at least one filter (category, status, or type)');
      }

      let kbQuery = collection(db, 'knowledgeBase');

      // Apply filters
      if (filters.category) {
        kbQuery = query(kbQuery, where('category', '==', filters.category));
      }
      
      if (filters.status) {
        kbQuery = query(kbQuery, where('status', '==', filters.status));
      }
      
      if (filters.type) {
        kbQuery = query(kbQuery, where('type', '==', filters.type));
      }
      
      // Order by last updated
      kbQuery = query(kbQuery, orderBy('updatedAt', 'desc'));
      
      if (filters.limit) {
        kbQuery = query(kbQuery, limit(filters.limit));
      }
      
      const unsubscribe = onSnapshot(kbQuery,
        (snapshot) => {
          const articles = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Track knowledge base changes for audit
          snapshot.docChanges().forEach((change) => {
            const data = change.doc.data();
            let eventType;
            
            switch (change.type) {
              case 'added':
                eventType = AUDIT_EVENTS.KB_ARTICLE_CREATED;
                break;
              case 'modified':
                eventType = AUDIT_EVENTS.KB_ARTICLE_UPDATED;
                break;
              case 'removed':
                eventType = AUDIT_EVENTS.KB_ARTICLE_DELETED;
                break;
              default:
                return;
            }
            
            auditService.logEvent(
              eventType,
              { 
                articleId: change.doc.id,
                title: data.title,
                category: data.category
              },
              data.lastModifiedBy,
              AUDIT_SEVERITY.LOW
            );
          });
          
          callback(articles);
          this.connectionStatus = 'connected';
          this.reconnectAttempts = 0;
        },
        (error) => {
          console.error('Error in knowledge base subscription:', error);
          this.handleSubscriptionError(error, listenerId);
          toast.error('Failed to load knowledge base');
        }
      );
      
      this.listeners.set(listenerId, unsubscribe);
      this.subscriptions.set(listenerId, { type: 'knowledgeBase', filters, callback });
      
      return listenerId;
    } catch (error) {
      console.error('Error setting up knowledge base subscription:', error);
      throw error;
    }
  }

  /**
   * Subscribe to analytics data
   */
  subscribeToAnalytics(callback, filters = {}) {
    const listenerId = this.generateListenerId('analytics', filters);

    try {
      // Require date filters to prevent unfiltered access to large collections
      if (!filters.startDate || !filters.endDate) {
        throw new Error('subscribeToAnalytics requires both startDate and endDate filters');
      }

      // Subscribe to multiple collections for comprehensive analytics
      const collections = ['supportTickets', 'sendHelp', 'receiveHelp', 'users'];
      const unsubscribes = [];
      const analyticsData = {};

      collections.forEach(collectionName => {
        let analyticsQuery = collection(db, collectionName);
        
        // Apply date filters if provided
        if (filters.startDate) {
          analyticsQuery = query(analyticsQuery, where('createdAt', '>=', Timestamp.fromDate(filters.startDate)));
        }
        
        if (filters.endDate) {
          analyticsQuery = query(analyticsQuery, where('createdAt', '<=', Timestamp.fromDate(filters.endDate)));
        }
        
        const unsubscribe = onSnapshot(analyticsQuery,
          (snapshot) => {
            analyticsData[collectionName] = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            
            // Calculate analytics and call callback
            const analytics = this.calculateAnalytics(analyticsData);
            callback(analytics);
            
            this.connectionStatus = 'connected';
            this.reconnectAttempts = 0;
          },
          (error) => {
            console.error(`Error in ${collectionName} analytics subscription:`, error);
            this.handleSubscriptionError(error, listenerId);
          }
        );
        
        unsubscribes.push(unsubscribe);
      });
      
      // Store combined unsubscribe function
      this.listeners.set(listenerId, () => {
        unsubscribes.forEach(unsub => unsub());
      });
      
      this.subscriptions.set(listenerId, { type: 'analytics', filters, callback });
      
      return listenerId;
    } catch (error) {
      console.error('Error setting up analytics subscription:', error);
      throw error;
    }
  }

  /**
   * Calculate analytics from raw data
   */
  calculateAnalytics(data) {
    const analytics = {
      tickets: {
        total: data.supportTickets?.length || 0,
        pending: data.supportTickets?.filter(t => t.status === 'pending').length || 0,
        inProgress: data.supportTickets?.filter(t => t.status === 'in_progress').length || 0,
        resolved: data.supportTickets?.filter(t => t.status === 'resolved').length || 0
      },
      payments: {
        sendHelp: {
          total: data.sendHelp?.length || 0,
          pending: data.sendHelp?.filter(p => p.verificationStatus === 'pending').length || 0,
          verified: data.sendHelp?.filter(p => p.verificationStatus === 'verified').length || 0,
          rejected: data.sendHelp?.filter(p => p.verificationStatus === 'rejected').length || 0
        },
        receiveHelp: {
          total: data.receiveHelp?.length || 0,
          pending: data.receiveHelp?.filter(p => p.verificationStatus === 'pending').length || 0,
          verified: data.receiveHelp?.filter(p => p.verificationStatus === 'verified').length || 0,
          rejected: data.receiveHelp?.filter(p => p.verificationStatus === 'rejected').length || 0
        }
      },
      users: {
        total: data.users?.length || 0,
        active: data.users?.filter(u => u.status === 'active').length || 0,
        blocked: data.users?.filter(u => u.status === 'blocked').length || 0,
        kycPending: data.users?.filter(u => u.kycStatus === 'pending').length || 0
      }
    };
    
    return analytics;
  }

  /**
   * Handle subscription errors with retry logic
   */
  handleSubscriptionError(error, listenerId) {
    console.error(`Subscription error for ${listenerId}:`, error);
    
    this.connectionStatus = 'error';
    
    // Implement exponential backoff for reconnection
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
      
      setTimeout(() => {
        this.reconnectAttempts++;
        this.reconnectListener(listenerId);
      }, delay);
    } else {
      toast.error('Connection failed. Please refresh the page.');
      auditService.logSystemError(error, { listenerId, reconnectAttempts: this.reconnectAttempts });
    }
  }

  /**
   * Reconnect a specific listener
   */
  reconnectListener(listenerId) {
    const subscription = this.subscriptions.get(listenerId);
    if (!subscription) return;
    
    // Unsubscribe existing listener
    this.unsubscribe(listenerId);
    
    // Recreate subscription based on type
    try {
      switch (subscription.type) {
        case 'tickets':
          this.subscribeToTickets(subscription.callback, subscription.filters);
          break;
        case 'payments_sendHelp':
          this.subscribeToPayments(subscription.callback, 'sendHelp', subscription.filters);
          break;
        case 'payments_receiveHelp':
          this.subscribeToPayments(subscription.callback, 'receiveHelp', subscription.filters);
          break;
        case 'users':
          this.subscribeToUsers(subscription.callback, subscription.filters);
          break;
        case 'conversations':
          this.subscribeToConversations(subscription.callback, subscription.filters);
          break;
        case 'messages':
          this.subscribeToMessages(subscription.conversationId, subscription.callback, subscription.filters);
          break;
        case 'knowledgeBase':
          this.subscribeToKnowledgeBase(subscription.callback, subscription.filters);
          break;
        case 'analytics':
          this.subscribeToAnalytics(subscription.callback, subscription.filters);
          break;
        default:
          console.warn(`Unknown subscription type: ${subscription.type}`);
      }
    } catch (error) {
      console.error(`Failed to reconnect listener ${listenerId}:`, error);
    }
  }

  /**
   * Reconnect all listeners
   */
  reconnectAllListeners() {
    const listenerIds = Array.from(this.subscriptions.keys());
    listenerIds.forEach(listenerId => {
      this.reconnectListener(listenerId);
    });
  }

  /**
   * Unsubscribe from a specific listener
   */
  unsubscribe(listenerId) {
    const unsubscribe = this.listeners.get(listenerId);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(listenerId);
      this.subscriptions.delete(listenerId);
    }
  }

  /**
   * Unsubscribe from all listeners
   */
  unsubscribeAll() {
    this.listeners.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.listeners.clear();
    this.subscriptions.clear();
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      status: this.connectionStatus,
      activeListeners: this.listeners.size,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  /**
   * Get subscription statistics
   */
  getSubscriptionStats() {
    const stats = {
      total: this.subscriptions.size,
      byType: {}
    };
    
    this.subscriptions.forEach((subscription) => {
      const type = subscription.type;
      stats.byType[type] = (stats.byType[type] || 0) + 1;
    });
    
    return stats;
  }

  /**
   * Cleanup all listeners and subscriptions
   */
  cleanup() {
    this.unsubscribeAll();
    this.connectionStatus = 'disconnected';
  }
}

// Create singleton instance
const realtimeService = new RealtimeService();

export default realtimeService;

// Export convenience functions
export const subscribeToTickets = (callback, filters) => 
  realtimeService.subscribeToTickets(callback, filters);

export const subscribeToPayments = (callback, type, filters) => 
  realtimeService.subscribeToPayments(callback, type, filters);

export const subscribeToUsers = (callback, filters) => 
  realtimeService.subscribeToUsers(callback, filters);

export const subscribeToConversations = (callback, filters) => 
  realtimeService.subscribeToConversations(callback, filters);

export const subscribeToMessages = (conversationId, callback, filters) => 
  realtimeService.subscribeToMessages(conversationId, callback, filters);

export const subscribeToKnowledgeBase = (callback, filters) => 
  realtimeService.subscribeToKnowledgeBase(callback, filters);

export const subscribeToAnalytics = (callback, filters) => 
  realtimeService.subscribeToAnalytics(callback, filters);

export const unsubscribe = (listenerId) => 
  realtimeService.unsubscribe(listenerId);

export const getConnectionStatus = () => 
  realtimeService.getConnectionStatus();

export const getSubscriptionStats = () => 
  realtimeService.getSubscriptionStats();