import React, { useRef, useState } from 'react';

const REFERRAL_URL = 'https://hh-foundation.firebaseapp.com';

const ReferralLinkCard = () => {
  const inputRef = useRef(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = REFERRAL_URL;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      });
    } else if (inputRef.current) {
      inputRef.current.select();
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  };

  return (
    <div className="bg-indigo-50 rounded-2xl p-4 mb-4 shadow-sm border border-blue-100 w-full">
      <div className="flex items-center mb-3">
        <span className="text-indigo-500 text-xl mr-2">📤</span>
        <h3 className="text-base font-semibold text-gray-800">Your Referral Link</h3>
      </div>
      <div className="flex items-center gap-2 w-full">
        <input
          ref={inputRef}
          type="text"
          value={REFERRAL_URL}
          readOnly
          className="flex-1 bg-white border border-indigo-200 rounded-lg px-3 py-2 text-gray-700 text-sm font-mono shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 truncate"
        />
        <button
          onClick={handleCopy}
          className="whitespace-nowrap bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg shadow transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
};

export default ReferralLinkCard;