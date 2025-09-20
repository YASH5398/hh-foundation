import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { useAuth } from '../../context/AuthContext';
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db, auth, storage } from '../../config/firebase';
import { updatePassword, sendPasswordResetEmail, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  ChevronDown, 
  Copy, 
  Check,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Shield,
  Lock,
  RefreshCw,
  ExternalLink,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { DEFAULT_PROFILE_IMAGE, PROFILE_IMAGE_CLASSES } from '../../utils/profileUtils';

const paymentOptions = [
  { label: "Select Payment Method", value: "" },
  { label: "UPI", value: "upi" },
  { label: "Google Pay", value: "gpay" },
  { label: "PhonePe", value: "phonePe" },
  { label: "Bank Transfer", value: "bank" },
];

export default function ProfileSettings() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    whatsapp: '',
    sponsorId: '',
    userId: '',
    profileImage: '',
    paymentMethod: { upi: '', gpay: '', phonePe: '', bank: '' },
    bank: { name: '', accountNumber: '', bankName: '', ifscCode: '' }
  });
  const [originalProfile, setOriginalProfile] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isPaymentExpanded, setIsPaymentExpanded] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  
  // Password change states
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  // Avatar upload states
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewImage, setPreviewImage] = useState('');
  const fileInputRef = useRef(null);

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Password change handler
  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    
    setIsChangingPassword(true);
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.error('No user logged in');
        return;
      }
      
      // Re-authenticate user with current password
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        passwordData.currentPassword
      );
      
      await reauthenticateWithCredential(currentUser, credential);
      
      // Update password
      await updatePassword(currentUser, passwordData.newPassword);
      
      toast.success('Password updated successfully!');
      setShowChangePassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      
    } catch (error) {
      console.error('Error changing password:', error);
      if (error.code === 'auth/wrong-password') {
        toast.error('Current password is incorrect');
      } else if (error.code === 'auth/weak-password') {
        toast.error('New password is too weak');
      } else {
        toast.error('Failed to change password. Please try again.');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };
  
  // Password reset handler
  const handleResetPassword = async () => {
    try {
      if (!user?.email) {
        toast.error('No email found for current user');
        return;
      }
      
      await sendPasswordResetEmail(auth, user.email);
      toast.success('Password reset email sent! Check your inbox.');
      
    } catch (error) {
      console.error('Error sending password reset email:', error);
      toast.error('Failed to send password reset email. Please try again.');
    }
  };

  // Fetch user data from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.uid) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const profileData = {
              fullName: userData.fullName || '',
              email: userData.email || '',
              phone: userData.phone || '',
              whatsapp: userData.whatsapp || '',
              sponsorId: userData.sponsorId || '',
              userId: userData.userId || '',
              profileImage: userData.profileImage || '',
              paymentMethod: userData.paymentMethod || { upi: '', gpay: '', phonePe: '', bank: '' },
              bank: userData.bank || { name: '', accountNumber: '', bankName: '', ifscCode: '' }
            };
            setProfile(profileData);
            setOriginalProfile(profileData);
            
            // Determine selected payment method
            const paymentMethods = userData.paymentMethod || {};
            if (paymentMethods.upi) setSelectedPaymentMethod('upi');
            else if (paymentMethods.gpay) setSelectedPaymentMethod('gpay');
            else if (paymentMethods.phonePe) setSelectedPaymentMethod('phonePe');
            else if (paymentMethods.bank) setSelectedPaymentMethod('bank');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          toast.error('Failed to load profile data');
        }
      }
    };

    fetchUserData();
  }, [user?.uid]);

  if (!user) {
    return <div className="text-center py-10 text-gray-500">Loading profile...</div>;
  }

  const handleInput = (e) => {
    const { name, value } = e.target;
    
    if (name === 'selectedPaymentMethod') {
      setSelectedPaymentMethod(value);
      // Clear all payment methods and set the selected one
      setProfile(prev => ({
        ...prev,
        paymentMethod: { upi: '', gpay: '', phonePe: '', bank: '' }
      }));
    } else if (name.startsWith('paymentMethod.')) {
      const methodType = name.split('.')[1];
      setProfile(prev => ({
        ...prev,
        paymentMethod: {
          ...prev.paymentMethod,
          [methodType]: value
        }
      }));
    } else if (name.startsWith('bank.')) {
      const bankField = name.split('.')[1];
      setProfile(prev => ({
        ...prev,
        bank: {
          ...prev.bank,
          [bankField]: value
        }
      }));
    } else {
      setProfile(prev => ({ ...prev, [name]: value }));
    }
  };



  const handleCopyToClipboard = async (text, fieldName) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      if (user?.uid) {
        // Prepare update data with only editable fields
        const updateData = {
          fullName: profile.fullName,
          phone: profile.phone,
          whatsapp: profile.whatsapp,
          paymentMethod: profile.paymentMethod,
          bank: profile.bank
        };
        
        await setDoc(doc(db, 'users', user.uid), updateData, { merge: true });
        setOriginalProfile({ ...profile });
        toast.success("Profile updated successfully!");
      } else {
        toast.error("User not found");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleReset = () => {
    setProfile({ ...originalProfile });
    const paymentMethods = originalProfile.paymentMethod || {};
    if (paymentMethods.upi) setSelectedPaymentMethod('upi');
    else if (paymentMethods.gpay) setSelectedPaymentMethod('gpay');
    else if (paymentMethods.phonePe) setSelectedPaymentMethod('phonePe');
    else if (paymentMethods.bank) setSelectedPaymentMethod('bank');
    else setSelectedPaymentMethod('');
    toast.success('Profile reset to original values');
  };
  
  const handleUploadAvatar = async (e) => {
    try {
      const file = e?.target?.files?.[0];
      if (!file) return;
      
      // Validate file type and size (max 5MB)
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please select a JPEG, PNG, WebP, or GIF image');
        return;
      }
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('Image is too large (max 5MB)');
        return;
      }
      
      // Show local preview immediately
      const localUrl = URL.createObjectURL(file);
      setPreviewImage(localUrl);
      
      if (!user?.uid) {
        toast.error('User not found');
        return;
      }
      
      setUploading(true);
      setUploadProgress(0);
      
      const path = `profileImages/${user.uid}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      await new Promise((resolve, reject) => {
        uploadTask.on('state_changed', (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setUploadProgress(progress);
        }, (error) => {
          reject(error);
        }, () => {
          resolve();
        });
      });
      
      const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
      
      // Update Firestore with new URL and timestamp
      await setDoc(doc(db, 'users', user.uid), { 
        profileImage: downloadURL,
        profileImageUpdatedAt: new Date().toISOString()
      }, { merge: true });
      
      // Update UI immediately
      setProfile(prev => ({ ...prev, profileImage: downloadURL }));
      toast.success('Profile image updated successfully!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar. Using default image.');
      
      // Fallback to default image on error
      setProfile(prev => ({ ...prev, profileImage: DEFAULT_PROFILE_IMAGE }));
      setPreviewImage(DEFAULT_PROFILE_IMAGE);
      
      // Update Firestore with default image
      try {
        if (user?.uid) {
          await setDoc(doc(db, 'users', user.uid), { 
            profileImage: DEFAULT_PROFILE_IMAGE,
            profileImageUpdatedAt: new Date().toISOString()
          }, { merge: true });
        }
      } catch (firestoreError) {
        console.error('Error updating Firestore with default image:', firestoreError);
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Function to handle image load errors
  const handleProfileImageError = (e) => {
    console.log('Profile image failed to load, using default MLM logo');
    e.target.src = DEFAULT_PROFILE_IMAGE;
    e.target.onerror = null; // Prevent infinite loop
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-0 sm:py-8 px-0 sm:px-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5QzkyQUMiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
      
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-4xl mx-auto bg-white/10 backdrop-blur-xl rounded-none sm:rounded-2xl md:rounded-3xl shadow-2xl border-0 sm:border border-white/20 overflow-hidden relative"
      >
        {/* Glassmorphism Header */}
        <div className="bg-gradient-to-r from-indigo-600/90 via-purple-600/90 to-pink-600/90 backdrop-blur-sm px-4 sm:px-6 md:px-8 py-6 sm:py-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-sm"></div>
          <div className="relative z-10">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight"
            >
              Profile Settings
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-white/80 text-sm sm:text-base md:text-lg"
            >
              Customize your account and manage preferences
            </motion.p>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-4 sm:p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Enhanced Avatar Section */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, type: "spring", stiffness: 100 }}
              className="col-span-1 lg:col-span-1 flex flex-col items-center w-full"
            >
              <div className="relative group">
                {/* Animated Ring */}
                <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full opacity-75 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-52 md:h-52 rounded-full overflow-hidden border-4 border-white/50 shadow-2xl backdrop-blur-sm">
                  <img
                    src={previewImage || profile.profileImage || DEFAULT_PROFILE_IMAGE}
                    alt="Profile"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={handleProfileImageError}
                  />
                  {/* Hidden file input for avatar upload */}
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleUploadAvatar}
                    className="hidden"
                  />
                   <motion.div
                     initial={{ opacity: 0 }}
                     whileHover={{ opacity: 1 }}
                     className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent rounded-full flex items-end justify-center cursor-pointer pb-6"
                     onClick={() => fileInputRef.current && fileInputRef.current.click()}
                   >
                     <motion.div 
                       whileHover={{ scale: 1.1 }}
                       whileTap={{ scale: 0.9 }}
                       className="text-white text-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2"
                     >
                       <Camera className="w-6 h-6 mx-auto mb-1" />
                       <span className="text-sm font-medium">{uploading ? `Uploading ${uploadProgress}%` : 'Change Photo'}</span>
                     </motion.div>
                   </motion.div>
                 </div>
               </div>
               <motion.div
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.5, delay: 0.3 }}
                 className="mt-4 sm:mt-6 text-center"
               >
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1">{profile.fullName || 'User'}</h2>
                 <p className="text-white/70 text-xs sm:text-sm bg-white/10 backdrop-blur-sm rounded-full px-3 sm:px-4 py-1">{profile.email}</p>
               </motion.div>
            </motion.div>

            {/* Form Fields */}
            <div className="col-span-1 lg:col-span-2 w-full space-y-6 sm:space-y-8">
              {/* Enhanced Personal Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl"
              >
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="flex items-center gap-3 mb-6"
                >
                  <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Personal Information</h3>
                </motion.div>
                
                <div className="grid grid-cols-1 gap-4 sm:gap-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    <label htmlFor="fullName" className="block text-sm font-medium text-white/90 mb-3">
                      Full Name
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      name="fullName"
                      value={profile.fullName || ''}
                      onChange={handleInput}
                      className="w-full px-4 py-3 sm:py-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 shadow-lg hover:bg-white/15"
                      placeholder="Enter your full name"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                  >
                    <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-3">
                      Email Address (Read-only)
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                      <input
                        id="email"
                        type="email"
                        name="email"
                        value={profile.email || ''}
                        readOnly
                        className="w-full pl-12 pr-4 py-3 sm:py-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 text-white/70 placeholder-white/30 cursor-not-allowed transition-all duration-300 shadow-lg"
                        placeholder="Email address"
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                  >
                    <label htmlFor="phone" className="block text-sm font-medium text-white/90 mb-3">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                      <input
                        id="phone"
                        type="tel"
                        name="phone"
                        value={profile.phone || ''}
                        onChange={handleInput}
                        className="w-full pl-12 pr-4 py-3 sm:py-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 shadow-lg hover:bg-white/15"
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                  >
                    <label htmlFor="whatsapp" className="block text-sm font-medium text-white/90 mb-3">
                      WhatsApp Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                      <input
                        id="whatsapp"
                        type="tel"
                        name="whatsapp"
                        value={profile.whatsapp || ''}
                        onChange={handleInput}
                        className="w-full pl-12 pr-4 py-3 sm:py-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 shadow-lg hover:bg-white/15"
                        placeholder="Enter your WhatsApp number"
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                  >
                    <label htmlFor="sponsorId" className="block text-sm font-medium text-white/90 mb-3">
                      Sponsor ID (Read-only)
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                      <input
                        id="sponsorId"
                        type="text"
                        name="sponsorId"
                        value={profile.sponsorId || ''}
                        readOnly
                        className="w-full pl-12 pr-4 py-3 sm:py-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 text-white/70 placeholder-white/30 cursor-not-allowed transition-all duration-300 shadow-lg"
                        placeholder="Sponsor ID"
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.9 }}
                  >
                    <label htmlFor="userId" className="block text-sm font-medium text-white/90 mb-3">
                      User ID (Read-only)
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                      <input
                        id="userId"
                        type="text"
                        name="userId"
                        value={profile.userId || ''}
                        readOnly
                        className="w-full pl-12 pr-4 py-3 sm:py-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 text-white/70 placeholder-white/30 cursor-not-allowed transition-all duration-300 shadow-lg"
                        placeholder="User ID"
                      />
                    </div>
                  </motion.div>
                </div>
              </motion.div>

              {/* Enhanced Payment Information - Collapsible */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden shadow-xl"
              >
                <motion.button
                  type="button"
                  onClick={() => setIsPaymentExpanded(!isPaymentExpanded)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-6 py-5 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 flex items-center justify-between transition-all duration-300 backdrop-blur-sm"
                  aria-expanded={isPaymentExpanded}
                  aria-controls="payment-details"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl">
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-lg font-bold text-white">Payment Details</span>
                  </div>
                  <motion.div
                    animate={{ rotate: isPaymentExpanded ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <ChevronDown className="w-6 h-6 text-white/70" />
                  </motion.div>
                </motion.button>

                <AnimatePresence>
                  {isPaymentExpanded && (
                    <motion.div
                      id="payment-details"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="p-6 space-y-6">
                        {/* Payment Method Selection */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.1 }}
                        >
                          <label htmlFor="selectedPaymentMethod" className="block text-sm font-medium text-white/90 mb-3">
                            Select Payment Method
                          </label>
                          <select
                            id="selectedPaymentMethod"
                            name="selectedPaymentMethod"
                            value={selectedPaymentMethod}
                            onChange={handleInput}
                            className="w-full px-4 py-3 sm:py-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 shadow-lg hover:bg-white/15"
                          >
                            {paymentOptions.map((opt) => (
                              <option key={opt.value} value={opt.value} className="bg-slate-800 text-white">{opt.label}</option>
                            ))}
                          </select>
                        </motion.div>

                        {/* Dynamic Payment Fields */}
                        <div className="grid grid-cols-1 gap-4 sm:gap-6">
                          {selectedPaymentMethod === "phonePe" && (
                            <div className="md:col-span-2">
                              <label htmlFor="phonepeNumber" className="block text-sm font-medium text-white/90 mb-3">
                                PhonePe Number
                              </label>
                              <div className="relative">
                                <input
                                  id="phonepeNumber"
                                  type="text"
                                  name="paymentMethod.phonePe"
                                  value={profile.paymentMethod.phonePe || ''}
                                  onChange={handleInput}
                                  className="w-full px-4 py-3 sm:py-4 pr-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 shadow-lg hover:bg-white/15"
                                  placeholder="PhonePe Number"
                                />
                                {profile.paymentMethod.phonePe && (
                                  <button
                                    type="button"
                                    onClick={() => handleCopyToClipboard(profile.paymentMethod.phonePe, 'phonepeNumber')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors duration-200"
                                    aria-label="Copy PhonePe number"
                                  >
                                    {copiedField === 'phonepeNumber' ? (
                                      <Check className="w-5 h-5 text-green-600" />
                                    ) : (
                                      <Copy className="w-5 h-5" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          {selectedPaymentMethod === "gpay" && (
                            <div className="md:col-span-2">
                              <label htmlFor="gpayNumber" className="block text-sm font-medium text-white/90 mb-3">
                                Google Pay Number
                              </label>
                              <div className="relative">
                                <input
                                  id="gpayNumber"
                                  type="text"
                                  name="paymentMethod.gpay"
                                  value={profile.paymentMethod.gpay || ''}
                                  onChange={handleInput}
                                  className="w-full px-4 py-3 sm:py-4 pr-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 shadow-lg hover:bg-white/15"
                                  placeholder="Google Pay Number"
                                />
                                {profile.paymentMethod.gpay && (
                                  <button
                                    type="button"
                                    onClick={() => handleCopyToClipboard(profile.paymentMethod.gpay, 'gpayNumber')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors duration-200"
                                    aria-label="Copy Google Pay number"
                                  >
                                    {copiedField === 'gpayNumber' ? (
                                      <Check className="w-5 h-5 text-green-600" />
                                    ) : (
                                      <Copy className="w-5 h-5" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          {selectedPaymentMethod === "upi" && (
                            <div>
                              <label htmlFor="upiId" className="block text-sm font-medium text-white/90 mb-3">
                                UPI ID
                              </label>
                              <div className="relative">
                                <input
                                  id="upiId"
                                  type="text"
                                  name="paymentMethod.upi"
                                  value={profile.paymentMethod.upi || ''}
                                  onChange={handleInput}
                                  className="w-full px-4 py-3 sm:py-4 pr-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 shadow-lg hover:bg-white/15"
                                  placeholder="yourname@paytm"
                                />
                                {profile.paymentMethod.upi && (
                                  <button
                                    type="button"
                                    onClick={() => handleCopyToClipboard(profile.paymentMethod.upi, 'upiId')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors duration-200"
                                    aria-label="Copy UPI ID"
                                  >
                                    {copiedField === 'upiId' ? (
                                      <Check className="w-5 h-5 text-green-600" />
                                    ) : (
                                      <Copy className="w-5 h-5" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          {selectedPaymentMethod === "bank" && (
                            <>
                              <div>
                                <label htmlFor="bankHolder" className="block text-sm font-medium text-white/90 mb-3">
                                  Account Holder Name
                                </label>
                                <input
                                  id="bankHolder"
                                  type="text"
                                  name="bank.name"
                                  value={profile.bank.name || ''}
                                  onChange={handleInput}
                                  className="w-full px-4 py-3 sm:py-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 shadow-lg hover:bg-white/15"
                                  placeholder="Account Holder Name"
                                />
                              </div>

                              <div>
                                <label htmlFor="bankAccount" className="block text-sm font-medium text-white/90 mb-3">
                                  Account Number
                                </label>
                                <div className="relative">
                                  <input
                                    id="bankAccount"
                                    type="text"
                                    name="bank.accountNumber"
                                    value={profile.bank.accountNumber || ''}
                                    onChange={handleInput}
                                    className="w-full px-4 py-3 sm:py-4 pr-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 shadow-lg hover:bg-white/15"
                                    placeholder="Account Number"
                                  />
                                  {profile.bank.accountNumber && (
                                    <button
                                      type="button"
                                      onClick={() => handleCopyToClipboard(profile.bank.accountNumber, 'bankAccount')}
                                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors duration-200"
                                      aria-label="Copy account number"
                                    >
                                      {copiedField === 'bankAccount' ? (
                                        <Check className="w-5 h-5 text-green-600" />
                                      ) : (
                                        <Copy className="w-5 h-5" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div>
                                <label htmlFor="bankName" className="block text-sm font-medium text-white/90 mb-3">
                                  Bank Name
                                </label>
                                <input
                                  id="bankName"
                                  type="text"
                                  name="bank.bankName"
                                  value={profile.bank.bankName || ''}
                                  onChange={handleInput}
                                  className="w-full px-4 py-3 sm:py-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 shadow-lg hover:bg-white/15"
                                  placeholder="Bank Name"
                                />
                              </div>

                              <div>
                                <label htmlFor="bankIFSC" className="block text-sm font-medium text-white/90 mb-3">
                                  IFSC Code
                                </label>
                                <div className="relative">
                                  <input
                                    id="bankIFSC"
                                    type="text"
                                    name="bank.ifscCode"
                                    value={profile.bank.ifscCode || ''}
                                    onChange={handleInput}
                                    className="w-full px-4 py-3 sm:py-4 pr-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 shadow-lg hover:bg-white/15"
                                    placeholder="SBIN0001234"
                                  />
                                  {profile.bank.ifscCode && (
                                    <button
                                      type="button"
                                      onClick={() => handleCopyToClipboard(profile.bank.ifscCode, 'bankIFSC')}
                                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors duration-200"
                                      aria-label="Copy IFSC code"
                                    >
                                      {copiedField === 'bankIFSC' ? (
                                        <Check className="w-5 h-5 text-green-600" />
                                      ) : (
                                        <Copy className="w-5 h-5" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Enhanced Security Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden shadow-xl"
              >
                <div className="px-6 py-5 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-sm">
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.9 }}
                    className="flex items-center gap-3"
                  >
                    <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Security Settings</h3>
                  </motion.div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 1.0 }}
                      whileHover={{ scale: 1.03, y: -2 }}
                      className="p-5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:border-purple-400/50 hover:shadow-lg hover:bg-white/10 transition-all duration-300 group"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-white mb-2 group-hover:text-purple-200 transition-colors">Change Password</h4>
                          <p className="text-sm text-white/60 group-hover:text-white/80 transition-colors">Update your account password</p>
                        </div>
                        <div className="p-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg group-hover:from-purple-500/30 group-hover:to-pink-500/30 transition-all">
                          <Lock className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
                        </div>
                      </div>
                      <motion.button
                        type="button"
                        onClick={() => setShowChangePassword(true)}
                        whileHover={{ x: 5 }}
                        className="inline-flex items-center gap-2 text-purple-300 hover:text-purple-200 font-medium text-sm transition-all duration-200 group-hover:gap-3"
                      >
                        Update Password
                        <ExternalLink className="w-4 h-4" />
                      </motion.button>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 1.1 }}
                      whileHover={{ scale: 1.03, y: -2 }}
                      className="p-5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:border-indigo-400/50 hover:shadow-lg hover:bg-white/10 transition-all duration-300 group"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-white mb-2 group-hover:text-indigo-200 transition-colors">Reset Password</h4>
                          <p className="text-sm text-white/60 group-hover:text-white/80 transition-colors">Send password reset email</p>
                        </div>
                        <div className="p-2 bg-gradient-to-r from-indigo-500/20 to-blue-500/20 rounded-lg group-hover:from-indigo-500/30 group-hover:to-blue-500/30 transition-all">
                          <RefreshCw className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
                        </div>
                      </div>
                      <motion.button
                        type="button"
                        onClick={handleResetPassword}
                        whileHover={{ x: 5 }}
                        className="inline-flex items-center gap-2 text-indigo-300 hover:text-indigo-200 font-medium text-sm transition-all duration-200 group-hover:gap-3"
                      >
                        Reset Password
                        <ExternalLink className="w-4 h-4" />
                      </motion.button>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Enhanced Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 sm:gap-6 pt-6 sm:pt-8 mt-6 sm:mt-8 border-t border-white/10"
          >
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 order-2 sm:order-1">
              <motion.button
                type="button"
                whileHover={{ scale: 1.05, x: -2 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto text-white/70 hover:text-white font-medium transition-all duration-200 px-4 py-2 rounded-lg hover:bg-white/10 backdrop-blur-sm"
              >
                Cancel
              </motion.button>
              <motion.a
                href="#"
                whileHover={{ scale: 1.05 }}
                className="text-sm text-purple-300 hover:text-purple-200 transition-colors duration-200 underline underline-offset-4 hover:underline-offset-2"
              >
                Reset to defaults
              </motion.a>
            </div>

            <motion.button
              type="submit"
              disabled={isSaving}
              whileHover={{ scale: isSaving ? 1 : 1.05, y: isSaving ? 0 : -2 }}
              whileTap={{ scale: isSaving ? 1 : 0.95 }}
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white px-6 sm:px-10 py-3 sm:py-4 rounded-2xl font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl hover:shadow-purple-500/25 flex items-center justify-center gap-3 text-base sm:text-lg backdrop-blur-sm border border-white/20 order-1 sm:order-2"
            >
              {isSaving ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                  />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="w-6 h-6" />
                  <span>Save Changes</span>
                </>
              )}
            </motion.button>
          </motion.div>
        </form>
      </motion.div>
      
      {/* Change Password Modal */}
      <AnimatePresence>
        {showChangePassword && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowChangePassword(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-6 rounded-2xl border border-white/20 backdrop-blur-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Change Password</h3>
                <button
                  onClick={() => setShowChangePassword(false)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleChangePassword} className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-12"
                      placeholder="Enter current password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                    >
                      {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                
                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-12"
                      placeholder="Enter new password"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                    >
                      {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                
                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-12"
                      placeholder="Confirm new password"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowChangePassword(false)}
                    className="flex-1 px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isChangingPassword ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                        Updating...
                      </>
                    ) : (
                      'Update Password'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}