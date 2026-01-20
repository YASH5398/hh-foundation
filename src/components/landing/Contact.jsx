import React from 'react';

const Contact = () => (
  <section id="contact" className="py-24">
    <div className="container mx-auto px-6">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold mb-4 font-poppins">
          <span className="gradient-text">📞 Contact Us</span>
        </h2>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Have questions or need support? Reach out to our team anytime.
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-12">
        <div className="glass-effect rounded-2xl p-10 shadow-lg">
          <h3 className="text-2xl font-bold text-white mb-6">Send a Message</h3>
          <form className="space-y-6">
            <input type="text" placeholder="Your Name" className="w-full p-4 rounded-lg bg-white/10 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400" />
            <input type="email" placeholder="Your Email" className="w-full p-4 rounded-lg bg-white/10 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400" />
            <textarea placeholder="Your Message" rows="5" className="w-full p-4 rounded-lg bg-white/10 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"></textarea>
            <button type="submit" className="gold-gradient text-black px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:scale-105 transition-transform">Send Message</button>
          </form>
        </div>
        <div className="flex flex-col justify-center">
          <div className="mb-8">
            <h4 className="text-xl font-bold text-white mb-4">Contact Info</h4>
            <p className="text-gray-300 mb-2"><i className="fas fa-map-marker-alt text-yellow-400 mr-2"></i>Krishna Nagar, Delhi – 110051</p>
            <p className="text-gray-300 mb-2"><i className="fas fa-phone text-yellow-400 mr-2"></i>+91 9876543210</p>
            <p className="text-gray-300 mb-2"><i className="fas fa-envelope text-yellow-400 mr-2"></i>support@helpinghands.in</p>
          </div>
          <div>
            <h4 className="text-xl font-bold text-white mb-4">Follow Us</h4>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform"><i className="fab fa-facebook-f"></i></a>
              <a href="#" className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform"><i className="fab fa-twitter"></i></a>
              <a href="#" className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform"><i className="fab fa-instagram"></i></a>
              <a href="#" className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform"><i className="fab fa-youtube"></i></a>
              <a href="#" className="w-10 h-10 bg-blue-700 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform"><i className="fab fa-linkedin-in"></i></a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default Contact; 