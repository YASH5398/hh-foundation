// Updated by Gemini to fix sponsor ID loading issue (Robust Version).
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  generateUserId,
  validateEmail,
  validatePhone,
  validatePassword,
  cleanupAuthUser,
  getRegistrationErrorMessage,
  requiresCleanup
} from '../../utils/registrationUtils';
import { useAuth } from '../../context/AuthContext';
import { DEFAULT_PROFILE_IMAGE } from '../../utils/profileUtils';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  CreditCard, 
  Building, 
  Eye, 
  EyeOff,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  Shield,
  Sparkles,
  TrendingUp
} from 'lucide-react';

const Signup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

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

      // Check if user document exists, create if not
      const userDocRef = doc(db, "users", uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        // User document already exists, this shouldn't happen during signup
        toast.error('User already exists');
        setLoading(false);
        return;
      }

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
        profileImage: DEFAULT_PROFILE_IMAGE,
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
      navigate('/user-details');

    } catch (error) {
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <motion.div 
          className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div 
          className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-pink-400/20 to-red-600/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-yellow-400/10 to-orange-600/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, -100],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-sm sm:max-w-md"
        >
          {/* Main Card */}
          <motion.div 
            className="bg-white/10 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20 relative overflow-hidden"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
          >
            {/* Card Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-xl" />
            
            {/* Content */}
            <div className="relative z-10">
              {/* Logo Section */}
              <motion.div 
                className="text-center mb-6 sm:mb-8"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <div className="relative inline-block">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full blur-lg opacity-50"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  />
                  <img
                    src="https://iili.io/FIQ0fZ7.md.png"
                    alt="Company Logo"
                    className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-full shadow-2xl mx-auto border-2 border-white/30"
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/80x80/cccccc/ffffff?text=Logo'; }}
                  />
                  <motion.div 
                    className="absolute -bottom-1 -right-1 bg-gradient-to-r from-green-400 to-emerald-500 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shadow-lg"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                  </motion.div>
                </div>
                
                <motion.h1 
                  className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent mt-3 sm:mt-4 mb-1 sm:mb-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  Join HH Foundation
                </motion.h1>
                
                <motion.p 
                  className="text-white/70 text-xs sm:text-sm flex items-center justify-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                  Create your account and start your journey
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                </motion.p>
              </motion.div>

              {/* Progress Indicator */}
              <motion.div 
                className="mb-6 sm:mb-8"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              >
                <div className="flex items-center justify-between mb-2">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center">
                      <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-all duration-300 ${
                        currentStep >= step 
                          ? 'bg-white text-purple-600 shadow-lg' 
                          : 'bg-white/20 text-white/60'
                      }`}>
                        {currentStep > step ? <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" /> : step}
                      </div>
                      {step < 3 && (
                        <div className={`w-12 sm:w-16 h-1 mx-1 sm:mx-2 rounded-full transition-all duration-300 ${
                          currentStep > step ? 'bg-white' : 'bg-white/20'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
                <div className="text-center text-white/80 text-xs">
                  Step {currentStep} of {totalSteps}
                </div>
              </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                
                {/* Step 1: Basic Information */}
                {currentStep === 1 && (
                  <motion.div 
                    className="space-y-4 sm:space-y-5"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4 flex items-center">
                      <User className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      Personal Information
                    </h3>
        
                    {/* Sponsor ID */}
                    <div className="relative group">
                      <label htmlFor="sponsorId" className="block text-white text-xs sm:text-sm font-semibold mb-2 flex items-center">
                        <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        Sponsor ID
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="sponsorId"
                          name="sponsorId"
                          value={form.sponsorId}
                          onChange={handleChange}
                          className="w-full px-4 py-3 sm:py-4 pl-10 sm:pl-12 rounded-xl sm:rounded-2xl border border-white/20 bg-white/5 text-white placeholder-white/50 focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 focus:outline-none transition-all duration-300 backdrop-blur-sm hover:bg-white/10 text-sm sm:text-base"
                          placeholder="Enter sponsor ID"
                          required
                          readOnly={sponsorInfo.isLocked}
                        />
                        <Shield className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-white/40 group-hover:text-purple-400 transition-colors" />
                        {sponsorInfo.isLocked && (
                          <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2">
                            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                          </div>
                        )}
                      </div>
                      {sponsorInfo.isVerifying && (
                        <div className="flex items-center mt-2 text-xs sm:text-sm text-white/80">
                          <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mr-2" />
                          Verifying sponsor...
                        </div>
                      )}
                      {sponsorInfo.name && (
                        <motion.div 
                          className="mt-2 text-xs sm:text-sm text-green-300 flex items-center"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          Sponsor: {sponsorInfo.name}
                        </motion.div>
                      )}
                      {sponsorInfo.error && (
                        <motion.div 
                          className="mt-2 text-xs sm:text-sm text-red-300 flex items-center"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          {sponsorInfo.error}
                        </motion.div>
                      )}
                    </div>
        
                    {/* Full Name */}
                    <div className="relative group">
                      <label htmlFor="fullName" className="block text-white text-xs sm:text-sm font-semibold mb-2 flex items-center">
                        <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        Full Name
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="fullName"
                          name="fullName"
                          value={form.fullName}
                          onChange={handleChange}
                          className="w-full px-4 py-3 sm:py-4 pl-10 sm:pl-12 rounded-xl sm:rounded-2xl border border-white/20 bg-white/5 text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 focus:outline-none transition-all duration-300 backdrop-blur-sm hover:bg-white/10 text-sm sm:text-base"
                          placeholder="Enter your full name"
                          required
                        />
                        <User className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-white/40 group-hover:text-blue-400 transition-colors" />
                      </div>
                    </div>
        
                    {/* Email */}
                    <div className="relative group">
                      <label htmlFor="email" className="block text-white text-xs sm:text-sm font-semibold mb-2 flex items-center">
                        <Mail className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        Email Address
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          className="w-full px-4 py-3 sm:py-4 pl-10 sm:pl-12 rounded-xl sm:rounded-2xl border border-white/20 bg-white/5 text-white placeholder-white/50 focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 focus:outline-none transition-all duration-300 backdrop-blur-sm hover:bg-white/10 text-sm sm:text-base"
                          placeholder="Enter your email address"
                          required
                        />
                        <Mail className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-white/40 group-hover:text-green-400 transition-colors" />
                      </div>
                    </div>
        
                    {/* Phone */}
                    <div className="relative group">
                      <label htmlFor="phone" className="block text-white text-xs sm:text-sm font-semibold mb-2 flex items-center">
                        <Phone className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        Phone Number
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          className="w-full px-4 py-3 sm:py-4 pl-10 sm:pl-12 rounded-xl sm:rounded-2xl border border-white/20 bg-white/5 text-white placeholder-white/50 focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400/50 focus:outline-none transition-all duration-300 backdrop-blur-sm hover:bg-white/10 text-sm sm:text-base"
                          placeholder="Enter your phone number"
                          required
                        />
                        <Phone className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-white/40 group-hover:text-orange-400 transition-colors" />
                      </div>
                    </div>
        
                    {/* WhatsApp */}
                    <div className="relative group">
                      <label htmlFor="whatsappNumber" className="block text-white text-xs sm:text-sm font-semibold mb-2 flex items-center">
                        <Phone className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        WhatsApp Number
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          id="whatsappNumber"
                          name="whatsappNumber"
                          value={form.whatsappNumber}
                          onChange={handleChange}
                          className="w-full px-4 py-3 sm:py-4 pl-10 sm:pl-12 rounded-xl sm:rounded-2xl border border-white/20 bg-white/5 text-white placeholder-white/50 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 focus:outline-none transition-all duration-300 backdrop-blur-sm hover:bg-white/10 text-sm sm:text-base"
                          placeholder="Enter your WhatsApp number"
                          required
                        />
                        <Phone className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-white/40 group-hover:text-green-500 transition-colors" />
                      </div>
                    </div>
        
                    <motion.button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 sm:py-4 px-6 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-300 flex items-center justify-center group shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Continue
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                    </motion.button>
                  </motion.div>
                )}

                {/* Step 2: Security */}
                {currentStep === 2 && (
                  <motion.div 
                    className="space-y-4 sm:space-y-5"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                  >
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Lock className="w-5 h-5 mr-2" />
              Security & E-PIN
            </h3>

            {/* Password */}
            <div className="relative group">
              <label htmlFor="password" className="block text-white text-sm font-semibold mb-2 flex items-center">
                <Lock className="w-4 h-4 mr-1" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full px-5 py-4 pl-12 pr-12 rounded-xl border border-white/20 bg-white/10 text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:outline-none transition-all duration-300 backdrop-blur-sm"
                  placeholder="Create a strong password"
                  required
                />
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="relative group">
              <label htmlFor="confirmPassword" className="block text-white text-sm font-semibold mb-2 flex items-center">
                <Lock className="w-4 h-4 mr-1" />
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-5 py-4 pl-12 pr-12 rounded-xl border border-white/20 bg-white/10 text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:outline-none transition-all duration-300 backdrop-blur-sm"
                  placeholder="Confirm your password"
                  required
                />
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors duration-200"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* E-PIN */}
            <div className="relative group">
              <label htmlFor="epin" className="block text-white text-sm font-semibold mb-2 flex items-center">
                <CreditCard className="w-4 h-4 mr-1" />
                E-PIN
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="epin"
                  name="epin"
                  value={form.epin}
                  onChange={handleChange}
                  className="w-full px-5 py-4 pl-12 rounded-xl border border-white/20 bg-white/10 text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:outline-none transition-all duration-300 backdrop-blur-sm"
                  placeholder="Enter your E-PIN"
                  required
                />
                <CreditCard className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="flex-1 bg-white/20 text-white py-4 px-6 rounded-xl font-semibold hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-300"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="flex-1 bg-white text-purple-600 py-4 px-6 rounded-xl font-semibold hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-300 flex items-center justify-center group shadow-lg"
              >
                Continue
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Payment Method */}
        {currentStep === 3 && (
          <motion.div 
            className="space-y-4 sm:space-y-5"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Payment Information
            </h3>

            {/* Payment Method Selection */}
            <div className="relative group">
              <label htmlFor="paymentMethod" className="block text-white text-sm font-semibold mb-2 flex items-center">
                <CreditCard className="w-4 h-4 mr-1" />
                Payment Method
              </label>
              <div className="relative">
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  value={form.paymentMethod}
                  onChange={handleChange}
                  className="w-full px-5 py-4 pl-12 rounded-xl border border-white/20 bg-white/10 text-white focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:outline-none transition-all duration-300 backdrop-blur-sm appearance-none"
                  required
                >
                  <option value="" className="bg-gray-800">Choose payment method</option>
                  <option value="Bank Transfer" className="bg-gray-800">Bank Transfer</option>
                  <option value="UPI" className="bg-gray-800">UPI</option>
                  <option value="PhonePe" className="bg-gray-800">PhonePe</option>
                  <option value="Google Pay" className="bg-gray-800">Google Pay</option>
                </select>
                <CreditCard className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
              </div>
            </div>

            {/* Bank Transfer Fields */}
            {form.paymentMethod === 'Bank Transfer' && (
              <div className="space-y-4 bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="relative group">
                  <label htmlFor="accountHolder" className="block text-white text-sm font-semibold mb-2 flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    Account Holder Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="accountHolder"
                      name="accountHolder"
                      value={form.accountHolder}
                      onChange={handleChange}
                      className="w-full px-5 py-4 pl-12 rounded-xl border border-white/20 bg-white/10 text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:outline-none transition-all duration-300 backdrop-blur-sm"
                      placeholder="Enter account holder name"
                      required
                    />
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                  </div>
                </div>
                <div className="relative group">
                  <label htmlFor="accountNumber" className="block text-white text-sm font-semibold mb-2 flex items-center">
                    <CreditCard className="w-4 h-4 mr-1" />
                    Account Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="accountNumber"
                      name="accountNumber"
                      value={form.accountNumber}
                      onChange={handleChange}
                      className="w-full px-5 py-4 pl-12 rounded-xl border border-white/20 bg-white/10 text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:outline-none transition-all duration-300 backdrop-blur-sm"
                      placeholder="Enter account number"
                      required
                    />
                    <CreditCard className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                  </div>
                </div>
                <div className="relative group">
                  <label htmlFor="bankName" className="block text-white text-sm font-semibold mb-2 flex items-center">
                    <Building className="w-4 h-4 mr-1" />
                    Bank Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="bankName"
                      name="bankName"
                      value={form.bankName}
                      onChange={handleChange}
                      className="w-full px-5 py-4 pl-12 rounded-xl border border-white/20 bg-white/10 text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:outline-none transition-all duration-300 backdrop-blur-sm"
                      placeholder="Enter bank name"
                      required
                    />
                    <Building className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                  </div>
                </div>
                <div className="relative group">
                  <label htmlFor="ifscCode" className="block text-white text-sm font-semibold mb-2 flex items-center">
                    <CreditCard className="w-4 h-4 mr-1" />
                    IFSC Code
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="ifscCode"
                      name="ifscCode"
                      value={form.ifscCode}
                      onChange={handleChange}
                      className="w-full px-5 py-4 pl-12 rounded-xl border border-white/20 bg-white/10 text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:outline-none transition-all duration-300 backdrop-blur-sm"
                      placeholder="Enter IFSC code"
                      required
                    />
                    <CreditCard className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                  </div>
                </div>
              </div>
            )}

            {/* UPI Fields */}
            {form.paymentMethod === 'UPI' && (
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="relative group">
                  <label htmlFor="upiId" className="block text-white text-sm font-semibold mb-2 flex items-center">
                    <CreditCard className="w-4 h-4 mr-1" />
                    UPI ID
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="upiId"
                      name="upiId"
                      value={form.upiId}
                      onChange={handleChange}
                      className="w-full px-5 py-4 pl-12 rounded-xl border border-white/20 bg-white/10 text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:outline-none transition-all duration-300 backdrop-blur-sm"
                      placeholder="Enter UPI ID (e.g., user@paytm)"
                      required
                    />
                    <CreditCard className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                  </div>
                </div>
              </div>
            )}

            {/* PhonePe Fields */}
            {form.paymentMethod === 'PhonePe' && (
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="relative group">
                  <label htmlFor="phonepeNumber" className="block text-white text-sm font-semibold mb-2 flex items-center">
                    <Phone className="w-4 h-4 mr-1" />
                    PhonePe Number
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      id="phonepeNumber"
                      name="phonepeNumber"
                      value={form.phonepeNumber}
                      onChange={handleChange}
                      className="w-full px-5 py-4 pl-12 rounded-xl border border-white/20 bg-white/10 text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:outline-none transition-all duration-300 backdrop-blur-sm"
                      placeholder="Enter PhonePe registered number"
                      required
                    />
                    <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                  </div>
                </div>
              </div>
            )}

            {/* Google Pay Fields */}
            {form.paymentMethod === 'Google Pay' && (
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="relative group">
                  <label htmlFor="googlepayNumber" className="block text-white text-sm font-semibold mb-2 flex items-center">
                    <Phone className="w-4 h-4 mr-1" />
                    Google Pay Number
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      id="googlepayNumber"
                      name="googlepayNumber"
                      value={form.googlepayNumber}
                      onChange={handleChange}
                      className="w-full px-5 py-4 pl-12 rounded-xl border border-white/20 bg-white/10 text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:outline-none transition-all duration-300 backdrop-blur-sm"
                      placeholder="Enter Google Pay registered number"
                      required
                    />
                    <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                  </div>
                </div>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="flex-1 bg-white/20 text-white py-4 px-6 rounded-xl font-semibold hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-300"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 text-white py-4 px-6 rounded-xl font-semibold hover:from-green-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <CheckCircle className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </form>
      
      {/* Login Link */}
      <div className="text-center mt-6">
        <p className="text-white/80 text-sm">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-blue-400 hover:text-blue-300 font-semibold transition-colors duration-200 underline"
          >
            Login
          </button>
        </p>
      </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;
