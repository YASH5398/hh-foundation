import React from 'react';

const roadmap = [
  {
    quarter: 'Q1 2024',
    title: 'Foundation Launch',
    items: [
      'Platform Architecture',
      'Core System Development',
      'Security Framework',
      'Initial Testing Phase',
    ],
  },
  {
    quarter: 'Q2 2024',
    title: 'Beta Launch',
    items: [
      '₹300 Plan Introduction',
      'User Registration System',
      'Payment Gateway Integration',
      'First 1000 Members',
    ],
  },
  {
    quarter: 'Q3 2024',
    title: 'Platform Enhancement',
    items: [
      'Advanced Dashboard',
      'KYC Verification System',
      'Multi-level Income Tracking',
      'WhatsApp Integration',
    ],
  },
  {
    quarter: 'Q4 2024',
    title: 'Mobile Revolution',
    items: [
      'Android App Launch',
      'iOS App Development',
      'Push Notifications',
      'Offline Capability',
    ],
  },
  {
    quarter: 'Q1 2025',
    title: 'AI Integration',
    items: [
      'Smart Matching Algorithm',
      'Predictive Analytics',
      'Automated Support',
      'Fraud Detection',
    ],
  },
  {
    quarter: 'Q2 2025',
    title: 'Global Expansion',
    items: [
      'International Markets',
      'Multi-currency Support',
      'Regional Partnerships',
      'Localized Platforms',
    ],
  },
];

const Roadmap = () => (
  <section id="roadmap" className="py-24 bg-gradient-to-b from-[#18182f] via-[#18182f] to-[#232344]">
    <div className="container mx-auto px-6">
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-4 flex items-center justify-center gap-3 font-poppins">
          <span className="text-yellow-400 text-4xl"><i className="fas fa-folder"></i></span>
          <span className="bg-gradient-to-r from-yellow-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">Development</span>
          <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Roadmap</span>
        </h2>
        <p className="text-xl text-white max-w-2xl mx-auto">
          Our journey towards building the most trusted peer-to-peer financial platform in India
        </p>
      </div>
      <div className="relative flex flex-col items-center">
        {/* Timeline vertical line */}
        <div className="hidden md:block absolute left-1/2 top-0 h-full w-1 bg-gradient-to-b from-yellow-400 to-orange-400 rounded-full z-0" style={{transform: 'translateX(-50%)'}}></div>
        <div className="flex flex-col gap-16 w-full md:w-11/12 z-10">
          {roadmap.map((step, idx) => (
            <div key={idx} className="relative flex flex-col md:flex-row md:items-center md:justify-between">
              {/* Timeline dot */}
              <div className="hidden md:block absolute left-1/2 top-12 w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-cyan-400 border-4 border-[#18182f] z-20" style={{transform: 'translateX(-50%)'}}></div>
              {/* Card left/right */}
              <div className={`w-full md:w-5/12 ${idx % 2 === 0 ? 'md:pr-16 md:order-1 md:text-right' : 'md:pl-16 md:order-2 md:text-left'} ${idx % 2 === 0 ? 'self-start' : 'self-end'}`}>
                <div className="bg-blue-700/90 border-2 border-yellow-400 rounded-2xl shadow-2xl p-8">
                  <div className="inline-block mb-4 px-4 py-1 rounded-full bg-yellow-400 text-black text-xs font-bold">
                    {step.quarter}
                  </div>
                  <h3 className="text-2xl font-extrabold text-white mb-4">{step.title}</h3>
                  <ul className="space-y-3">
                    {step.items.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-white">
                        <i className="fas fa-check-circle text-green-400"></i>
                        <span className="text-white font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              {/* Spacer for timeline on the other side */}
              <div className="hidden md:block w-5/12"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default Roadmap; 