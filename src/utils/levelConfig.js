const levelConfig = {
  Star: { receiveCount: 3, upgradeAmount: 600, next: "Silver" },
  Silver: { receiveCount: 9, upgradeAmount: 2000, next: "Gold" },
  Gold: { receiveCount: 9, upgradeAmount: 20000, next: "Platinum" },
  Platinum: { receiveCount: 9, upgradeAmount: 200000, next: "Diamond" },
};

const checkUpgrade = (user) => {
  if (!user || !user.level || !levelConfig[user.level]) {
    return false; // Cannot check upgrade if user or level is undefined
  }
  const config = levelConfig[user.level];
  return user.totalReceived >= config.receiveCount && !user.nextLevelPaymentDone;
};

export { levelConfig, checkUpgrade };

export const LEVEL_HELP_LIMIT = {
  1: 3,
  2: 5,
  3: 8,
  4: 12,
  5: 15
};

export const getRequiredHelpsByLevel = (level) => level * 2;