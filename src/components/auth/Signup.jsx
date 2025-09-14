// Updated by Gemini to fix sponsor ID loading issue (Robust Version).
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, updateDoc, serverTimestamp, collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import toast from 'react-hot-toast';
import { 
  generateUserId, 
  validateEmail, 
  validatePhone, 
  validatePassword, 
  checkUserExists, 
  cleanupAuthUser, 
  getRegistrationErrorMessage, 
  requiresCleanup
} from '../../utils/registrationUtils';
import { useAuth } from '../../context/AuthContext';

const Signup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    whatsappNumber: '',
    sponsorId: searchParams.get('ref') || '',
    epin: '',
    password: '',
    confirmPassword: '',
    paymentMethod: '',
    phonepeNumber: '',
    googlepayNumber: '',
    upiId: '',
    accountHolder: '',
    accountNumber: '',
    ifscCode: '',
    bankName: ''
  });

  const [sponsorInfo, setSponsorInfo] = useState({
    isVerifying: false,
    isLocked: !!searchParams.get('ref'),
    name: '',
    error: ''
  });

  const { login } = useAuth();

  useEffect(() => {
    const refId = searchParams.get('ref');
    let isMounted = true;

    if (refId) {
      setSponsorInfo(prev => ({ ...prev, isVerifying: true, isLocked: true }));
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('userId', '==', refId));

      getDocs(q)
        .then((querySnapshot) => {
          if (!isMounted) return;
          if (querySnapshot.empty) {
            setSponsorInfo({
              name: '',
              error: 'Sponsor not found. Please check the ID.',
              isVerifying: false,
              isLocked: false,
            });
          } else {
            const sponsorData = querySnapshot.docs[0].data();
            setSponsorInfo({
              name: sponsorData.fullName,
              error: '',
              isVerifying: false,
              isLocked: true,
            });
          }
        })
        .catch((err) => {
          if (!isMounted) return;
          console.error('Sponsor verification error:', err);
          setSponsorInfo({
            name: '',
            error: 'Error verifying sponsor.',
            isVerifying: false,
            isLocked: false,
          });
        });
    } else {
      setSponsorInfo({ name: '', error: '', isVerifying: false, isLocked: false });
    }

    return () => {
      isMounted = false;
    };
  }, [searchParams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    let uidForCleanup = null;
    
    try {
      const { 
        fullName, 
        email, 
        phone, 
        whatsappNumber,
        sponsorId, 
        epin, 
        password, 
        confirmPassword,
        paymentMethod
      } = form;

      if (!fullName || !email || !phone || !whatsappNumber || !sponsorId || !epin || !password || !confirmPassword || !paymentMethod) {
        toast.error('Please fill all required fields');
        setLoading(false);
        return;
      }

      // Validate payment method specific fields
      if (paymentMethod === 'Bank Transfer') {
        if (!form.accountHolder || !form.accountNumber || !form.bankName || !form.ifscCode) {
          toast.error('Please fill all bank details');
          setLoading(false);
          return;
        }
      } else if (paymentMethod === 'UPI') {
        if (!form.upiId) {
          toast.error('Please enter UPI ID');
          setLoading(false);
          return;
        }
      } else if (paymentMethod === 'PhonePe') {
        if (!form.phonepeNumber) {
          toast.error('Please enter PhonePe number');
          setLoading(false);
          return;
        }
      } else if (paymentMethod === 'Google Pay') {
        if (!form.googlepayNumber) {
          toast.error('Please enter Google Pay number');
          setLoading(false);
          return;
        }
      }

      if (sponsorInfo.isVerifying || sponsorInfo.error) {
        toast.error('Please provide a valid Sponsor ID.');
        setLoading(false);
        return;
      }

      if (!validateEmail(email)) {
        toast.error('Please enter a valid email address');
        setLoading(false);
        return;
      }

      if (!validatePhone(phone)) {
        toast.error('Please enter a valid phone number (10-15 digits)');
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        toast.error('Passwords do not match');
        setLoading(false);
        return;
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        toast.error(passwordValidation.message);
        setLoading(false);
        return;
      }

      const userExistsCheck = await checkUserExists(email, phone);
      if (userExistsCheck.exists) {
        toast.error(userExistsCheck.message);
        setLoading(false);
        return;
      }

      const epinQuery = query(collection(db, 'epins'), where('epin', '==', epin), where('status', '==', 'unused'));
      const epinSnapshot = await getDocs(epinQuery);
      if (epinSnapshot.empty) {
        toast.error('Invalid or already used E-PIN');
        setLoading(false);
        return;
      }
      const epinDoc = epinSnapshot.docs[0];
      const epinRef = doc(db, 'epins', epinDoc.id);

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const uid = user.uid;
      
      const userId = generateUserId();
      uidForCleanup = uid;
      
      await updateDoc(epinRef, {
        status: 'used',
        assignedTo: uid,
        usedBy: uid,
        usedAt: serverTimestamp()
      });

      // Prepare payment method data based on selection
      let paymentMethodData = {};
      let bankData = {};
      
      if (paymentMethod === 'Bank Transfer') {
        bankData = {
          accountNumber: form.accountNumber,
          bankName: form.bankName,
          ifscCode: form.ifscCode,
          name: form.accountHolder
        };
        paymentMethodData = {
          type: 'Bank Transfer',
          bankDetails: bankData
        };
      } else if (paymentMethod === 'UPI') {
        paymentMethodData = {
          type: 'UPI',
          upiId: form.upiId
        };
      } else if (paymentMethod === 'PhonePe') {
        paymentMethodData = {
          type: 'PhonePe',
          phonepeNumber: form.phonepeNumber
        };
      } else if (paymentMethod === 'Google Pay') {
        paymentMethodData = {
          type: 'Google Pay',
          googlepayNumber: form.googlepayNumber
        };
      }

      const docRef = doc(db, "users", uid);
      await setDoc(docRef, { 
        uid: uid,
        userId: userId,
        fullName,
        email,
        phone,
        whatsapp: whatsappNumber,
        sponsorId,
        password, 
        paymentMethod: paymentMethodData,
        isActivated: false,
        levelStatus: "Star",
        registrationTime: serverTimestamp(),
        profileImage: "",
        referralCount: 0,
        totalEarnings: 0,
        totalReceived: 0,
        totalSent: 0,
        totalTeam: 0,
        isBlocked: false,
        deviceToken: "",
        helpReceived: 0,
        level: 1,
        referredUsers: [],
        paymentBlocked: false,
        nextLevelPaymentDone: false,
        createdAt: serverTimestamp(),
        bank: bankData,
        kycDetails: {
          aadhaar: "",
          pan: ""
        }
      });

      await login(email, password);
      navigate('/register-success');

    } catch (error) {
      console.error('❌ Registration error:', error);
      const errorMessage = getRegistrationErrorMessage(error);
      toast.error(errorMessage);
      
      if (requiresCleanup(error) && uidForCleanup !== null) {
        await cleanupAuthUser(uidForCleanup);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center relative font-inter" style={{
      backgroundImage: 'url(https://iili.io/FIiJfBR.md.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
    }}>
      <div className="absolute inset-0 bg-black/70 z-0" />

      <div className="relative z-10 w-full flex items-center justify-center py-8">
        <div className="w-full max-w-md bg-white/15 backdrop-blur-lg rounded-3xl p-8 shadow-2xl mx-auto space-y-6 border border-white/20">
          <div className="flex justify-center mb-6">
            <img
              src="https://iili.io/FIQ0fZ7.md.png"
              alt="Company Logo"
              className="h-20 w-auto rounded-full shadow-lg"
              onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/80x80/cccccc/ffffff?text=Logo'; }}
            />
          </div>

          <h2 className="text-4xl font-extrabold text-white text-center mb-6 drop-shadow-lg">Sign Up</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
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
                readOnly={sponsorInfo.isLocked}
              />
              {sponsorInfo.isVerifying && (
                <div className="flex items-center mt-2 text-sm text-white">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Verifying sponsor...
                </div>
              )}
              {sponsorInfo.name && !sponsorInfo.isVerifying && (
                <p className="mt-2 text-sm text-green-400">Sponsor: {sponsorInfo.name}</p>
              )}
              {sponsorInfo.error && !sponsorInfo.isVerifying && (
                <p className="mt-2 text-sm text-red-400">{sponsorInfo.error}</p>
              )}
            </div>

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

            <div className="relative">
              <label htmlFor="whatsappNumber" className="block text-white text-sm font-semibold mb-1">WhatsApp Number</label>
              <input
                type="tel"
                id="whatsappNumber"
                name="whatsappNumber"
                value={form.whatsappNumber}
                onChange={handleChange}
                className="w-full px-5 py-3 rounded-xl border border-gray-300 bg-white/80 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition duration-200"
                placeholder="Enter your WhatsApp number"
                required
              />
            </div>

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

            {/* Payment Method Section */}
            <div className="bg-white/10 rounded-xl p-4 border border-white/20">
              <h3 className="text-white text-lg font-semibold mb-4">Payment Method</h3>
              
              <div className="relative mb-4">
                <label htmlFor="paymentMethod" className="block text-white text-sm font-semibold mb-2">Select Payment Method</label>
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  value={form.paymentMethod}
                  onChange={handleChange}
                  className="w-full px-5 py-3 rounded-xl border border-gray-300 bg-white/80 text-gray-900 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition duration-200"
                  required
                >
                  <option value="">Choose payment method</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="PhonePe">PhonePe</option>
                  <option value="Google Pay">Google Pay</option>
                </select>
              </div>

              {/* Bank Transfer Fields */}
              {form.paymentMethod === 'Bank Transfer' && (
                <div className="space-y-4">
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
                    <label htmlFor="bankName" className="block text-white text-sm font-semibold mb-1">Bank Name</label>
                    <input
                      type="text"
                      id="bankName"
                      name="bankName"
                      value={form.bankName}
                      onChange={handleChange}
                      className="w-full px-5 py-3 rounded-xl border border-gray-300 bg-white/80 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition duration-200"
                      placeholder="Enter bank name"
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
                </div>
              )}

              {/* UPI Fields */}
              {form.paymentMethod === 'UPI' && (
                <div className="relative">
                  <label htmlFor="upiId" className="block text-white text-sm font-semibold mb-1">UPI ID</label>
                  <input
                    type="text"
                    id="upiId"
                    name="upiId"
                    value={form.upiId}
                    onChange={handleChange}
                    className="w-full px-5 py-3 rounded-xl border border-gray-300 bg-white/80 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition duration-200"
                    placeholder="Enter UPI ID (e.g., user@paytm)"
                    required
                  />
                </div>
              )}

              {/* PhonePe Fields */}
              {form.paymentMethod === 'PhonePe' && (
                <div className="relative">
                  <label htmlFor="phonepeNumber" className="block text-white text-sm font-semibold mb-1">PhonePe Number</label>
                  <input
                    type="tel"
                    id="phonepeNumber"
                    name="phonepeNumber"
                    value={form.phonepeNumber}
                    onChange={handleChange}
                    className="w-full px-5 py-3 rounded-xl border border-gray-300 bg-white/80 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition duration-200"
                    placeholder="Enter PhonePe registered number"
                    required
                  />
                </div>
              )}

              {/* Google Pay Fields */}
              {form.paymentMethod === 'Google Pay' && (
                <div className="relative">
                  <label htmlFor="googlepayNumber" className="block text-white text-sm font-semibold mb-1">Google Pay Number</label>
                  <input
                    type="tel"
                    id="googlepayNumber"
                    name="googlepayNumber"
                    value={form.googlepayNumber}
                    onChange={handleChange}
                    className="w-full px-5 py-3 rounded-xl border border-gray-300 bg-white/80 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition duration-200"
                    placeholder="Enter Google Pay registered number"
                    required
                  />
                </div>
              )}
            </div>

            <div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition duration-300 ease-in-out transform hover:-translate-y-1 shadow-lg"
                disabled={loading || sponsorInfo.isVerifying}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating Account...
                  </div>
                ) : 'Register'}
              </button>

              <div className="text-center mt-4">
                <p className="text-white">
                  Already have an account?
                  <button
                    type="button"
                    onClick={handleLoginClick}
                    className="text-blue-400 hover:text-blue-200 font-semibold ml-2"
                  >
                    Login
                  </button>
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
