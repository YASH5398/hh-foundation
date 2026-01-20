/**
 * CENTRALIZED AMOUNT CALCULATION UTILITIES
 * NO HARDCODED AMOUNTS ALLOWED - Use these functions everywhere
 */

import { LEVEL_CONFIG } from '../shared/mlmCore';

/**
 * Get the exact amount for a user's level
 * @param {string} level - User level ('Star', 'Silver', 'Gold', 'Platinum', 'Diamond')
 * @returns {number} Amount in rupees
 */
export const getAmountByLevel = (level) => {
  if (!level || !LEVEL_CONFIG[level]) {
    console.warn(`Invalid level: ${level}, defaulting to Star level`);
    return LEVEL_CONFIG.Star.amount;
  }
  return LEVEL_CONFIG[level].amount;
};

/**
 * Get the total possible earnings for a level
 * @param {string} level - User level
 * @returns {number} Total earnings in rupees
 */
export const getTotalEarningsByLevel = (level) => {
  if (!level || !LEVEL_CONFIG[level]) {
    return LEVEL_CONFIG.Star.totalHelps * LEVEL_CONFIG.Star.amount;
  }
  return LEVEL_CONFIG[level].totalHelps * LEVEL_CONFIG[level].amount;
};

/**
 * Get the help limit for a level (maximum helps a user can receive)
 * @param {string} level - User level
 * @returns {number} Maximum help count
 */
export const getHelpLimitByLevel = (level) => {
  if (!level || !LEVEL_CONFIG[level]) {
    return LEVEL_CONFIG.Star.helpLimit;
  }
  return LEVEL_CONFIG[level].helpLimit;
};

/**
 * Validate that an amount matches the expected level amount
 * @param {string} level - User level
 * @param {number} amount - Amount to validate
 * @returns {boolean} True if amount matches level
 */
export const validateAmountForLevel = (level, amount) => {
  const expectedAmount = getAmountByLevel(level);
  return amount === expectedAmount;
};

/**
 * Format amount as currency string
 * @param {number} amount - Amount in rupees
 * @returns {string} Formatted currency string
 */
export const formatAmount = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '₹0';
  }

  // Format large numbers with commas
  const formatted = amount.toLocaleString('en-IN');
  return `₹${formatted}`;
};

/**
 * Get upgrade amount required for a level
 * @param {string} level - Current level
 * @returns {number|null} Upgrade amount or null if no upgrade possible
 */
export const getUpgradeAmount = (level) => {
  if (!level || !LEVEL_CONFIG[level]) {
    return null;
  }
  return LEVEL_CONFIG[level].upgradeAmount;
};

/**
 * Get sponsor payment amount required for a level
 * @param {string} level - Current level
 * @returns {number|null} Sponsor payment amount or null if not required
 */
export const getSponsorPaymentAmount = (level) => {
  if (!level || !LEVEL_CONFIG[level]) {
    return null;
  }
  return LEVEL_CONFIG[level].sponsorPayment;
};
