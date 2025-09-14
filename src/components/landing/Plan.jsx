import React from 'react';

const Plan = () => (
  // Main section container with responsive padding and a dark gradient background
  <section id="plan" className="py-16 md:py-24 bg-gradient-to-b from-[#18182f] via-[#18182f] to-[#232344] font-inter">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Title and Description */}
      <div className="text-center mb-12 md:mb-16">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
          {/* Rupee icon for visual appeal */}
          <span className="text-yellow-400 text-3xl md:text-4xl">
            <i className="fas fa-hand-holding-usd"></i> {/* Changed to a more relevant icon */}
          </span>
          {/* Gradient text for "MLM Plan" */}
          <span className="bg-gradient-to-r from-yellow-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
            MLM Plan
          </span>
        </h2>
        {/* Subtitle/description */}
        <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
          Start with just ₹300 and unlock a world of financial opportunities through our transparent, community-driven plan.
        </p>
      </div>

      {/* Pricing Card Container */}
      <div className="flex justify-center">
        <div className="relative rounded-2xl p-8 sm:p-10 max-w-md w-full text-center
                        bg-gradient-to-br from-[#232344]/80 to-[#18182f]/80 backdrop-blur-md
                        border border-yellow-400/30 shadow-2xl
                        transform transition-transform duration-300 hover:scale-[1.02]">
          {/* Gold gradient circle for the icon */}
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-400
                          rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
            <i className="fas fa-rupee-sign text-black text-3xl"></i> {/* Icon color changed to black for contrast */}
          </div>

          {/* Price and description */}
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">₹300 Entry</h3>
          <p className="text-lg text-gray-300 mb-6">One-time, no hidden fees</p>

          {/* Features List */}
          <ul className="text-left space-y-4 mb-8">
            {/* Each list item with a checkmark icon */}
            <li className="flex items-center text-gray-200">
              <i className="fas fa-check-circle text-green-400 mr-3 text-lg"></i>
              <span className="font-medium text-base sm:text-lg">Direct Referral Bonus</span>
            </li>
            <li className="flex items-center text-gray-200">
              <i className="fas fa-check-circle text-green-400 mr-3 text-lg"></i>
              <span className="font-medium text-base sm:text-lg">AutoPool Income</span>
            </li>
            <li className="flex items-center text-gray-200">
              <i className="fas fa-check-circle text-green-400 mr-3 text-lg"></i>
              <span className="font-medium text-base sm:text-lg">Level Income (10 Levels)</span>
            </li>
            <li className="flex items-center text-gray-200">
              <i className="fas fa-check-circle text-green-400 mr-3 text-lg"></i>
              <span className="font-medium text-base sm:text-lg">Instant Withdrawals</span>
            </li>
            <li className="flex items-center text-gray-200">
              <i className="fas fa-check-circle text-green-400 mr-3 text-lg"></i>
              <span className="font-medium text-base sm:text-lg">24/7 Support</span>
            </li>
          </ul>

          {/* Call to Action Button */}
          <a
            href="#"
            className="inline-flex items-center justify-center gap-2
                       bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 text-black
                       px-8 py-4 rounded-full font-bold text-lg shadow-lg
                       hover:scale-105 transition-transform duration-300 ease-in-out
                       focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:ring-offset-2 focus:ring-offset-[#18182f]"
          >
            <i className="fas fa-arrow-right"></i> {/* Added icon here */}
            Join Now
          </a>
        </div>
      </div>
    </div>
  </section>
);

export default Plan;
