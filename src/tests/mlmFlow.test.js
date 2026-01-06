// Comprehensive MLM Flow Tests
// Tests FINAL MLM LOGIC implementation

const {
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
} = require('../shared/mlmCore');

describe('MLM Core Logic Tests', () => {

  // Test STAR Level Flow
  describe('STAR Level', () => {
    const starUser = { level: 'Star', helpReceived: 0 };

    test('should start with helpReceived = 0', () => {
      expect(starUser.helpReceived).toBe(0);
      expect(isIncomeBlocked(starUser)).toBe(false);
    });

    test('should not be blocked before 3 receives', () => {
      const user = { ...starUser, helpReceived: 2 };
      expect(isIncomeBlocked(user)).toBe(false);
      expect(getRequiredPaymentForUnblock(user)).toBe(null);
    });

    test('should block income at helpReceived = 3', () => {
      const user = { ...starUser, helpReceived: 3 };
      expect(isIncomeBlocked(user)).toBe(true);
      const requiredPayment = getRequiredPaymentForUnblock(user);
      expect(requiredPayment).toEqual({
        type: 'upgrade',
        amount: 600,
        required: true
      });
    });

    test('should have correct level config', () => {
      expect(LEVEL_CONFIG.Star.totalHelps).toBe(3);
      expect(LEVEL_CONFIG.Star.amount).toBe(300);
      expect(LEVEL_CONFIG.Star.blockPoints).toEqual([3]);
      expect(LEVEL_CONFIG.Star.upgradeAmount).toBe(600);
      expect(LEVEL_CONFIG.Star.sponsorPayment).toBe(null);
    });
  });

  // Test SILVER Level Flow
  describe('SILVER Level', () => {
    const silverUser = { level: 'Silver', helpReceived: 0 };

    test('should start with helpReceived = 0', () => {
      expect(silverUser.helpReceived).toBe(0);
      expect(isIncomeBlocked(silverUser)).toBe(false);
    });

    test('should not be blocked before 4 receives', () => {
      const user = { ...silverUser, helpReceived: 3 };
      expect(isIncomeBlocked(user)).toBe(false);
      expect(getRequiredPaymentForUnblock(user)).toBe(null);
    });

    test('should block income at helpReceived = 4 (upgrade required)', () => {
      const user = { ...silverUser, helpReceived: 4 };
      expect(isIncomeBlocked(user)).toBe(true);
      const requiredPayment = getRequiredPaymentForUnblock(user);
      expect(requiredPayment).toEqual({
        type: 'upgrade',
        amount: 1800,
        required: true
      });
    });

    test('should block income at helpReceived = 7 (sponsor required)', () => {
      const user = { ...silverUser, helpReceived: 7 };
      expect(isIncomeBlocked(user)).toBe(true);
      const requiredPayment = getRequiredPaymentForUnblock(user);
      expect(requiredPayment).toEqual({
        type: 'sponsor',
        amount: 1200,
        required: true
      });
    });

    test('should not auto-upgrade after 9 receives', () => {
      const user = { ...silverUser, helpReceived: 9 };
      expect(isIncomeBlocked(user)).toBe(false); // Should not be blocked at completion
      expect(getRequiredPaymentForUnblock(user)).toBe(null);
    });

    test('should have correct level config', () => {
      expect(LEVEL_CONFIG.Silver.totalHelps).toBe(9);
      expect(LEVEL_CONFIG.Silver.amount).toBe(600);
      expect(LEVEL_CONFIG.Silver.blockPoints).toEqual([4, 7]);
      expect(LEVEL_CONFIG.Silver.upgradeAmount).toBe(1800);
      expect(LEVEL_CONFIG.Silver.sponsorPayment).toBe(1200);
    });
  });

  // Test GOLD Level Flow
  describe('GOLD Level', () => {
    const goldUser = { level: 'Gold', helpReceived: 0 };

    test('should block income at helpReceived = 11 (upgrade required)', () => {
      const user = { ...goldUser, helpReceived: 11 };
      expect(isIncomeBlocked(user)).toBe(true);
      const requiredPayment = getRequiredPaymentForUnblock(user);
      expect(requiredPayment).toEqual({
        type: 'upgrade',
        amount: 20000,
        required: true
      });
    });

    test('should block income at helpReceived = 25 (sponsor required)', () => {
      const user = { ...goldUser, helpReceived: 25 };
      expect(isIncomeBlocked(user)).toBe(true);
      const requiredPayment = getRequiredPaymentForUnblock(user);
      expect(requiredPayment).toEqual({
        type: 'sponsor',
        amount: 4000,
        required: true
      });
    });

    test('should have correct level config', () => {
      expect(LEVEL_CONFIG.Gold.totalHelps).toBe(27);
      expect(LEVEL_CONFIG.Gold.amount).toBe(2000);
      expect(LEVEL_CONFIG.Gold.blockPoints).toEqual([11, 25]);
      expect(LEVEL_CONFIG.Gold.upgradeAmount).toBe(20000);
      expect(LEVEL_CONFIG.Gold.sponsorPayment).toBe(4000);
    });
  });

  // Test PLATINUM Level Flow
  describe('PLATINUM Level', () => {
    const platinumUser = { level: 'Platinum', helpReceived: 0 };

    test('should block income at helpReceived = 11 (upgrade required)', () => {
      const user = { ...platinumUser, helpReceived: 11 };
      expect(isIncomeBlocked(user)).toBe(true);
      const requiredPayment = getRequiredPaymentForUnblock(user);
      expect(requiredPayment).toEqual({
        type: 'upgrade',
        amount: 200000,
        required: true
      });
    });

    test('should block income at helpReceived = 80 (sponsor required)', () => {
      const user = { ...platinumUser, helpReceived: 80 };
      expect(isIncomeBlocked(user)).toBe(true);
      const requiredPayment = getRequiredPaymentForUnblock(user);
      expect(requiredPayment).toEqual({
        type: 'sponsor',
        amount: 40000,
        required: true
      });
    });

    test('should have correct level config', () => {
      expect(LEVEL_CONFIG.Platinum.totalHelps).toBe(81);
      expect(LEVEL_CONFIG.Platinum.amount).toBe(20000);
      expect(LEVEL_CONFIG.Platinum.blockPoints).toEqual([11, 80]);
      expect(LEVEL_CONFIG.Platinum.upgradeAmount).toBe(200000);
      expect(LEVEL_CONFIG.Platinum.sponsorPayment).toBe(40000);
    });
  });

  // Test DIAMOND Level Flow
  describe('DIAMOND Level', () => {
    const diamondUser = { level: 'Diamond', helpReceived: 0 };

    test('should block income at helpReceived = 242 (sponsor required)', () => {
      const user = { ...diamondUser, helpReceived: 242 };
      expect(isIncomeBlocked(user)).toBe(true);
      const requiredPayment = getRequiredPaymentForUnblock(user);
      expect(requiredPayment).toEqual({
        type: 'sponsor',
        amount: 600000,
        required: true
      });
    });

    test('should be final level', () => {
      expect(isMaxLevel('Diamond')).toBe(true);
      expect(getNextLevel('Diamond')).toBe(null);
      expect(LEVEL_CONFIG.Diamond.upgradeAmount).toBe(null);
    });

    test('should have correct level config', () => {
      expect(LEVEL_CONFIG.Diamond.totalHelps).toBe(243);
      expect(LEVEL_CONFIG.Diamond.amount).toBe(200000);
      expect(LEVEL_CONFIG.Diamond.blockPoints).toEqual([242]);
      expect(LEVEL_CONFIG.Diamond.upgradeAmount).toBe(null);
      expect(LEVEL_CONFIG.Diamond.sponsorPayment).toBe(600000);
    });
  });

  // Test Payment Validation
  describe('Payment Validation', () => {
    test('should validate upgrade payment correctly', () => {
      const blockedSilverUser = { level: 'Silver', helpReceived: 4 };
      const validation = validateUpgradePayment(blockedSilverUser);
      expect(validation.valid).toBe(true);
      expect(validation.amount).toBe(1800);
    });

    test('should reject upgrade payment when not blocked', () => {
      const unblockedUser = { level: 'Silver', helpReceived: 2 };
      const validation = validateUpgradePayment(unblockedUser);
      expect(validation.valid).toBe(false);
      expect(validation.reason).toBe('User is not blocked');
    });

    test('should validate sponsor payment correctly', () => {
      const sponsorId = 'sponsor123';
      const blockedSilverUser = { level: 'Silver', helpReceived: 7 };
      const validation = validateSponsorPayment(blockedSilverUser, sponsorId);
      expect(validation.valid).toBe(true);
      expect(validation.amount).toBe(1200);
    });

    test('should reject sponsor payment without sponsor ID', () => {
      const blockedUser = { level: 'Silver', helpReceived: 7 };
      const validation = validateSponsorPayment(blockedUser, null);
      expect(validation.valid).toBe(false);
      expect(validation.reason).toBe('Invalid user or sponsor data');
    });
  });

  // Test Level Progression
  describe('Level Progression', () => {
    test('should have correct level order', () => {
      expect(LEVEL_ORDER).toEqual(['Star', 'Silver', 'Gold', 'Platinum', 'Diamond']);
    });

    test('should validate level upgrades correctly', () => {
      const validation = validateLevelUpgrade({ level: 'Star' }, 'Silver');
      expect(validation.valid).toBe(true);

      const invalidValidation = validateLevelUpgrade({ level: 'Star' }, 'Gold');
      expect(invalidValidation.valid).toBe(false);
      expect(invalidValidation.reason).toBe('Invalid level progression');
    });

    test('should get correct next levels', () => {
      expect(getNextLevel('Star')).toBe('Silver');
      expect(getNextLevel('Silver')).toBe('Gold');
      expect(getNextLevel('Gold')).toBe('Platinum');
      expect(getNextLevel('Platinum')).toBe('Diamond');
      expect(getNextLevel('Diamond')).toBe(null);
    });
  });

  // Test Helper Functions
  describe('Helper Functions', () => {
    test('should get correct total helps by level', () => {
      expect(getTotalHelpsByLevel('Star')).toBe(3);
      expect(getTotalHelpsByLevel('Silver')).toBe(9);
      expect(getTotalHelpsByLevel('Gold')).toBe(27);
      expect(getTotalHelpsByLevel('Platinum')).toBe(81);
      expect(getTotalHelpsByLevel('Diamond')).toBe(243);
    });

    test('should get correct amounts by level', () => {
      expect(getAmountByLevel('Star')).toBe(300);
      expect(getAmountByLevel('Silver')).toBe(600);
      expect(getAmountByLevel('Gold')).toBe(2000);
      expect(getAmountByLevel('Platinum')).toBe(20000);
      expect(getAmountByLevel('Diamond')).toBe(200000);
    });

    test('should get correct block points by level', () => {
      expect(getBlockPointsByLevel('Star')).toEqual([3]);
      expect(getBlockPointsByLevel('Silver')).toEqual([4, 7]);
      expect(getBlockPointsByLevel('Gold')).toEqual([11, 25]);
      expect(getBlockPointsByLevel('Platinum')).toEqual([11, 80]);
      expect(getBlockPointsByLevel('Diamond')).toEqual([242]);
    });
  });

  // Test Edge Cases
  describe('Edge Cases', () => {
    test('should handle invalid levels gracefully', () => {
      const invalidUser = { level: 'Invalid', helpReceived: 1 };
      expect(isIncomeBlocked(invalidUser)).toBe(false);
      expect(getRequiredPaymentForUnblock(invalidUser)).toBe(null);
    });

    test('should handle missing user data', () => {
      expect(isIncomeBlocked(null)).toBe(false);
      expect(isIncomeBlocked({})).toBe(false);
      expect(getRequiredPaymentForUnblock(null)).toBe(null);
    });

    test('should not auto-upgrade at any point', () => {
      // Test that completing a level doesn't automatically upgrade
      const completedSilverUser = { level: 'Silver', helpReceived: 9 };
      expect(isIncomeBlocked(completedSilverUser)).toBe(false);
      // Should not have any required payment at completion
      expect(getRequiredPaymentForUnblock(completedSilverUser)).toBe(null);
    });
  });

  // Test Idempotency (duplicate confirmations should not double increment)
  describe('Idempotency Tests', () => {
    test('should handle helpReceived increments correctly', () => {
      // This would be tested in integration tests with actual database
      // Here we just verify the logic doesn't break with high values
      const highValueUser = { level: 'Silver', helpReceived: 8 };
      expect(isIncomeBlocked(highValueUser)).toBe(false);

      const maxValueUser = { level: 'Silver', helpReceived: 9 };
      expect(isIncomeBlocked(maxValueUser)).toBe(false);
    });
  });
});