import React from 'react';

const Contact = () => (
  // Main section container with responsive padding and a dark gradient background
  <section id="contact" className="py-16 md:py-24 bg-gradient-to-b from-[#18182f] via-[#18182f] to-[#232344] font-inter">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Title and Description */}
      <div className="text-center mb-12 md:mb-16">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
          {/* Phone icon for visual appeal */}
          <span className="text-yellow-400 text-3xl md:text-4xl">
            <i className="fas fa-phone-alt"></i> {/* Changed to a more modern phone icon */}
          </span>
          {/* Gradient text for "Contact Us" */}
          <span className="bg-gradient-to-r from-yellow-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
            Contact Us
          </span>
        </h2>
        {/* Subtitle/description */}
        <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
          Have questions or need support? Reach out to our team anytime. We're here to help you succeed.
        </p>
      </div>

      {/* Contact Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {/* Send a Message Form Card */}
        <div className="relative rounded-2xl p-8 sm:p-10
                        bg-gradient-to-br from-[#232344]/80 to-[#18182f]/80 backdrop-blur-md
                        border border-yellow-400/30 shadow-2xl
                        transform transition-transform duration-300 hover:scale-[1.01]">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-6 text-center md:text-left">Send a Message</h3>
          <form className="space-y-6">
            <input
              type="text"
              placeholder="Your Name"
              className="w-full p-3 sm:p-4 rounded-lg bg-white/10 border border-gray-700 text-white placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-colors duration-200"
            />
            <input
              type="email"
              placeholder="Your Email"
              className="w-full p-3 sm:p-4 rounded-lg bg-white/10 border border-gray-700 text-white placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-colors duration-200"
            />
            <textarea
              placeholder="Your Message"
              rows="5"
              className="w-full p-3 sm:p-4 rounded-lg bg-white/10 border border-gray-700 text-white placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-colors duration-200 resize-y"
            ></textarea>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2
                         bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 text-black
                         px-8 py-4 rounded-full font-bold text-lg shadow-lg
                         hover:scale-105 transition-transform duration-300 ease-in-out
                         focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:ring-offset-2 focus:ring-offset-[#18182f] w-full sm:w-auto"
            >
              <i className="fas fa-paper-plane" aria-hidden="true"></i> {/* Icon for send message */}
              Send Message
            </button>
          </form>
        </div>

        {/* Contact Info and Follow Us Section */}
        <div className="flex flex-col justify-center p-4 md:p-0"> {/* Added padding for mobile */}
          <div className="mb-8">
            <h4 className="text-xl sm:text-2xl font-extrabold text-white mb-4">Contact Information</h4>
            <p className="text-gray-300 mb-3 flex items-center text-base sm:text-lg">
              <i className="fas fa-map-marker-alt text-yellow-400 mr-3 text-xl" aria-hidden="true"></i>
              Krishna Nagar, Delhi – 110051
            </p>
            <p className="text-gray-300 mb-3 flex items-center text-base sm:text-lg">
              <i className="fas fa-phone text-yellow-400 mr-3 text-xl" aria-hidden="true"></i>
              +91 9876543210
            </p>
            <p className="text-gray-300 mb-3 flex items-center text-base sm:text-lg">
              <i className="fas fa-envelope text-yellow-400 mr-3 text-xl" aria-hidden="true"></i>
              support@helpinghands.in
            </p>
          </div>

          <div>
            <h4 className="text-xl sm:text-2xl font-extrabold text-white mb-4">Follow Us</h4>
            <div className="flex flex-wrap gap-4"> {/* Used flex-wrap for better mobile layout */}
              {/* Social Media Icons - styled for consistency */}
              <a href="#" className="w-12 h-12 bg-[#2f2f4a] border border-yellow-400/50 rounded-full flex items-center justify-center text-white text-xl
                                     hover:bg-yellow-400 hover:text-black transition-all duration-300 transform hover:scale-110" aria-label="Facebook">
                <i className="fab fa-facebook-f" aria-hidden="true"></i>
              </a>
              <a href="#" className="w-12 h-12 bg-[#2f2f4a] border border-yellow-400/50 rounded-full flex items-center justify-center text-white text-xl
                                     hover:bg-yellow-400 hover:text-black transition-all duration-300 transform hover:scale-110" aria-label="Twitter">
                <i className="fab fa-twitter" aria-hidden="true"></i>
              </a>
              <a href="#" className="w-12 h-12 bg-[#2f2f4a] border border-yellow-400/50 rounded-full flex items-center justify-center text-white text-xl
                                     hover:bg-yellow-400 hover:text-black transition-all duration-300 transform hover:scale-110" aria-label="Instagram">
                <i className="fab fa-instagram" aria-hidden="true"></i>
              </a>
              <a href="#" className="w-12 h-12 bg-[#2f2f4a] border border-yellow-400/50 rounded-full flex items-center justify-center text-white text-xl
                                     hover:bg-yellow-400 hover:text-black transition-all duration-300 transform hover:scale-110" aria-label="YouTube">
                <i className="fab fa-youtube" aria-hidden="true"></i>
              </a>
              <a href="#" className="w-12 h-12 bg-[#2f2f4a] border border-yellow-400/50 rounded-full flex items-center justify-center text-white text-xl
                                     hover:bg-yellow-400 hover:text-black transition-all duration-300 transform hover:scale-110" aria-label="LinkedIn">
                <i className="fab fa-linkedin-in" aria-hidden="true"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default Contact;
