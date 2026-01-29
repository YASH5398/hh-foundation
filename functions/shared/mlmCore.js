// SINGLE SOURCE OF TRUTH: Complete MLM Logic - FINAL PLAN
// Backend CommonJS version - imported by functions/index.js

const LEVEL_CONFIG = {
  Star: {
    totalHelps: 3,
    amount: 300,
    blockPoints: [], // NO AUTO BLOCK - Star users are never blocked automatically after 3 receives
    upgradeAmount: 600, // OPTIONAL upgrade payment to Silver
    sponsorPayment: null, // No sponsor payment required
    next: "Silver",
    helpLimit: 3
  },
  Silver: {
    totalHelps: 9,
    amount: 600,
    blockPoints: [4, 7], // Block after 4 (upgrade) and 7 (sponsor) receives
    upgradeAmount: 1800, // REQUIRED upgrade payment after 4 receives to unlock Gold
    sponsorPayment: 1200, // REQUIRED sponsor payment after 7 receives to continue
    next: "Gold",
    helpLimit: 9
  },
  Gold: {
    totalHelps: 27,
    amount: 2000,
    blockPoints: [11, 25], // Block after 11 (upgrade) and 25 (sponsor) receives
    upgradeAmount: 20000, // Required upgrade payment after 11 receives
    sponsorPayment: 4000, // Required sponsor payment after 25 receives
    next: "Platinum",
    helpLimit: 27
  },
  Platinum: {
    totalHelps: 81,
    amount: 20000,
    blockPoints: [11, 80], // Block after 11 (upgrade) and 80 (sponsor) receives
    upgradeAmount: 200000, // Required upgrade payment after 11 receives
    sponsorPayment: 40000, // Required sponsor payment after 80 receives
    next: "Diamond",
    helpLimit: 81
  },
  Diamond: {
    totalHelps: 243,
    amount: 200000,
    blockPoints: [242], // Block after 242 receives (sponsor payment required)
    upgradeAmount: null, // No upgrade possible
    sponsorPayment: 600000, // Required sponsor payment after 242 receives
    next: null, // Final level
    helpLimit: 243
  }
};

const LEVEL_ORDER = ['Star', 'Silver', 'Gold', 'Platinum', 'Diamond'];

const isIncomeBlocked = (user) => {
  if (!user || !user.level || !LEVEL_CONFIG[user.level]) {
    return false;
  }
  
  // Star users are NEVER blocked automatically after receiving helps
  if (user.level === 'Star') {
    return false;
  }
  
  const config = LEVEL_CONFIG[user.level];
  const helpReceived = user.helpReceived || 0;
  return config.blockPoints.includes(helpReceived);
};

const getCurrentBlockPoint = (user) => {
  if (!user || !user.level || !LEVEL_CONFIG[user.level]) {
    return null;
  }
  
  // Star users are never blocked automatically
  if (user.level === 'Star') {
    return null;
  }
  
  const config = LEVEL_CONFIG[user.level];
  const helpReceived = user.helpReceived || 0;
  return config.blockPoints.find(point => point === helpReceived) || null;
};

const getRequiredPaymentForUnblock = (user) => {
  if (!user || !isIncomeBlocked(user)) {
    return null;
  }

  const config = LEVEL_CONFIG[user.level];
  if (!config) {
    return null;
  }

  const helpReceived = user.helpReceived || 0;

  for (const blockPoint of config.blockPoints) {
    if (helpReceived === blockPoint) {
      // Star level has no block points, so this won't execute for Star
      
      if (user.level === 'Silver') {
        if (blockPoint === 4) {
          return { type: 'upgrade', amount: config.upgradeAmount, required: true };
        }
        if (blockPoint === 7) {
          return { type: 'sponsor', amount: config.sponsorPayment, required: true };
        }
      }

      if (user.level === 'Gold') {
        if (blockPoint === 11) {
          return { type: 'upgrade', amount: config.upgradeAmount, required: true };
        }
        if (blockPoint === 25) {
          return { type: 'sponsor', amount: config.sponsorPayment, required: true };
        }
      }

      if (user.level === 'Platinum') {
        if (blockPoint === 11) {
          return { type: 'upgrade', amount: config.upgradeAmount, required: true };
        }
        if (blockPoint === 80) {
          return { type: 'sponsor', amount: config.sponsorPayment, required: true };
        }
      }

      if (user.level === 'Diamond' && blockPoint === 242) {
        return { type: 'sponsor', amount: config.sponsorPayment, required: true };
      }

      return { type: 'upgrade', amount: config.upgradeAmount || config.sponsorPayment, required: true };
    }
  }

  return null;
};

const getTotalHelpsByLevel = (level) => {
  if (typeof level === 'string' && LEVEL_CONFIG[level]) {
    return LEVEL_CONFIG[level].totalHelps;
  }
  throw new Error(`Invalid level: ${level}`);
};

const getAmountByLevel = (level) => {
  return LEVEL_CONFIG[level]?.amount || 300;
};

const getNextLevel = (currentLevel) => {
  return LEVEL_CONFIG[currentLevel]?.next || null;
};

const getBlockPointsByLevel = (level) => {
  return LEVEL_CONFIG[level]?.blockPoints || [];
};

const getUpgradeAmount = (level) => {
  return LEVEL_CONFIG[level]?.upgradeAmount || null;
};

const getSponsorPaymentAmount = (level) => {
  return LEVEL_CONFIG[level]?.sponsorPayment || null;
};

const getLevelIndex = (level) => {
  return LEVEL_ORDER.indexOf(level);
};

const isMaxLevel = (level) => {
  return level === 'Diamond';
};

const canUpgradeToLevel = (currentLevel, targetLevel) => {
  const currentIndex = getLevelIndex(currentLevel);
  const targetIndex = getLevelIndex(targetLevel);
  return targetIndex === currentIndex + 1;
};

const validateLevelUpgrade = (user, targetLevel) => {
  if (!user || !user.level) {
    return { valid: false, reason: 'Invalid user data' };
  }

  const currentLevel = user.level;
  if (!canUpgradeToLevel(currentLevel, targetLevel)) {
    return { valid: false, reason: 'Invalid level progression' };
  }

  const config = LEVEL_CONFIG[currentLevel];
  if (!config) {
    return { valid: false, reason: 'Invalid current level' };
  }

  return { valid: true };
};

const validateSponsorPayment = (user, sponsorId) => {
  if (!user || !user.level || !sponsorId) {
    return { valid: false, reason: 'Invalid user or sponsor data' };
  }

  const config = LEVEL_CONFIG[user.level];
  if (!config || !config.sponsorPayment) {
    return { valid: false, reason: 'No sponsor payment required for this level' };
  }

  if (!isIncomeBlocked(user)) {
    return { valid: false, reason: 'User is not blocked' };
  }

  const helpReceived = user.helpReceived || 0;
  const requiredPayment = getRequiredPaymentForUnblock(user);

  if (!requiredPayment || requiredPayment.type !== 'sponsor') {
    return { valid: false, reason: 'Sponsor payment not required at this point' };
  }

  return { valid: true, amount: requiredPayment.amount };
};

const validateUpgradePayment = (user) => {
  if (!user || !user.level) {
    return { valid: false, reason: 'Invalid user data' };
  }

  const config = LEVEL_CONFIG[user.level];
  if (!config) {
    return { valid: false, reason: 'Invalid level' };
  }

  if (!isIncomeBlocked(user)) {
    return { valid: false, reason: 'User is not blocked' };
  }

  const requiredPayment = getRequiredPaymentForUnblock(user);

  if (!requiredPayment || requiredPayment.type !== 'upgrade') {
    return { valid: false, reason: 'Upgrade payment not required at this point' };
  }

  return { valid: true, amount: requiredPayment.amount };
};

// CommonJS exports for backend
module.exports = {
  LEVEL_CONFIG,
  LEVEL_ORDER,
  isIncomeBlocked,
  getCurrentBlockPoint,
  getRequiredPaymentForUnblock,
  getTotalHelpsByLevel,
  getAmountByLevel,
  getNextLevel,
  getBlockPointsByLevel,
  getUpgradeAmount,
  getSponsorPaymentAmount,
  getLevelIndex,
  isMaxLevel,
  validateLevelUpgrade,
  validateSponsorPayment,
  validateUpgradePayment
};



