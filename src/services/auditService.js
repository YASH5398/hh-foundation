import { db } from '../config/firebase';
import { collection, addDoc, query, where, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

// Audit event types
export const AUDIT_EVENTS = {
  // Authentication
  AGENT_LOGIN: 'agent_login',
  AGENT_LOGOUT: 'agent_logout',
  
  // Ticket Management
  TICKET_CREATED: 'ticket_created',
  TICKET_ASSIGNED: 'ticket_assigned',
  TICKET_STATUS_CHANGED: 'ticket_status_changed',
  TICKET_PRIORITY_CHANGED: 'ticket_priority_changed',
  TICKET_RESPONSE_ADDED: 'ticket_response_added',
  TICKET_NOTE_ADDED: 'ticket_note_added',
  TICKET_ESCALATED: 'ticket_escalated',
  TICKET_RESOLVED: 'ticket_resolved',
  
  // Payment Verification
  PAYMENT_VERIFIED: 'payment_verified',
  PAYMENT_REJECTED: 'payment_rejected',
  PAYMENT_STATUS_CHANGED: 'payment_status_changed',
  PAYMENT_FLAGGED: 'payment_flagged',
  
  // User Management
  USER_PROFILE_VIEWED: 'user_profile_viewed',
  USER_PROFILE_UPDATED: 'user_profile_updated',
  USER_BLOCKED: 'user_blocked',
  USER_UNBLOCKED: 'user_unblocked',
  USER_KYC_UPDATED: 'user_kyc_updated',
  
  // Communication
  MESSAGE_SENT: 'message_sent',
  EMAIL_SENT: 'email_sent',
  WHATSAPP_SENT: 'whatsapp_sent',
  TEMPLATE_USED: 'template_used',
  
  // Knowledge Base
  KB_ARTICLE_CREATED: 'kb_article_created',
  KB_ARTICLE_UPDATED: 'kb_article_updated',
  KB_ARTICLE_DELETED: 'kb_article_deleted',
  KB_ARTICLE_VIEWED: 'kb_article_viewed',
  
  // System Events
  DATA_EXPORT: 'data_export',
  BULK_ACTION: 'bulk_action',
  SYSTEM_ERROR: 'system_error',
  SECURITY_ALERT: 'security_alert'
};

// Audit severity levels
export const AUDIT_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

class AuditService {
  constructor() {
    this.listeners = new Map();
    this.batchSize = 50;
    this.flushInterval = 5000; // 5 seconds
    this.pendingLogs = [];
    this.isOnline = navigator.onLine;
    
    // Setup offline/online listeners
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushPendingLogs();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
    
    // Auto-flush pending logs
    setInterval(() => {
      if (this.pendingLogs.length > 0 && this.isOnline) {
        this.flushPendingLogs();
      }
    }, this.flushInterval);
  }

  /**
   * Log an audit event
   * @param {string} eventType - Type of event from AUDIT_EVENTS
   * @param {Object} details - Event details
   * @param {string} agentId - ID of the agent performing the action
   * @param {string} severity - Severity level from AUDIT_SEVERITY
   * @param {Object} metadata - Additional metadata
   */
  async logEvent(eventType, details = {}, agentId = null, severity = AUDIT_SEVERITY.LOW, metadata = {}) {
    try {
      const auditLog = {
        eventType,
        details,
        agentId,
        severity,
        metadata: {
          ...metadata,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          sessionId: this.getSessionId(),
          ipAddress: await this.getClientIP()
        },
        timestamp: Timestamp.now(),
        createdAt: new Date()
      };

      if (this.isOnline) {
        await this.writeToFirestore(auditLog);
      } else {
        this.pendingLogs.push(auditLog);
        this.storeOfflineLogs();
      }

      // Log critical events to console for immediate visibility
      if (severity === AUDIT_SEVERITY.CRITICAL) {
        console.warn('CRITICAL AUDIT EVENT:', auditLog);
      }

    } catch (error) {
      console.error('Failed to log audit event:', error);
      // Store in local storage as fallback
      this.storeLocalAuditLog({ eventType, details, agentId, severity, error: error.message });
    }
  }

  /**
   * Write audit log to Firestore
   */
  async writeToFirestore(auditLog) {
    await addDoc(collection(db, 'auditLogs'), auditLog);
  }

  /**
   * Flush pending logs when back online
   */
  async flushPendingLogs() {
    if (this.pendingLogs.length === 0) return;

    const logsToFlush = [...this.pendingLogs];
    try {
      this.pendingLogs = [];

      for (const log of logsToFlush) {
        await this.writeToFirestore(log);
      }

      localStorage.removeItem('pendingAuditLogs');
      console.log(`Flushed ${logsToFlush.length} pending audit logs`);
    } catch (error) {
      console.error('Failed to flush pending logs:', error);
      // Put logs back if failed
      this.pendingLogs = [...this.pendingLogs, ...logsToFlush];
    }
  }

  /**
   * Store offline logs in localStorage
   */
  storeOfflineLogs() {
    try {
      localStorage.setItem('pendingAuditLogs', JSON.stringify(this.pendingLogs));
    } catch (error) {
      console.error('Failed to store offline logs:', error);
    }
  }

  /**
   * Load offline logs from localStorage
   */
  loadOfflineLogs() {
    try {
      const stored = localStorage.getItem('pendingAuditLogs');
      if (stored) {
        this.pendingLogs = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load offline logs:', error);
    }
  }

  /**
   * Store critical audit log in localStorage as fallback
   */
  storeLocalAuditLog(logData) {
    try {
      const existingLogs = JSON.parse(localStorage.getItem('fallbackAuditLogs') || '[]');
      existingLogs.push({ ...logData, timestamp: new Date().toISOString() });
      
      // Keep only last 100 logs to prevent storage overflow
      if (existingLogs.length > 100) {
        existingLogs.splice(0, existingLogs.length - 100);
      }
      
      localStorage.setItem('fallbackAuditLogs', JSON.stringify(existingLogs));
    } catch (error) {
      console.error('Failed to store fallback audit log:', error);
    }
  }

  /**
   * Get session ID for tracking user sessions
   */
  getSessionId() {
    let sessionId = sessionStorage.getItem('auditSessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('auditSessionId', sessionId);
    }
    return sessionId;
  }

  /**
   * Get client IP address (simplified version)
   */
  async getClientIP() {
    try {
      // In a real implementation, you might use a service to get the actual IP
      // For now, we'll return a placeholder
      return 'client_ip_placeholder';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Subscribe to real-time audit logs
   * @param {Function} callback - Callback function to handle new logs
   * @param {Object} filters - Filters for the query
   * @param {number} limitCount - Number of logs to fetch
   */
  subscribeToAuditLogs(callback, filters = {}, limitCount = 50) {
    try {
      let auditQuery = collection(db, 'auditLogs');
      
      // Apply filters
      if (filters.agentId) {
        auditQuery = query(auditQuery, where('agentId', '==', filters.agentId));
      }
      
      if (filters.eventType) {
        auditQuery = query(auditQuery, where('eventType', '==', filters.eventType));
      }
      
      if (filters.severity) {
        auditQuery = query(auditQuery, where('severity', '==', filters.severity));
      }
      
      if (filters.startDate) {
        auditQuery = query(auditQuery, where('timestamp', '>=', Timestamp.fromDate(filters.startDate)));
      }
      
      if (filters.endDate) {
        auditQuery = query(auditQuery, where('timestamp', '<=', Timestamp.fromDate(filters.endDate)));
      }
      
      // Order by timestamp and limit
      auditQuery = query(auditQuery, orderBy('timestamp', 'desc'), limit(limitCount));
      
      const unsubscribe = onSnapshot(auditQuery, (snapshot) => {
        const logs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(logs);
      }, (error) => {
        console.error('Error subscribing to audit logs:', error);
        toast.error('Failed to load audit logs');
      });
      
      // Store unsubscribe function
      const listenerId = `audit_${Date.now()}`;
      this.listeners.set(listenerId, unsubscribe);
      
      return listenerId;
    } catch (error) {
      console.error('Error setting up audit log subscription:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from audit logs
   * @param {string} listenerId - ID of the listener to unsubscribe
   */
  unsubscribeFromAuditLogs(listenerId) {
    const unsubscribe = this.listeners.get(listenerId);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(listenerId);
    }
  }

  /**
   * Get audit statistics
   * @param {Object} filters - Filters for the statistics
   */
  async getAuditStatistics(filters = {}) {
    try {
      // This would typically be implemented with Firestore aggregation queries
      // For now, we'll return mock data structure
      return {
        totalEvents: 0,
        eventsByType: {},
        eventsBySeverity: {},
        eventsToday: 0,
        eventsThisWeek: 0,
        topAgents: [],
        criticalEvents: 0
      };
    } catch (error) {
      console.error('Error getting audit statistics:', error);
      throw error;
    }
  }

  /**
   * Export audit logs
   * @param {Object} filters - Filters for export
   * @param {string} format - Export format (csv, json)
   */
  async exportAuditLogs(filters = {}, format = 'csv') {
    try {
      // Log the export action
      await this.logEvent(
        AUDIT_EVENTS.DATA_EXPORT,
        { exportType: 'audit_logs', format, filters },
        filters.agentId,
        AUDIT_SEVERITY.MEDIUM
      );

      // Implementation would fetch and format data
      // For now, return a placeholder
      return {
        success: true,
        message: 'Export initiated',
        downloadUrl: null // Would contain actual download URL
      };
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      throw error;
    }
  }

  /**
   * Clean up all listeners
   */
  cleanup() {
    this.listeners.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.listeners.clear();
  }

  // Convenience methods for common audit events
  
  async logTicketAction(action, ticketId, agentId, details = {}) {
    await this.logEvent(
      action,
      { ticketId, ...details },
      agentId,
      AUDIT_SEVERITY.MEDIUM
    );
  }

  async logPaymentAction(action, paymentId, agentId, details = {}) {
    await this.logEvent(
      action,
      { paymentId, ...details },
      agentId,
      AUDIT_SEVERITY.HIGH
    );
  }

  async logUserAction(action, userId, agentId, details = {}) {
    await this.logEvent(
      action,
      { userId, ...details },
      agentId,
      AUDIT_SEVERITY.MEDIUM
    );
  }

  async logSecurityEvent(details, agentId = null) {
    await this.logEvent(
      AUDIT_EVENTS.SECURITY_ALERT,
      details,
      agentId,
      AUDIT_SEVERITY.CRITICAL
    );
  }

  async logSystemError(error, context = {}, agentId = null) {
    await this.logEvent(
      AUDIT_EVENTS.SYSTEM_ERROR,
      {
        error: error.message,
        stack: error.stack,
        context
      },
      agentId,
      AUDIT_SEVERITY.HIGH
    );
  }
}

// Create singleton instance
const auditService = new AuditService();

// Load any pending offline logs on initialization
auditService.loadOfflineLogs();

export default auditService;

// Export convenience functions
export const logAuditEvent = (eventType, details, agentId, severity, metadata) => 
  auditService.logEvent(eventType, details, agentId, severity, metadata);

export const subscribeToAuditLogs = (callback, filters, limit) => 
  auditService.subscribeToAuditLogs(callback, filters, limit);

export const unsubscribeFromAuditLogs = (listenerId) => 
  auditService.unsubscribeFromAuditLogs(listenerId);

export const logTicketAction = (action, ticketId, agentId, details) => 
  auditService.logTicketAction(action, ticketId, agentId, details);

export const logPaymentAction = (action, paymentId, agentId, details) => 
  auditService.logPaymentAction(action, paymentId, agentId, details);

export const logUserAction = (action, userId, agentId, details) => 
  auditService.logUserAction(action, userId, agentId, details);

export const logSecurityEvent = (details, agentId) => 
  auditService.logSecurityEvent(details, agentId);

export const logSystemError = (error, context, agentId) => 
  auditService.logSystemError(error, context, agentId);