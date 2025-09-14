import React, { useState } from 'react';

const SignupForm = () => {
  // State to manage form input values
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    whatsapp: '',
    sponsorId: '',
    epin: '',
    password: '',
    confirmPassword: '',
    paymentMethod: '', // Can be 'phonepe', 'googlepay', 'upi_generic', 'bank'
    phonePeNumber: '', // New state for PhonePe number
    googlePayNumber: '', // New state for Google Pay number
    upiId: '', // Existing, now specifically for generic UPI
    accountHolder: '',
    accountNumber: '',
    ifscCode: ''
  });

  // State for displaying messages to the user (e.g., validation errors, success)
  const [message, setMessage] = useState({ text: '', type: '' }); // type: 'success' or 'error'

  // Handler for input changes, updates the form state
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear any existing message when input changes
    setMessage({ text: '', type: '' });
  };

  // Handler for form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // Basic validation: check if passwords match
    if (form.password !== form.confirmPassword) {
      setMessage({ text: "Passwords do not match!", type: 'error' });
      return;
    }

    // You can add more validation here based on the selected payment method
    if (form.paymentMethod === 'phonepe' && !form.phonePeNumber) {
      setMessage({ text: "Please enter your PhonePe number.", type: 'error' });
      return;
    }
    if (form.paymentMethod === 'googlepay' && !form.googlePayNumber) {
      setMessage({ text: "Please enter your Google Pay number.", type: 'error' });
      return;
    }
    if (form.paymentMethod === 'upi_generic' && !form.upiId) {
        setMessage({ text: "Please enter your UPI ID.", type: 'error' });
        return;
    }
    if (form.paymentMethod === 'bank') {
      if (!form.accountHolder || !form.accountNumber || !form.ifscCode) {
        setMessage({ text: "Please fill in all bank account details.", type: 'error' });
        return;
      }
    }
    
    // In a real application, you would send this data to a backend server.
    // For now, we'll just log it to the console.
    console.log("Form submitted:", form);

    setMessage({ text: "Form submitted successfully! Check console for data.", type: 'success' });
    // Optionally, clear the form after successful submission
    // setForm({
    //   fullName: '', email: '', phone: '', whatsapp: '', sponsorId: '', epin: '',
    //   password: '', confirmPassword: '', paymentMethod: '', phonePeNumber: '',
    //   googlePayNumber: '', upiId: '', accountHolder: '', accountNumber: '', ifscCode: ''
    // });
  };

  return (
    // Main container with background image and overlay
    <div
      className="min-h-screen w-full flex items-center justify-center relative font-inter" // Added font-inter for consistency
      style={{
        backgroundImage: 'url(https://iili.io/FIiJfBR.md.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed', // Makes background fixed when scrolling
      }}
    >
      {/* Dark overlay for better readability of content */}
      <div className="absolute inset-0 bg-black/70 z-0" /> {/* Increased opacity slightly */}

      {/* Content wrapper for centering and maximum width */}
      <div className="relative z-10 w-full flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
        {/* Form container with glassmorphic effect */}
        <div className="w-full max-w-md bg-white/15 backdrop-blur-lg rounded-3xl p-8 shadow-2xl mx-auto space-y-6 border border-white/20"> {/* Subtle border added */}
          {/* Logo Section */}
          <div className="flex justify-center mb-6">
            <img
              src="https://iili.io/FIQ0fZ7.md.png"
              alt="Company Logo"
              className="h-20 w-auto rounded-full shadow-lg" // Adjusted size and added rounded-full for logo
              onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/80x80/cccccc/ffffff?text=Logo'; }} // Fallback image
            />
          </div>

          {/* Signup Heading */}
          <h2 className="text-4xl font-extrabold text-white text-center mb-6 drop-shadow-lg">Sign Up</h2>

          {/* Message display area */}
          {message.text && (
            <div className={`p-3 rounded-md text-center ${message.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'} mb-4 transition-all duration-300`}>
              {message.text}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5"> {/* Adjusted spacing */}
            {/* Full Name */}
            <div className="relative">
              <label htmlFor="fullName" className="block text-white text-sm font-semibold mb-1">Full Name</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                className="w-full px-5 py-3 rounded-xl border border-gray-300 bg-white/80 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition duration-200"
                placeholder="Enter your full name"
                required
              />
            </div>

            {/* Email */}
            <div className="relative">
              <label htmlFor="email" className="block text-white text-sm font-semibold mb-1">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full px-5 py-3 rounded-xl border border-gray-300 bg-white/80 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition duration-200"
                placeholder="Enter your email"
                required
              />
            </div>

            {/* Phone Number */}
            <div className="relative">
              <label htmlFor="phone" className="block text-white text-sm font-semibold mb-1">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full px-5 py-3 rounded-xl border border-gray-300 bg-white/80 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition duration-200"
                placeholder="Enter your phone number"
                required
              />
            </div>

            {/* WhatsApp Number */}
            <div className="relative">
              <label htmlFor="whatsapp" className="block text-white text-sm font-semibold mb-1">WhatsApp Number</label>
              <input
                type="tel"
                id="whatsapp"
                name="whatsapp"
                value={form.whatsapp}
                onChange={handleChange}
                className="w-full px-5 py-3 rounded-xl border border-gray-300 bg-white/80 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition duration-200"
                placeholder="Enter your WhatsApp number (optional)"
              />
            </div>

            {/* Sponsor ID */}
            <div className="relative">
              <label htmlFor="sponsorId" className="block text-white text-sm font-semibold mb-1">Sponsor ID</label>
              <input
                type="text"
                id="sponsorId"
                name="sponsorId"
                value={form.sponsorId}
                onChange={handleChange}
                className="w-full px-5 py-3 rounded-xl border border-gray-300 bg-white/80 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition duration-200"
                placeholder="Enter sponsor ID"
                required
              />
            </div>

            {/* E-PIN */}
            <div className="relative">
              <label htmlFor="epin" className="block text-white text-sm font-semibold mb-1">E-PIN</label>
              <input
                type="text"
                id="epin"
                name="epin"
                value={form.epin}
                onChange={handleChange}
                className="w-full px-5 py-3 rounded-xl border border-gray-300 bg-white/80 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition duration-200"
                placeholder="Enter E-PIN"
                required
              />
            </div>

            {/* Payment Method */}
            <div className="relative">
              <label htmlFor="paymentMethod" className="block text-white text-sm font-semibold mb-1">Payment Method</label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                value={form.paymentMethod}
                onChange={handleChange}
                className="w-full px-5 py-3 rounded-xl border border-gray-300 bg-white/80 text-gray-900 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition duration-200 appearance-none"
                required
              >
                <option value="" className="text-gray-500">Select payment method</option>
                <option value="phonepe" className="text-gray-900">PhonePe</option>
                <option value="googlepay" className="text-gray-900">Google Pay</option>
                <option value="upi_generic" className="text-gray-900">UPI ID</option>
                <option value="bank" className="text-gray-900">Bank Account</option>
              </select>
              {/* Custom arrow for select dropdown */}
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 top-6">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>

            {/* Dynamic Payment Fields based on selection */}
            {form.paymentMethod === 'phonepe' && (
              <div className="relative">
                <label htmlFor="phonePeNumber" className="block text-white text-sm font-semibold mb-1">PhonePe Number</label>
                <input
                  type="tel"
                  id="phonePeNumber"
                  name="phonePeNumber"
                  value={form.phonePeNumber}
                  onChange={handleChange}
                  className="w-full px-5 py-3 rounded-xl border border-gray-300 bg-white/80 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition duration-200"
                  placeholder="Enter your PhonePe number"
                  required
                />
              </div>
            )}

            {form.paymentMethod === 'googlepay' && (
              <div className="relative">
                <label htmlFor="googlePayNumber" className="block text-white text-sm font-semibold mb-1">Google Pay Number</label>
                <input
                  type="tel"
                  id="googlePayNumber"
                  name="googlePayNumber"
                  value={form.googlePayNumber}
                  onChange={handleChange}
                  className="w-full px-5 py-3 rounded-xl border border-gray-300 bg-white/80 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition duration-200"
                  placeholder="Enter your Google Pay number"
                  required
                />
              </div>
            )}
            
            {form.paymentMethod === 'upi_generic' && (
              <div className="relative">
                <label htmlFor="upiId" className="block text-white text-sm font-semibold mb-1">Enter UPI ID</label>
                <input
                  type="text"
                  id="upiId"
                  name="upiId"
                  value={form.upiId}
                  onChange={handleChange}
                  className="w-full px-5 py-3 rounded-xl border border-gray-300 bg-white/80 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition duration-200"
                  placeholder="username@upi"
                  required
                />
              </div>
            )}

            {form.paymentMethod === 'bank' && (
              <>
                <div className="relative">
                  <label htmlFor="accountHolder" className="block text-white text-sm font-semibold mb-1">Account Holder Name</label>
                  <input
                    type="text"
                    id="accountHolder"
                    name="accountHolder"
                    value={form.accountHolder}
                    onChange={handleChange}
                    className="w-full px-5 py-3 rounded-xl border border-gray-300 bg-white/80 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition duration-200"
                    placeholder="Enter account holder name"
                    required
                  />
                </div>
                <div className="relative">
                  <label htmlFor="accountNumber" className="block text-white text-sm font-semibold mb-1">Account Number</label>
                  <input
                    type="text"
                    id="accountNumber"
                    name="accountNumber"
                    value={form.accountNumber}
                    onChange={handleChange}
                    className="w-full px-5 py-3 rounded-xl border border-gray-300 bg-white/80 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition duration-200"
                    placeholder="Enter account number"
                    required
                  />
                </div>
                <div className="relative">
                  <label htmlFor="ifscCode" className="block text-white text-sm font-semibold mb-1">IFSC Code</label>
                  <input
                    type="text"
                    id="ifscCode"
                    name="ifscCode"
                    value={form.ifscCode}
                    onChange={handleChange}
                    className="w-full px-5 py-3 rounded-xl border border-gray-300 bg-white/80 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition duration-200"
                    placeholder="Enter IFSC code"
                    required
                  />
                </div>
              </>
            )}

            {/* Password */}
            <div className="relative">
              <label htmlFor="password" className="block text-white text-sm font-semibold mb-1">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full px-5 py-3 rounded-xl border border-gray-300 bg-white/80 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition duration-200"
                placeholder="Create a password"
                required
              />
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <label htmlFor="confirmPassword" className="block text-white text-sm font-semibold mb-1">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                className="w-full px-5 py-3 rounded-xl border border-gray-300 bg-white/80 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition duration-200"
                placeholder="Confirm your password"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition duration-300 font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Sign Up
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;