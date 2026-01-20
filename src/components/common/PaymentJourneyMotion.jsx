import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Video scenes
const SCENES = {
  CONGRATULATION: 'congratulation',
  INTRO: 'intro',
  STAR_LEVEL: 'star_level',
  SILVER_LEVEL: 'silver_level',
  GOLD_LEVEL: 'gold_level',
  PLATINUM_LEVEL: 'platinum_level',
  DIAMOND_LEVEL: 'diamond_level',
  FINAL_MESSAGE: 'final_message'
};

// Level data
const LEVELS = [
  { key: "star",     title: "Star Level",     amount: 300,    users: 3,    total: 900      },
  { key: "silver",   title: "Silver Level",   amount: 600,    users: 9,    total: 5400     },
  { key: "gold",     title: "Gold Level",     amount: 2000,   users: 27,   total: 54000    },
  { key: "platinum", title: "Platinum Level", amount: 20000,  users: 81,   total: 1620000  },
  { key: "diamond",  title: "Diamond Level",  amount: 200000, users: 243,  total: 48600000 }
];

// Maximum visible boxes for mobile-friendly rendering
const MAX_VISIBLE_BOXES = 12;

// Reusable small payment box renderer (used by ALL levels)
function renderAmountBoxes(amount, users) {
  const visible = Math.min(users, MAX_VISIBLE_BOXES);
  const remaining = users - visible;

  return (
    <div className="flex flex-wrap justify-center gap-2 px-3">
      {Array.from({ length: visible }).map((_, i) => (
        <motion.div
          key={i}
          className="px-2 py-1 rounded-md bg-white/10 text-white text-[10px] sm:text-xs font-medium"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.025, duration: 0.4 }}
        >
          ₹{amount.toLocaleString()}
        </motion.div>
      ))}
      {remaining > 0 && (
        <motion.div
          className="px-2 py-1 rounded-md bg-white/20 text-white text-[10px] sm:text-xs font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: visible * 0.025 + 0.3 }}
        >
          +{remaining} more
        </motion.div>
      )}
    </div>
  );
}

const PaymentJourneyMotion = ({ mode = 'fullscreen', onClose, user }) => {
  const [currentScene, setCurrentScene] = useState(SCENES.INTRO);
  const [starPayments, setStarPayments] = useState([]); // only used for star entrance animation
  const [showOverlay, setShowOverlay] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Scene transition timing
  useEffect(() => {
    if (!showOverlay || !isPlaying) return;

    const timers = [
      setTimeout(() => setCurrentScene(SCENES.INTRO),          4500),
      setTimeout(() => setCurrentScene(SCENES.STAR_LEVEL),     9500),
      setTimeout(() => setCurrentScene(SCENES.SILVER_LEVEL),   19500),
      setTimeout(() => setCurrentScene(SCENES.GOLD_LEVEL),     29500),
      setTimeout(() => setCurrentScene(SCENES.PLATINUM_LEVEL), 39500),
      setTimeout(() => setCurrentScene(SCENES.DIAMOND_LEVEL),  54500),
      setTimeout(() => setCurrentScene(SCENES.FINAL_MESSAGE),  64500),
      setTimeout(() => {
        setCurrentScene(SCENES.CONGRATULATION);
        setStarPayments([]);
      }, 69500),
    ];

    return () => timers.forEach(clearTimeout);
  }, [showOverlay, isPlaying]);

  // Star level entrance animation (kept as special case)
  useEffect(() => {
    if (currentScene !== SCENES.STAR_LEVEL || !showOverlay || !isPlaying) {
      setStarPayments([]);
      return;
    }

    const timers = [
      setTimeout(() => setStarPayments(['₹300']), 600),
      setTimeout(() => setStarPayments(['₹300','₹300']), 2200),
      setTimeout(() => setStarPayments(['₹300','₹300','₹300']), 3800),
    ];

    return () => timers.forEach(clearTimeout);
  }, [currentScene, showOverlay, isPlaying]);

  const handleIconClick = () => {
    setShowOverlay(true);
    setIsPlaying(true);
    setCurrentScene(SCENES.CONGRATULATION);
  };

  const handleClose = () => {
    setShowOverlay(false);
    setIsPlaying(false);
    setCurrentScene(SCENES.INTRO);
    setStarPayments([]);
    if (onClose) onClose();
  };

  // Icon mode — floating button
  if (mode === 'icon' && !showOverlay) {
    return (
      <motion.div
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 cursor-pointer"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleIconClick}
      >
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full p-3 sm:p-4 shadow-2xl border-2 border-white">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
      </motion.div>
    );
  }

  // ────────────────────────────────────────────────
  //  Main overlay content
  // ────────────────────────────────────────────────
  return (
    <AnimatePresence>
      {showOverlay && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onClick={mode === 'fullscreen' ? undefined : handleClose}
        >
          {/* Animated background */}
          <motion.div
            className="absolute inset-0 opacity-20"
            animate={{
              background: [
                "radial-gradient(circle at 20% 50%, purple 0%, transparent 50%)",
                "radial-gradient(circle at 80% 50%, blue 0%, transparent 50%)",
                "radial-gradient(circle at 50% 20%, pink 0%, transparent 50%)",
                "radial-gradient(circle at 50% 80%, green 0%, transparent 50%)",
                "radial-gradient(circle at 20% 50%, purple 0%, transparent 50%)",
              ]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          />

          {/* Close button (icon mode) */}
          {mode === 'icon' && (
            <motion.button
              className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 bg-white/10 backdrop-blur-sm rounded-full p-2 sm:p-3 text-white hover:bg-white/20"
              onClick={(e) => { e.stopPropagation(); handleClose(); }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
          )}

          <AnimatePresence mode="wait">
            {/* ──────────────── CONGRATULATION ──────────────── */}
            {currentScene === SCENES.CONGRATULATION && (
              <motion.div
                key="congratulation"
                className="flex flex-col items-center justify-center min-h-screen px-4 py-8 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.h1
                  className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight"
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  Congratulations {user?.fullName?.split(" ")[0] || "Friend"} 🎉
                </motion.h1>
                <motion.p
                  className="mt-6 text-xl sm:text-2xl text-gray-200"
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.9 }}
                >
                  Welcome to Helping Hands Foundation
                </motion.p>
                <motion.p
                  className="mt-4 text-lg text-gray-400"
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.3 }}
                >
                  Your earning journey starts now
                </motion.p>
              </motion.div>
            )}

            {/* ──────────────── INTRO ──────────────── */}
            {currentScene === SCENES.INTRO && (
              <motion.div
                key="intro"
                className="flex flex-col items-center justify-center min-h-screen px-4 py-8 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.h1
                  className="text-5xl sm:text-6xl md:text-7xl font-black text-white"
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 1.4 }}
                >
                  Complete Payment Journey
                </motion.h1>
                <motion.p
                  className="mt-6 text-3xl sm:text-4xl text-gray-200 font-light"
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  Explained
                </motion.p>
              </motion.div>
            )}

            {/* ──────────────── LEVEL SCENES (unified) ──────────────── */}
            {['star_level','silver_level','gold_level','platinum_level','diamond_level'].includes(currentScene) && (() => {
              const levelKey = currentScene.replace('_level', '');
              const level = LEVELS.find(l => l.key === levelKey);
              if (!level) return null;

              const isStar = level.key === 'star';

              return (
                <motion.div
                  key={currentScene}
                  className="flex flex-col items-center justify-center min-h-screen px-4 py-10 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.h2
                    className={`text-4xl sm:text-5xl font-bold ${
                      level.key === 'star'     ? 'text-yellow-400' :
                      level.key === 'silver'   ? 'text-gray-300' :
                      level.key === 'gold'     ? 'text-yellow-500' :
                      level.key === 'platinum' ? 'text-slate-300' :
                                                 'text-blue-400'
                    }`}
                    initial={{ y: -30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.7 }}
                  >
                    {level.title.replace(' Level', '')} {level.key === 'star' ? '⭐' : level.key === 'diamond' ? '👑' : 'Level'}
                  </motion.h2>

                  <motion.div
                    className="mt-6 text-xl sm:text-2xl text-gray-200"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    ₹{level.amount.toLocaleString()} from {level.users} users
                  </motion.div>

                  {/* ─── Payment boxes ─── */}
                  <motion.div
                    className="mt-8 sm:mt-10 w-full max-w-5xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.4 }}
                  >
                    {isStar ? (
                      // Star keeps entrance animation but uses same box style
                      <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                        <AnimatePresence>
                          {starPayments.map((p, i) => (
                            <motion.div
                              key={i}
                              className="px-3 py-2 rounded-lg bg-white/10 text-white text-sm sm:text-base font-medium"
                              initial={{ x: 60, opacity: 0, scale: 0.7 }}
                              animate={{ x: 0, opacity: 1, scale: 1 }}
                              exit={{ x: -60, opacity: 0, scale: 0.7 }}
                              transition={{ type: "spring", stiffness: 180, damping: 18 }}
                            >
                              {p}
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    ) : (
                      renderAmountBoxes(level.amount, level.users)
                    )}
                  </motion.div>

                  {/* Total */}
                  <motion.div
                    className="mt-8 sm:mt-10"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 2.2 + (level.users > 20 ? 1 : 0), type: "spring" }}
                  >
                    <div className="text-lg sm:text-xl text-gray-300">
                      {level.users} × ₹{level.amount.toLocaleString()}
                    </div>
                    <div className="mt-2 text-3xl sm:text-4xl md:text-5xl font-bold text-green-400">
                      ₹{level.total.toLocaleString()}
                    </div>
                  </motion.div>
                </motion.div>
              );
            })()}

            {/* ──────────────── FINAL MESSAGE ──────────────── */}
            {currentScene === SCENES.FINAL_MESSAGE && (
              <motion.div
                key="final"
                className="flex flex-col items-center justify-center min-h-screen px-4 py-8 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  animate={{ scale: [1, 1.08, 1], opacity: [0.9, 1, 0.9] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="text-5xl sm:text-6xl md:text-7xl font-black text-white tracking-tight"
                >
                  This Is How
                </motion.div>
                <motion.div
                  className="mt-4 text-4xl sm:text-5xl text-gray-200 font-light"
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  Your Payments Will Grow
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PaymentJourneyMotion;