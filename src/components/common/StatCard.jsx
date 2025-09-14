import React from 'react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import './StatCard.css';

const StatCard = ({
  title,
  value,
  icon: Icon,
  isRupee,
  iconClass = '',
  valueClass = '',
  labelClass = '',
  className = ''
}) => {
  const displayValue = isRupee
    ? (typeof value === 'number'
        ? value.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })
        : value)
    : value;

  return (
    <motion.div
      className={`relative min-h-[210px] rounded-2xl 
        bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 
        border border-white/10 p-6 text-white text-center 
        shadow-[0_12px_24px_rgba(0,0,0,0.35)] hover:shadow-[0_16px_32px_rgba(0,0,0,0.5)] 
        hover:-translate-y-1.5 hover:scale-[1.015] transition-all duration-300 ease-out
        backdrop-blur-sm overflow-hidden flex flex-col items-center justify-center
        cursor-pointer ${className}`}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >

      {/* Diagonal Shine from Top-Right to Bottom-Left */}
      <div className="absolute inset-0 z-[1] pointer-events-none">
        <div className="absolute -top-1/3 -right-1/3 w-[200%] h-[200%] transform rotate-[-45deg] bg-gradient-to-r from-white/5 via-white/20 to-white/5 blur-2xl opacity-20" />
      </div>

      {/* Center Shine Line */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-3/4 h-1/4 bg-white/20 blur-md rounded-full opacity-30 z-[1] pointer-events-none" />

      {/* Inner Inset Shine for Glass Effect */}
      <div className="absolute inset-0 rounded-2xl shadow-[inset_0_-8px_12px_rgba(255,255,255,0.08)] z-[2]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-3 h-full w-full">
        {Icon && (
          <div className="bg-white/10 p-2 sm:p-3 rounded-full shadow-inner backdrop-blur-md">
            <Icon className={iconClass || "w-7 h-7 sm:w-8 sm:h-8 text-white"} />
          </div>
        )}
        <p className={labelClass || "text-sm sm:text-base font-semibold text-white/90 truncate"}>
          {title}
        </p>
        <h3 className={valueClass || "text-2xl sm:text-3xl font-extrabold text-white drop-shadow-sm truncate"}>
          {isRupee ? displayValue : <CountUp end={value} duration={2.5} separator="," />}
        </h3>
      </div>
    </motion.div>
  );
};

export default StatCard;
