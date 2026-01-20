import React from 'react';

const features = [
  {
    icon: 'fas fa-handshake',
    title: 'Peer-to-Peer Direct',
    desc: 'No intermediaries, direct user transactions',
  },
  {
    icon: 'fas fa-eye',
    title: '100% Transparent',
    desc: 'Complete visibility of all transactions',
  },
  {
    icon: 'fas fa-shield-alt',
    title: 'Secure & Safe',
    desc: 'Advanced security protocols',
  },
  {
    icon: 'fas fa-mobile-alt',
    title: 'Mobile Optimized',
    desc: 'Access anywhere, anytime',
  },
];

const recognition = [
  {
    label: 'Platform Rating',
    value: '4.9/5',
    icon: 'fas fa-star',
    color: 'text-yellow-400',
    extra: (
      <div className="flex text-yellow-400 ml-2">
        <i className="fas fa-star"></i>
        <i className="fas fa-star"></i>
        <i className="fas fa-star"></i>
        <i className="fas fa-star"></i>
        <i className="fas fa-star"></i>
      </div>
    ),
  },
  {
    label: 'Success Rate',
    value: '98.7%',
    icon: 'fas fa-check-circle',
    color: 'text-green-400',
  },
  {
    label: 'Average Earnings',
    value: '₹15,000/month',
    icon: 'fas fa-rupee-sign',
    color: 'text-yellow-400',
  },
  {
    label: 'Member Retention',
    value: '94.3%',
    icon: 'fas fa-users',
    color: 'text-blue-400',
  },
];

const AboutSection = () => (
  <section id="about" className="py-24">
    <div className="container mx-auto px-6">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-6">
          <div className="inline-block mb-4 px-4 py-1 rounded-full bg-gradient-to-r from-pink-500 via-orange-400 to-yellow-300 text-white text-xs font-semibold shadow-lg">
            <i className="fas fa-certificate mr-2"></i>Verified Platform
          </div>
          <h2 className="text-4xl font-bold font-poppins">
            <span className="bg-gradient-to-r from-yellow-300 via-orange-400 to-pink-500 bg-clip-text text-transparent">Revolutionary</span><br />
            <span className="text-white">Financial Ecosystem</span>
          </h2>
          <p className="text-lg text-gray-200 leading-relaxed">
            Helping Hands Foundation pioneers a new era of peer-to-peer financial assistance. Our platform eliminates traditional barriers, creating direct pathways for mutual growth and support.
          </p>
          <p className="text-lg text-gray-200 leading-relaxed">
            Built on principles of transparency, trust, and community empowerment, we've revolutionized how individuals can achieve financial independence through collective support.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
            {features.map((f, i) => (
              <div key={i} className="rounded-2xl p-6 text-center bg-white/10 backdrop-blur-md border border-yellow-200/30 shadow-lg hover:scale-105 transition-transform">
                <i className={`${f.icon} text-3xl text-yellow-400 mb-4`}></i>
                <h4 className="font-bold text-lg mb-2 text-white">{f.title}</h4>
                <p className="text-gray-200">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-2xl p-8 bg-gradient-to-br from-blue-900/60 to-purple-900/60 border border-yellow-200/20 shadow-xl">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-300 via-orange-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <i className="fas fa-trophy text-white text-3xl"></i>
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-300 via-orange-400 to-pink-500 bg-clip-text text-transparent">Industry Recognition</h3>
            </div>
            <div className="space-y-4">
              {recognition.map((r, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/10 rounded-lg shadow">
                  <span className="font-semibold text-white flex items-center">
                    <i className={`${r.icon} ${r.color} mr-2`}></i>{r.label}
                  </span>
                  <span className={`font-bold ${r.color}`}>{r.value}</span>
                  {r.extra || null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default AboutSection; 