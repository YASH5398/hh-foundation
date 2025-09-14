import React from 'react';

// Custom keyframes for left-to-right scrolling
const tickerKeyframes = `
@keyframes ticker-scroll {
  0% { transform: translateX(100%); }
  100% { transform: translateX(-100%); }
}`;

const PersonalizedTicker = ({ userName }) => {
  const message = `👋 Welcome ${userName || 'User'}! | Start your journey by helping just 1 member with ₹300. | In return, you'll receive ₹300 × 3 = ₹900 from others! | Simple. Transparent. Powerful. | Help to grow, grow to help! 💸✨`;

  return (
    <div className="w-full bg-blue-100 border-b-2 border-blue-200 overflow-hidden py-2 px-0 mb-4 relative">
      <style>{tickerKeyframes}</style>
      <div className="flex items-center">
        <div className="relative w-full overflow-x-hidden">
          <div
            className="whitespace-nowrap flex items-center"
            style={{
              animation: 'ticker-scroll 30s linear infinite',
              minWidth: '200%',
            }}
          >
            <span className="text-blue-700 font-medium text-base md:text-lg px-4">
              {message}
            </span>
            <span className="text-blue-700 font-medium text-base md:text-lg px-4">
              {message}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalizedTicker;