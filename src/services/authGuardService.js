import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

/**
 * Authentication Guard Service
 * Provides centralized authentication state management and guards
 */
class AuthGuardService {
  constructor() {
    this._authState = null;
    this._authListeners = new Set();
    this._setupAuthListener();
  }

  /**
   * Set up authentication state listener
   */
  _setupAuthListener() {
    onAuthStateChanged(auth, (user) => {
      this._authState = user;
      console.log('Auth state changed:', user ? `User: ${user.uid}` : 'No user');
      
      // Notify all listeners
      for (const listener of this._authListeners) {
        try {
          listener(user);
        } catch (error) {
          console.error('Error in auth state listener:', error);
        }
      }
    });
  }

  /**
   * Check if user is currently authenticated
   * @returns {boolean} True if authenticated
   */
  isAuthenticated() {
    return !!this._authState && !!auth.currentUser;
  }

  /**
   * Get current user
   * @returns {Object|null} Current user or null
   */
  getCurrentUser() {
    return this._authState || auth.currentUser;
  }

  /**
   * Require authentication for operation
   * @param {Function} operation - Operation to execute if authenticated
   * @returns {Promise<any>} Operation result
   * @throws {Error} If user is not authenticated
   */
  async requireAuth(operation) {
    if (!this.isAuthenticated()) {
      const error = new Error('Authentication required. Please log in to continue.');
      error.code = 'auth/unauthenticated';
      throw error;
    }

    try {
      return await operation();
    } catch (error) {
      // Log the operation error with auth context
      console.error('Authenticated operation failed:', {
        user: this._authState?.uid,
        error: error.message,
        code: error.code
      });
      throw error;
    }
  }

  /**
   * Execute operation with authentication check and user-friendly error handling
   * @param {Function} operation - Operation to execute
   * @param {string} operationName - Name of operation for logging
   * @returns {Promise<any>} Operation result or error info
   */
  async safeExecute(operation, operationName = 'operation') {
    try {
      return await this.requireAuth(operation);
    } catch (error) {
      console.error(`${operationName} failed:`, {
        authenticated: this.isAuthenticated(),
        user: this._authState?.uid,
        error: error.message,
        code: error.code
      });

      // Return structured error info instead of throwing
      return {
        success: false,
        error: error.message,
        code: error.code,
        requiresAuth: error.code === 'auth/unauthenticated'
      };
    }
  }

  /**
   * Handle unauthenticated state
   * @param {string} context - Context where auth is required
   * @returns {Object} Error information
   */
  handleUnauthenticated(context = 'this operation') {
    const message = `Please log in to access ${context}.`;
    
    console.warn('Unauthenticated access attempt:', {
      context,
      currentUser: this._authState?.uid || 'none',
      timestamp: new Date().toISOString()
    });

    return {
      success: false,
      error: message,
      code: 'auth/unauthenticated',
      requiresAuth: true
    };
  }

  /**
   * Add authentication state listener
   * @param {Function} listener - Callback function
   * @returns {Function} Unsubscribe function
   */
  addAuthListener(listener) {
    this._authListeners.add(listener);
    
    // Immediately call with current state
    try {
      listener(this._authState);
    } catch (error) {
      console.error('Error in auth listener:', error);
    }

    // Return unsubscribe function
    return () => {
      this._authListeners.delete(listener);
    };
  }

  /**
   * Wait for authentication state to be determined
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<Object|null>} User object or null
   */
  waitForAuth(timeout = 5000) {
    return new Promise((resolve, reject) => {
      // If already determined, resolve immediately
      if (this._authState !== null) {
        resolve(this._authState);
        return;
      }

      const timeoutId = setTimeout(() => {
        unsubscribe();
        reject(new Error('Authentication state timeout'));
      }, timeout);

      const unsubscribe = this.addAuthListener((user) => {
        clearTimeout(timeoutId);
        unsubscribe();
        resolve(user);
      });
    });
  }

  /**
   * Check if user has required permissions
   * @param {Array|string} requiredRoles - Required roles
   * @returns {boolean} True if user has permission
   */
  hasPermission(requiredRoles = []) {
    if (!this.isAuthenticated()) {
      return false;
    }

    const user = this.getCurrentUser();
    if (!user) return false;

    // If no roles required, just check authentication
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    const userRoles = user.customClaims?.roles || [];

    return roles.some(role => userRoles.includes(role));
  }

  /**
   * Get user authentication status with details
   * @returns {Object} Authentication status
   */
  getAuthStatus() {
    const user = this.getCurrentUser();
    
    return {
      isAuthenticated: this.isAuthenticated(),
      user: user ? {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified
      } : null,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Create authentication error with context
   * @param {string} operation - Operation that failed
   * @param {string} context - Additional context
   * @returns {Error} Authentication error
   */
  createAuthError(operation, context = '') {
    const message = `Authentication required for ${operation}${context ? `: ${context}` : ''}`;
    const error = new Error(message);
    error.code = 'auth/unauthenticated';
    error.operation = operation;
    error.context = context;
    return error;
  }

  /**
   * Cleanup all listeners
   */
  cleanup() {
    console.log(`Cleaning up ${this._authListeners.size} auth listeners`);
    this._authListeners.clear();
  }
}

// Export singleton instance
export const authGuardService = new AuthGuardService();
export default authGuardService;