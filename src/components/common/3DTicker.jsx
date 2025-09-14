import React from 'react';
import { motion } from 'framer-motion';

const ThreeDTicker = ({ text }) => {
  const displayText = Array.isArray(text) ? text.join('   •   ') : text;
  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1E3A8A] via-[#4338CA] to-[#6D28D9] shadow-[0_20px_60px_-15px_rgba(94,104,255,0.6)] border border-blue-200/30"
      style={{
        height: '3.2rem',
        perspective: '1400px',
        WebkitPerspective: '1400px',
        padding: '1.8rem',
        display: 'flex',
        alignItems: 'center',
        transformStyle: 'preserve-3d',
        boxShadow: '0 20px 60px -15px rgba(94,104,255,0.6), 0 1.5px 0 0 #fff',
        border: '1.5px solid rgba(147,197,253,0.18)',
      }}
      aria-label={displayText}
    >
      {/* Glassmorphism overlay with more opacity */}
      <div className="absolute inset-0 bg-white/20 backdrop-blur-md rounded-2xl pointer-events-none border border-white/10" />

      {/* Scrolling and floating Text */}
      <motion.div
        className="whitespace-nowrap flex items-center font-semibold"
        style={{
          transform: 'rotateY(-18deg) translateZ(32px)',
          color: 'white',
          fontSize: 'clamp(1rem, 2vw, 1.2rem)',
          textShadow: `
            0 2px 8px rgba(0,0,0,0.25),
            0 0 12px rgba(147,197,253,0.5),
            1px 1px 0 rgba(255,255,255,0.13)
          `,
        }}
        animate={{
          x: ['100%', '-100%'],
          y: [0, -6, 0, 6, 0], // floating effect
        }}
        transition={{
          x: {
            repeat: Infinity,
            duration: 15,
            ease: 'linear',
          },
          y: {
            repeat: Infinity,
            duration: 3.5,
            ease: 'easeInOut',
          },
        }}
      >
        {displayText}
        <span className="mx-8 opacity-50">•</span>
        {displayText}
      </motion.div>

      {/* Reflection (faint, blurred, flipped) */}
      <motion.div
        className="absolute left-0 right-0 pointer-events-none"
        style={{
          bottom: '-1.2rem',
          height: '2.2rem',
          filter: 'blur(6px)',
          opacity: 0.18,
          transform: 'scaleY(-1) rotateY(-18deg) translateZ(32px)',
        }}
        aria-hidden
        animate={{
          x: ['100%', '-100%'],
          y: [0, 6, 0, -6, 0], // mirror float
        }}
        transition={{
          x: {
            repeat: Infinity,
            duration: 15,
            ease: 'linear',
          },
          y: {
            repeat: Infinity,
            duration: 3.5,
            ease: 'easeInOut',
          },
        }}
      >
        <span className="whitespace-nowrap font-semibold select-none" style={{
          fontSize: 'clamp(1rem, 2vw, 1.2rem)',
        }}>{displayText} <span className="mx-8 opacity-50">•</span> {displayText}</span>
      </motion.div>

      {/* Inner Glow (depth effect) */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          boxShadow: 'inset 0 0 38px rgba(80,80,180,0.28)',
        }}
      />
    </div>
  );
};

export default ThreeDTicker;