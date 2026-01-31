// filepath: c:\Users\dell\hh\src\components\common\PaymentJourneyMotion.jsx
import React, { useEffect, useState, useRef } from 'react';
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
  const [currentScene, setCurrentScene] = useState(SCENES.CONGRATULATION);
  const [starPayments, setStarPayments] = useState([]);
  const [showOverlay, setShowOverlay] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const soundPlayedRef = useRef(false);

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

  // Play success sound once when overlay opens (prevents replay on re-render)
  useEffect(() => {
    if (showOverlay && !soundPlayedRef.current) {
      soundPlayedRef.current = true;
      playSuccessSound();
    }
  }, [showOverlay]);

  // Reset sound flag when overlay closes
  useEffect(() => {
    if (!showOverlay) {
      soundPlayedRef.current = false;
    }
  }, [showOverlay]);

  // Play a soft professional success sound using Web Audio API
  const playSuccessSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const now = audioContext.currentTime;
      
      // Create multiple oscillators for a rich "ding" sound
      const osc1 = audioContext.createOscillator();
      const osc2 = audioContext.createOscillator();
      const gain = audioContext.createGain();
      
      // First note (higher pitch)
      osc1.frequency.setValueAtTime(800, now);
      osc1.type = 'sine';
      
      // Second note (lower pitch for harmony)
      osc2.frequency.setValueAtTime(600, now);
      osc2.type = 'sine';
      
      // Set volume envelope (fade out)
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
      
      // Connect and play
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(audioContext.destination);
      
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.8);
      osc2.stop(now + 0.8);
    } catch (error) {
      console.log('Audio context not available or user interaction required');
    }
  };

  const handleIconClick = () => {
    setShowOverlay(true);
    setIsPlaying(true);
    setCurrentScene(SCENES.CONGRATULATION);
  };

  const handleClose = () => {
    setShowOverlay(false);
    setIsPlaying(false);
    setCurrentScene(SCENES.CONGRATULATION);
    setStarPayments([]);
    if (onClose) onClose();
  };

  return (
    <AnimatePresence>
      {showOverlay && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-y-auto"
          onClick={mode === 'fullscreen' ? undefined : handleClose}
        >
          {/* Animated background with gradient accents */}
          <motion.div
            className="absolute inset-0 opacity-25"
            animate={{
              background: [
                "radial-gradient(circle at 20% 50%, rgb(168, 85, 247) 0%, transparent 50%)",
                "radial-gradient(circle at 80% 50%, rgb(59, 130, 246) 0%, transparent 50%)",
                "radial-gradient(circle at 50% 20%, rgb(236, 72, 153) 0%, transparent 50%)",
                "radial-gradient(circle at 50% 80%, rgb(34, 197, 94) 0%, transparent 50%)",
                "radial-gradient(circle at 20% 50%, rgb(168, 85, 247) 0%, transparent 50%)",
              ]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          />

          {/* Close button (icon mode only) */}
          {mode === 'icon' && (
            <motion.button
              className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 bg-white/10 backdrop-blur-sm rounded-full p-2 sm:p-3 text-white hover:bg-white/20 transition-colors"
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
            {/* ──────────────── CONGRATULATION (Dynamic greeting) ──────────────── */}
            {currentScene === SCENES.CONGRATULATION && (
              <motion.div
                key="congratulation"
                className="flex flex-col items-center justify-center min-h-screen px-4 py-8 text-center relative z-10"
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
                  {user?.fullName || "Friend"}, your payment journey has started! 🚀
                </motion.h1>
                <motion.p
                  className="mt-6 text-lg sm:text-xl md:text-2xl text-gray-200"
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.9 }}
                >
                  Welcome to Helping Hands Foundation
                </motion.p>
                <motion.div
                  className="mt-8 flex flex-wrap justify-center gap-3 sm:gap-4"
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.3 }}
                >
                  {['✓ Easy Payment', '✓ Quick Approval', '✓ Instant Credits'].map((item, i) => (
                    <motion.span
                      key={i}
                      className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-400/50 text-gray-100 text-sm sm:text-base font-medium backdrop-blur-sm"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 1.5 + i * 0.2 }}
                    >
                      {item}
                    </motion.span>
                  ))}
                </motion.div>
              </motion.div>
            )}

            {/* ──────────────── INTRO ──────────────── */}
            {currentScene === SCENES.INTRO && (
              <motion.div
                key="intro"
                className="flex flex-col items-center justify-center min-h-screen px-4 py-8 text-center relative z-10"
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
                  Payment Journey
                </motion.h1>
                <motion.p
                  className="mt-6 text-3xl sm:text-4xl text-gray-200 font-light"
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  Explained
                </motion.p>
                <motion.div
                  className="mt-10 flex gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.4 }}
                >
                  {[1, 2, 3, 4, 5].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-400"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ delay: i * 0.15, duration: 1.5, repeat: Infinity }}
                    />
                  ))}
                </motion.div>
              </motion.div>
            )}

            {/* ──────────────── LEVEL SCENES (unified) ──────────────── */}
            {['star_level','silver_level','gold_level','platinum_level','diamond_level'].includes(currentScene) && (() => {
              const levelKey = currentScene.replace('_level', '');
              const level = LEVELS.find(l => l.key === levelKey);
              if (!level) return null;

              const isStar = level.key === 'star';
              const levelIndex = LEVELS.findIndex(l => l.key === levelKey);

              return (
                <motion.div
                  key={currentScene}
                  className="flex flex-col items-center justify-center min-h-screen px-4 py-10 text-center relative z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Level indicator */}
                  <motion.div
                    className="flex gap-2 mb-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {LEVELS.map((l, idx) => (
                      <motion.div
                        key={l.key}
                        className={`h-1 rounded-full transition-all ${
                          idx === levelIndex ? 'w-8 bg-gradient-to-r from-purple-400 to-pink-400' : 'w-2 bg-gray-600'
                        }`}
                        animate={{ width: idx === levelIndex ? 32 : 8 }}
                      />
                    ))}
                  </motion.div>

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
                    {level.title.replace(' Level', '')} {level.key === 'star' ? '⭐' : level.key === 'diamond' ? '👑' : '📊'}
                  </motion.h2>

                  <motion.div
                    className="mt-4 text-xl sm:text-2xl text-gray-200"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <span className="font-semibold">₹{level.amount.toLocaleString()}</span>
                    <span className="text-gray-400 mx-2">from</span>
                    <span className="font-semibold">{level.users} users</span>
                  </motion.div>

                  {/* ─── Flow step indicator ─── */}
                  <motion.div
                    className="mt-6 flex items-center justify-center gap-2 text-sm sm:text-base text-gray-300"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    <span className="text-gray-500">Step {levelIndex + 1} of 5</span>
                  </motion.div>

                  {/* ─── Payment boxes ─── */}
                  <motion.div
                    className="mt-10 sm:mt-12 w-full max-w-5xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                  >
                    {isStar ? (
                      // Star keeps entrance animation but uses same box style
                      <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                        <AnimatePresence>
                          {starPayments.map((p, i) => (
                            <motion.div
                              key={i}
                              className="px-3 py-2 rounded-lg bg-gradient-to-br from-white/20 to-white/10 text-white text-sm sm:text-base font-medium border border-white/20"
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

                  {/* Total with glow */}
                  <motion.div
                    className="mt-10 sm:mt-12 relative"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 2.2 + (level.users > 20 ? 1 : 0), type: "spring" }}
                  >
                    {/* Glow background */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur-2xl opacity-20"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    
                    {/* Content */}
                    <div className="relative px-6 sm:px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-400/30 backdrop-blur-sm">
                      <div className="text-base sm:text-lg text-gray-300">
                        {level.users} × ₹{level.amount.toLocaleString()}
                      </div>
                      <div className="mt-2 text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                        ₹{level.total.toLocaleString()}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })()}

            {/* ──────────────── FINAL MESSAGE ──────────────── */}
            {currentScene === SCENES.FINAL_MESSAGE && (
              <motion.div
                key="final"
                className="flex flex-col items-center justify-center min-h-screen px-4 py-8 text-center relative z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  animate={{ scale: [1, 1.08, 1], opacity: [0.9, 1, 0.9] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="text-5xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-tight"
                >
                  This Is How
                </motion.div>
                <motion.div
                  className="mt-4 text-4xl sm:text-5xl md:text-6xl text-gray-200 font-light"
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  Your Payments Grow
                </motion.div>
                <motion.p
                  className="mt-8 text-lg sm:text-xl text-gray-400 max-w-2xl"
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.2 }}
                >
                  From Star Level (⭐) to Diamond Level (👑), watch your earnings multiply exponentially through our helping network.
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PaymentJourneyMotion;
