import React from 'react';
import AnimatedCounter from './AnimatedCounter'; // Assuming AnimatedCounter is in the same directory or correctly imported

const stats = [
  {
    icon: 'fas fa-users',
    value: 8805,
    label: 'Active Members',
    iconBg: 'bg-yellow-400',
    iconColor: 'text-black', // Changed to black for better contrast on yellow
  },
  {
    icon: 'fas fa-rupee-sign',
    value: 12, // Assuming 12 Crores (₹12,00,00,000)
    label: 'Crores Circulated', // Changed label for clarity
    iconBg: 'bg-yellow-400',
    iconColor: 'text-black',
  },
  {
    icon: 'fas fa-map-marker-alt',
    value: 28,
    label: 'States Covered',
    iconBg: 'bg-yellow-400',
    iconColor: 'text-black',
  },
  {
    icon: 'fas fa-clock',
    value: 99.9, // Changed to float for percentage
    label: 'Platform Uptime (%)', // Changed label for clarity
    iconBg: 'bg-yellow-400',
    iconColor: 'text-black',
  },
];

const Achievements = () => (
  // Main section container with responsive padding and a dark gradient background
  <section id="achievements" className="py-16 md:py-24 bg-gradient-to-b from-[#18182f] via-[#18182f] to-[#232344] font-inter">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Title and Description */}
      <div className="text-center mb-12 md:mb-16">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
          {/* Trophy icon with gradient */}
          <span className="text-yellow-400 text-3xl md:text-4xl">
            <i className="fas fa-trophy"></i>
          </span>
          {/* Gradient text for "Our Achievements" */}
          <span className="bg-gradient-to-r from-yellow-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
            Our Achievements
          </span>
        </h2>
        {/* Subtitle/description */}
        <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
          Transforming lives through transparent peer-to-peer financial assistance.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="rounded-2xl p-6 sm:p-8 text-center bg-[#232344]/80 border border-yellow-400/20 shadow-xl flex flex-col items-center justify-center
                       transform transition-transform duration-300 hover:scale-[1.02] hover:shadow-2xl cursor-pointer"
          >
            {/* Icon container with background and shadow */}
            <div className={`w-16 h-16 ${stat.iconBg} rounded-full flex items-center justify-center mb-5 sm:mb-6 shadow-lg`}>
              <i className={`${stat.icon} ${stat.iconColor} text-2xl sm:text-3xl`}></i>
            </div>
            {/* Animated Counter value */}
            <div className="text-4xl sm:text-5xl font-extrabold text-yellow-400 mb-2">
              {/* Special handling for "Crores" and "Uptime" display */}
              {stat.label === 'Crores Circulated' ? (
                <>₹<AnimatedCounter value={stat.value} duration={1500} /> Cr</>
              ) : stat.label === 'Platform Uptime (%)' ? (
                <><AnimatedCounter value={stat.value} duration={1500} />%</>
              ) : (
                <AnimatedCounter value={stat.value} duration={1500} />
              )}
            </div>
            {/* Label for the stat */}
            <p className="text-base sm:text-lg font-semibold text-white/90">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Growth Analytics Section */}
      <div className="mt-12 md:mt-16">
        <div className="rounded-2xl p-6 sm:p-8 bg-[#18182f]/80 border border-yellow-400/20 shadow-xl">
          <h3 className="text-xl md:text-2xl font-bold mb-6 text-center bg-gradient-to-r from-yellow-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
            Platform Growth Analytics
          </h3>
          <div className="flex items-center justify-center">
            {/* Placeholder for a chart, styled to look integrated */}
            <div className="w-full h-48 sm:h-64 flex items-center justify-center text-gray-400 bg-gray-900/30 rounded-xl border border-gray-700 border-dashed p-4">
              <span className="text-base sm:text-lg text-center">
                [Interactive Growth Chart Coming Soon!]<br/>
                <span className="text-sm text-gray-500">Data visualization will appear here.</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default Achievements;