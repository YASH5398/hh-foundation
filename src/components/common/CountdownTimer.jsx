import React, { useState, useEffect } from 'react';
import { FiClock, FiAlertTriangle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const CountdownTimer = ({ targetDate, onExpire, label = "Time Remaining" }) => {
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
    const [isExpired, setIsExpired] = useState(false);

    function calculateTimeLeft() {
        const difference = new Date(targetDate) - new Date();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                hours: Math.floor(difference / (1000 * 60 * 60)),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        } else {
            timeLeft = { hours: 0, minutes: 0, seconds: 0 };
        }

        return timeLeft;
    }

    useEffect(() => {
        const timer = setInterval(() => {
            const newTimeLeft = calculateTimeLeft();
            setTimeLeft(newTimeLeft);

            if (newTimeLeft.hours === 0 && newTimeLeft.minutes === 0 && newTimeLeft.seconds === 0) {
                if (!isExpired) {
                    setIsExpired(true);
                    if (onExpire) onExpire();
                }
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate, isExpired]);

    const formatNumber = (num) => num.toString().padStart(2, '0');

    const isLowTime = timeLeft.hours === 0 && timeLeft.minutes < 60;
    const isCriticalTime = timeLeft.hours === 0 && timeLeft.minutes < 15;

    return (
        <div className={`p-4 rounded-xl border transition-all duration-300 ${isCriticalTime
                ? 'bg-red-50 border-red-200 text-red-700 shadow-sm shadow-red-100'
                : isLowTime
                    ? 'bg-orange-50 border-orange-200 text-orange-700'
                    : 'bg-blue-50 border-blue-200 text-blue-700'
            }`}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <FiClock className={`w-4 h-4 ${isCriticalTime ? 'animate-pulse' : ''}`} />
                    <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
                </div>
                {isCriticalTime && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-1 bg-red-600 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase"
                    >
                        <FiAlertTriangle className="w-3 h-3" />
                        Urgent
                    </motion.div>
                )}
            </div>

            <div className="flex items-center gap-1.5 font-mono text-2xl font-black">
                <div className="flex flex-col items-center">
                    <span>{formatNumber(timeLeft.hours)}</span>
                </div>
                <span className="opacity-30 -mt-1">:</span>
                <div className="flex flex-col items-center">
                    <span>{formatNumber(timeLeft.minutes)}</span>
                </div>
                <span className="opacity-30 -mt-1">:</span>
                <div className="flex flex-col items-center">
                    <span>{formatNumber(timeLeft.seconds)}</span>
                </div>
            </div>

            <div className="mt-2 text-[10px] font-medium opacity-70">
                {isExpired ? 'Countdown expired' : `Complete process before timer hits 00:00:00`}
            </div>
        </div>
    );
};

export default CountdownTimer;
