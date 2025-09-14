import React, { useState, useEffect } from 'react';

import { useAuth } from '../../context/AuthContext';

import { useNavigate, useLocation } from 'react-router-dom';



const Register = () => {

  const [isLogin, setIsLogin] = useState(false);

  const { signup, login } = useAuth();

  const navigate = useNavigate();

  const location = useLocation();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({

    fullName: '',

    email: '',

    phone: '',

    whatsapp: '',

    sponsorId: '',

    epin: '',

    password: '',

    confirmPassword: '',

    paymentMethod: '',

    phonepeNumber: '',

    googlepayNumber: '',

    upiId: '',

    accountHolder: '',

    accountNumber: '',

    ifscCode: ''

  });

  const [sponsorIdLocked, setSponsorIdLocked] = useState(false);



  // Autofill Sponsor ID from URL param

  useEffect(() => {

    const params = new URLSearchParams(location.search);

    const ref = params.get('ref');

    if (ref) {

      setForm((prev) => ({ ...prev, sponsorId: ref }));

      setSponsorIdLocked(true);

    }

  }, [location.search]);



  // Handler for input changes, updates the form state

  const handleChange = (e) => {

    const { name, value } = e.target;

    setForm((prev) => ({ ...prev, [name]: value }));

  };



  // Handler for form submission

  const handleSubmit = async (e) => {

    e.preventDefault();

    setLoading(true);

    try {

      if (isLogin) {

        await login(form.email, form.password);

        // alert("Logged in successfully!");

      } else {

        if (form.password !== form.confirmPassword) {

          alert("Passwords do not match!");

          return;

        }

        await signup(form.email, form.password, form.fullName, form.phone, form.whatsapp, form.sponsorId, form.epin, form.paymentMethod, form.phonepeNumber, form.googlepayNumber, form.upiId, form.accountHolder, form.accountNumber, form.ifscCode);

        // alert("Signed up successfully!");

      }

      // navigate('/dashboard'); // Remove direct navigation, let AuthContext handle it

    } catch (error) {

      alert(error.message);

    } finally {

      setLoading(false);

    }

  };



  return (

    // Main container with background image and overlay

    <div

      className="min-h-screen w-full flex items-center justify-center relative font-inter"

      style={{

        backgroundImage: 'url(https://iili.io/FIiJfBR.md.jpg)',

        backgroundSize: 'cover',

        backgroundPosition: 'center',

        backgroundAttachment: 'fixed',

      }}

    >

      {/* Dark overlay for better readability of content */}

      <div className="absolute inset-0 bg-black/70 z-0" />



      {/* Content wrapper for centering and maximum width */}

      <div className="relative z-10 w-full flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">

        {/* Form container with glassmorphic effect */}

        <div className="w-full max-w-md bg-white/15 backdrop-blur-lg rounded-3xl p-8 shadow-2xl mx-auto space-y-6 border border-white/20">

          {/* Logo Section */}

          <div className="flex justify-center mb-6">

            <img

              src="https://iili.io/FIQ0fZ7.md.png"

              alt="Company Logo"

              className="h-20 w-auto rounded-full shadow-lg"

              onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/80x80/cccccc/ffffff?text=Logo'; }}

            />

          </div>



          {/* Signup Heading */}

          <h2 className="text-4xl font-extrabold text-white text-center mb-6 drop-shadow-lg">{isLogin ? 'Login' : 'Sign Up'}</h2>



          {/* Form */}

          <form onSubmit={handleSubmit} className="space-y-5">

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

                readOnly={sponsorIdLocked}

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

                <option value="upi" className="text-gray-900">UPI</option>

                <option value="bank" className="text-gray-900">Bank Account</option>

              </select>

              {/* Custom arrow for select dropdown */}

              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 top-6">

                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">

                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>

                </svg>

              </div>

            </div>



            {/* Dynamic Payment Fields based on selection */}

            {form.paymentMethod === 'phonepe' && (

              <div className="relative">

                <label htmlFor="phonepeNumber" className="block text-white text-sm font-semibold mb-1">Enter PhonePe Number</label>

                <input

                  type="text"

                  id="phonepeNumber"

                  name="phonepeNumber"

                  value={form.phonepeNumber}

                  onChange={handleChange}

                  className="w-full px-5 py-3 rounded-xl border border-gray-300 bg-white/80 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition duration-200"

                  placeholder="Enter PhonePe number"

                  required

                />

              </div>

            )}



            {form.paymentMethod === 'googlepay' && (

              <div className="relative">

                <label htmlFor="googlepayNumber" className="block text-white text-sm font-semibold mb-1">Enter Google Pay Number</label>

                <input

                  type="text"

                  id="googlepayNumber"

                  name="googlepayNumber"

                  value={form.googlepayNumber}

                  onChange={handleChange}

                  className="w-full px-5 py-3 rounded-xl border border-gray-300 bg-white/80 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition duration-200"

                  placeholder="Enter Google Pay number"

                  required

                />

              </div>

            )}



            {form.paymentMethod === 'upi' && (

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

            <div>

              <button

                type="submit"

                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition duration-300 ease-in-out transform hover:-translate-y-1 shadow-lg"

                disabled={loading}

              >

                {loading ? 'Loading...' : (isLogin ? 'Login' : 'Register')}

              </button>



              <div className="text-center mt-4">

                {isLogin ? (

                  <p className="text-white">

                    Don't have an account?

                    <button

                      type="button"

                      onClick={() => navigate('/register')}

                      className="text-blue-400 hover:text-blue-200 font-semibold ml-2"

                    >

                      Sign Up

                    </button>

                  </p>

                ) : (

                  <p className="text-white">

                    Already have an account?

                    <button

                      type="button"

                      onClick={() => navigate('/login')}

                      className="text-blue-400 hover:text-blue-200 font-semibold ml-2"

                    >

                      Login

                    </button>

                  </p>

                )}

              </div>

            </div>

          </form>

        </div>

      </div>

    </div>

  );

};

export default Register;