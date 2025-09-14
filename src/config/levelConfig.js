// Centralized level configuration for the MLM system

// Level configuration with receive counts, upgrade amounts, and next levels
export const LEVEL_CONFIG = {
  Star: { 
    receiveCount: 3, 
    upgradeAmount: 600, 
    next: "Silver",
    helpLimit: 3,
    amount: 300
  },
  Silver: { 
    receiveCount: 9, 
    upgradeAmount: 2000, 
    next: "Gold",
    helpLimit: 9,
    amount: 600
  },
  Gold: { 
    receiveCount: 9, 
    upgradeAmount: 20000, 
    next: "Platinum",
    helpLimit: 27,
    amount: 2000
  },
  Platinum: { 
    receiveCount: 9, 
    upgradeAmount: 200000, 
    next: "Diamond",
    helpLimit: 81,
    amount: 20000
  },
  Diamond: {
    receiveCount: 9,
    upgradeAmount: 0, // No further upgrade
    next: null,
    helpLimit: 243,
    amount: 200000
  }
};

// Help limits by level (legacy support)
export const LEVEL_HELP_LIMIT = {
  Star: 3,
  Silver: 9,
  Gold: 27,
  Platinum: 81,
  Diamond: 243,
  // Numeric keys for backward compatibility
  1: 3,
  2: 5,
  3: 8,
  4: 12,
  5: 15
};

// Level amounts mapping
export const LEVEL_AMOUNTS = {
  Star: 300,
  Silver: 600,
  Gold: 2000,
  Platinum: 20000,
  Diamond: 200000
};

// Upline payment requirements for level upgrades
export const UPLINE_PAYMENT_CONFIG = {
  Silver: { required: true, amount: 600 },
  Gold: { required: true, amount: 2000 },
  Platinum: { required: true, amount: 20000 },
  Diamond: { required: true, amount: 200000 }
};

// Upline payment status constants
export const UPLINE_PAYMENT_STATUS = {
  PENDING: 'Pending',
  PAID: 'Paid',
  CONFIRMED: 'Confirmed'
};

// Helper functions
export const checkUpgrade = (user) => {
  if (!user || !user.level || !LEVEL_CONFIG[user.level]) {
    return false;
  }
  const config = LEVEL_CONFIG[user.level];
  return user.helpReceived >= config.receiveCount && !user.nextLevelPaymentDone;
};

export const getRequiredHelpsByLevel = (level) => {
  if (typeof level === 'string' && LEVEL_CONFIG[level]) {
    return LEVEL_CONFIG[level].receiveCount;
  }
  return level * 2; // Fallback for numeric levels
};

export const getAmountByLevel = (level) => {
  return LEVEL_AMOUNTS[level] || 300;
};

export const getNextLevel = (currentLevel) => {
  return LEVEL_CONFIG[currentLevel]?.next || null;
};

export const requiresUplinePayment = (level) => {
  return UPLINE_PAYMENT_CONFIG[level]?.required || false;
};

export const getUplinePaymentAmount = (level) => {
  return UPLINE_PAYMENT_CONFIG[level]?.amount || 0;
};

// Level order for upgrades
export const LEVEL_ORDER = ['Star', 'Silver', 'Gold', 'Platinum', 'Diamond'];

export const getLevelIndex = (level) => {
  return LEVEL_ORDER.indexOf(level);
};

export const isMaxLevel = (level) => {
  return level === 'Diamond';
};

// Export legacy config for backward compatibility
export const levelConfig = LEVEL_CONFIG;

export default {
  LEVEL_CONFIG,
  LEVEL_HELP_LIMIT,
  LEVEL_AMOUNTS,
  UPLINE_PAYMENT_CONFIG,
  UPLINE_PAYMENT_STATUS,
  checkUpgrade,
  getRequiredHelpsByLevel,
  getAmountByLevel,
  getNextLevel,
  requiresUplinePayment,
  getUplinePaymentAmount,
  LEVEL_ORDER,
  getLevelIndex,
  isMaxLevel
};