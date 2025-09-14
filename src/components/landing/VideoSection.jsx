import React from 'react';

const VideoSection = () => (
  <section className="py-24">
    <div className="container mx-auto px-6">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4 font-poppins">
          <span className="bg-gradient-to-r from-yellow-300 via-orange-400 to-pink-500 bg-clip-text text-transparent">🎬 Platform Overview</span>
        </h2>
        <p className="text-xl text-gray-200">Understanding our system in 60 seconds</p>
      </div>
      <div className="max-w-4xl mx-auto">
        <div className="rounded-2xl p-12 flex flex-col items-center justify-center bg-gradient-to-br from-blue-900/70 to-purple-900/70 border-2 border-yellow-200/20 text-center shadow-2xl">
          <i className="fas fa-play-circle text-5xl text-yellow-400 mb-6"></i>
          <h3 className="text-2xl font-bold mb-4 text-white">Professional Explainer Video</h3>
          <p className="text-gray-200 mb-6">Complete system walkthrough and earning potential demonstration</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-gradient-to-r from-yellow-300 via-orange-400 to-pink-500 text-black px-6 py-3 rounded-full font-bold flex items-center justify-center hover:scale-105 transition-transform shadow-lg">
              <i className="fas fa-play mr-2"></i>Watch Now
            </button>
            <button className="bg-transparent border border-white text-white px-6 py-3 rounded-full font-bold flex items-center justify-center hover:bg-yellow-400 hover:text-black transition-all shadow-lg">
              <i className="fas fa-share mr-2"></i>Share
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default VideoSection; 