// Email validation
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return 'Email is required';
  if (!emailRegex.test(email)) return 'Please enter a valid email address';
  return null;
};

// Password validation
export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters long';
  if (password.length > 128) return 'Password must be less than 128 characters';
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const strength = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
  
  if (strength < 3) {
    return 'Password must contain at least 3 of: uppercase, lowercase, numbers, special characters';
  }
  
  return null;
};

// Password strength indicator
export const getPasswordStrength = (password) => {
  if (!password) return { strength: 0, label: '', color: '' };
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const strength = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
  
  if (password.length < 6) {
    return { strength: 0, label: 'Too Short', color: 'bg-red-500' };
  }
  
  switch (strength) {
    case 1:
      return { strength: 1, label: 'Weak', color: 'bg-red-500' };
    case 2:
      return { strength: 2, label: 'Fair', color: 'bg-yellow-500' };
    case 3:
      return { strength: 3, label: 'Good', color: 'bg-blue-500' };
    case 4:
      return { strength: 4, label: 'Strong', color: 'bg-green-500' };
    default:
      return { strength: 0, label: 'Too Short', color: 'bg-red-500' };
  }
};

// Username validation
export const validateUsername = (username) => {
  if (!username) return 'Username is required';
  if (username.length < 3) return 'Username must be at least 3 characters long';
  if (username.length > 20) return 'Username must be less than 20 characters';
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return 'Username can only contain letters, numbers, and underscores';
  }
  return null;
};

// Name validation
export const validateName = (name, fieldName = 'Name') => {
  if (!name) return `${fieldName} is required`;
  if (name.length < 2) return `${fieldName} must be at least 2 characters long`;
  if (name.length > 50) return `${fieldName} must be less than 50 characters`;
  if (!/^[a-zA-Z\s]+$/.test(name)) {
    return `${fieldName} can only contain letters and spaces`;
  }
  return null;
};

// Phone validation
export const validatePhone = (phone) => {
  if (!phone) return 'Phone number is required';
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
    return 'Please enter a valid phone number';
  }
  return null;
};

// Confirm password validation
export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) return 'Please confirm your password';
  if (password !== confirmPassword) return 'Passwords do not match';
  return null;
};

// Firebase error mapping
export const getFirebaseErrorMessage = (errorCode) => {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No account found with this email address';
    case 'auth/wrong-password':
      return 'Incorrect password';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists';
    case 'auth/weak-password':
      return 'Password is too weak';
    case 'auth/invalid-email':
      return 'Invalid email address';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later';
    case 'auth/user-disabled':
      return 'This account has been disabled';
    case 'auth/operation-not-allowed':
      return 'This operation is not allowed';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection';
    default:
      return 'An error occurred. Please try again';
  }
};

export function isUserProfileComplete(user) {
  return (
    user &&
    typeof user.userId === 'string' && user.userId.trim() !== '' &&
    typeof user.levelStatus === 'string' && user.levelStatus.trim() !== '' &&
    user.paymentMethod && typeof user.paymentMethod === 'object'
  );
} 