import React, { useState, useEffect, useCallback, memo } from 'react';
import { FiClock, FiAlertTriangle } from 'react-icons/fi';

const CountdownTimer = memo(({ targetDate, onExpire, label = "Time Remaining", compact = false }) => {
    const calculateTimeLeft = useCallback(() => {
        const difference = new Date(targetDate) - new Date();
        if (difference <= 0) return { hours: 0, minutes: 0, seconds: 0 };

        return {
            hours: Math.floor(difference / (1000 * 60 * 60)),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60),
        };
    }, [targetDate]);

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
    const [isExpired, setIsExpired] = useState(false);
    const hasExpiredRef = React.useRef(false);

    useEffect(() => {
        // Initial check in case targetDate is already past
        const initialDiff = new Date(targetDate) - new Date();
        if (initialDiff <= 0 && !hasExpiredRef.current) {
            hasExpiredRef.current = true;
            setIsExpired(true);
            if (onExpire) {
                console.log('[CountdownTimer] Target date already past, triggering onExpire');
                onExpire();
            }
            return;
        }

        const timer = setInterval(() => {
            const difference = new Date(targetDate) - new Date();

            if (difference <= 0) {
                setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
                if (!hasExpiredRef.current) {
                    hasExpiredRef.current = true;
                    setIsExpired(true);
                    console.log('[CountdownTimer] Timer hit zero, triggering onExpire once');
                    if (onExpire) onExpire();
                }
                clearInterval(timer);
            } else {
                setTimeLeft({
                    hours: Math.floor(difference / (1000 * 60 * 60)),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                });
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate, onExpire]);

    const formatNumber = (num) => num.toString().padStart(2, '0');

    const isCriticalTime = timeLeft.hours === 0 && timeLeft.minutes < 15;
    const isLowTime = timeLeft.hours === 0 && timeLeft.minutes < 60;

    if (compact) {
        return (
            <span className={`font-mono font-bold ${isCriticalTime ? 'text-red-600' : 'text-slate-600'}`}>
                {formatNumber(timeLeft.hours)}:{formatNumber(timeLeft.minutes)}:{formatNumber(timeLeft.seconds)}
            </span>
        );
    }

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
                    <div className="flex items-center gap-1 bg-red-600 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase">
                        <FiAlertTriangle className="w-3 h-3" />
                        Urgent
                    </div>
                )}
            </div>

            <div className="flex items-center gap-1.5 font-mono text-2xl font-black">
                <span>{formatNumber(timeLeft.hours)}</span>
                <span className="opacity-30">:</span>
                <span>{formatNumber(timeLeft.minutes)}</span>
                <span className="opacity-30">:</span>
                <span>{formatNumber(timeLeft.seconds)}</span>
            </div>

            <div className="mt-2 text-[10px] font-medium opacity-70">
                {isExpired ? 'Countdown expired' : `Complete process before timer hits 00:00:00`}
            </div>
        </div>
    );
});

CountdownTimer.displayName = 'CountdownTimer';

export default CountdownTimer;

