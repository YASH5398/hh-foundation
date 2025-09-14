import React, { useState, useEffect } from 'react';
import { 
  FiX, 
  FiAlertTriangle, 
  FiUser, 
  FiMail, 
  FiMessageSquare,
  FiSend
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useEscalation } from '../../hooks/useEscalation';

/**
 * EscalateToAdmin Modal Component
 * Allows agents to escalate user issues to admin
 */
const EscalateToAdmin = ({ isOpen, onClose, prefilledData = {} }) => {
  const { submitEscalation, submitting } = useEscalation();
  
  const [formData, setFormData] = useState({
    userId: '',
    userEmail: '',
    issue: ''
  });
  
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Prefill form data when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        userId: prefilledData.userId || '',
        userEmail: prefilledData.userEmail || '',
        issue: prefilledData.issue || ''
      });
      setErrors({});
      setTouched({});
    }
  }, [isOpen, prefilledData]);

  /**
   * Handle input changes
   */
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  /**
   * Handle input blur (mark as touched)
   */
  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  /**
   * Validate individual field
   */
  const validateField = (field, value) => {
    let error = '';
    
    switch (field) {
      case 'userId':
        if (!value.trim()) {
          error = 'User ID is required';
        } else if (value.trim().length < 3) {
          error = 'User ID must be at least 3 characters';
        }
        break;
        
      case 'userEmail':
        if (!value.trim()) {
          error = 'User email is required';
        } else {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            error = 'Please enter a valid email address';
          }
        }
        break;
        
      case 'issue':
        if (!value.trim()) {
          error = 'Issue description is required';
        } else if (value.trim().length < 10) {
          error = 'Issue description must be at least 10 characters';
        } else if (value.trim().length > 1000) {
          error = 'Issue description must be less than 1000 characters';
        }
        break;
        
      default:
        break;
    }
    
    setErrors(prev => ({ ...prev, [field]: error }));
    return error === '';
  };

  /**
   * Validate entire form
   */
  const validateForm = () => {
    const fields = ['userId', 'userEmail', 'issue'];
    let isValid = true;
    
    fields.forEach(field => {
      const fieldValid = validateField(field, formData[field]);
      if (!fieldValid) isValid = false;
    });
    
    return isValid;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({ userId: true, userEmail: true, issue: true });
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    // Submit escalation
    const success = await submitEscalation(formData);
    
    if (success) {
      // Reset form and close modal
      setFormData({ userId: '', userEmail: '', issue: '' });
      setErrors({});
      setTouched({});
      onClose();
    }
  };

  /**
   * Handle modal close
   */
  const handleClose = () => {
    if (!submitting) {
      setFormData({ userId: '', userEmail: '', issue: '' });
      setErrors({});
      setTouched({});
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={handleClose}
          />
          
          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md bg-white rounded-lg shadow-xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg mr-3">
                    <FiAlertTriangle className="w-5 h-5 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Escalate to Admin
                  </h3>
                </div>
                <button
                  onClick={handleClose}
                  disabled={submitting}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              
              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-4">
                  {/* User ID Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      User ID *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiUser className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={formData.userId}
                        onChange={(e) => handleInputChange('userId', e.target.value)}
                        onBlur={() => handleBlur('userId')}
                        placeholder="Enter user UID"
                        className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.userId && touched.userId
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-300'
                        }`}
                        disabled={submitting}
                      />
                    </div>
                    {errors.userId && touched.userId && (
                      <p className="mt-1 text-xs text-red-600">{errors.userId}</p>
                    )}
                  </div>
                  
                  {/* User Email Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      User Email *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiMail className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        value={formData.userEmail}
                        onChange={(e) => handleInputChange('userEmail', e.target.value)}
                        onBlur={() => handleBlur('userEmail')}
                        placeholder="user@example.com"
                        className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.userEmail && touched.userEmail
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-300'
                        }`}
                        disabled={submitting}
                      />
                    </div>
                    {errors.userEmail && touched.userEmail && (
                      <p className="mt-1 text-xs text-red-600">{errors.userEmail}</p>
                    )}
                  </div>
                  
                  {/* Issue Description Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Issue Description *
                    </label>
                    <div className="relative">
                      <div className="absolute top-3 left-3 pointer-events-none">
                        <FiMessageSquare className="h-4 w-4 text-gray-400" />
                      </div>
                      <textarea
                        value={formData.issue}
                        onChange={(e) => handleInputChange('issue', e.target.value)}
                        onBlur={() => handleBlur('issue')}
                        placeholder="Describe the issue that needs admin attention..."
                        rows={4}
                        className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                          errors.issue && touched.issue
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-300'
                        }`}
                        disabled={submitting}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      {errors.issue && touched.issue ? (
                        <p className="text-xs text-red-600">{errors.issue}</p>
                      ) : (
                        <div></div>
                      )}
                      <p className="text-xs text-gray-500">
                        {formData.issue.length}/1000
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={submitting}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || Object.values(errors).some(error => error)}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <FiSend className="w-4 h-4 mr-2" />
                        Submit Escalation
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EscalateToAdmin;