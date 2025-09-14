import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import useProfile from '../../hooks/useProfile';
import { FiUser, FiPhone, FiMessageCircle, FiMail, FiCreditCard, FiHash, FiKey, FiCamera, FiSave, FiUpload } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const paymentMethods = [
  { value: '', label: 'Select Payment Method' },
  { value: 'PhonePe', label: 'PhonePe' },
  { value: 'Google Pay', label: 'Google Pay' },
  { value: 'UPI', label: 'UPI' },
  { value: 'Bank', label: 'Bank Account' },
];

const ProfileUpdate = () => {
  const { user, loading } = useAuth();
  const { profile, setProfile, fetchUserProfile, updateUserProfile, uploadProfilePhoto } = useProfile();
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  // New: local form state for all fields
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    whatsapp: '',
    email: '',
    paymentMethod: {
      type: '',
      phonePeNumber: '',
      gpayNumber: '',
      upiId: '',
      bank: {
        accountHolder: '',
        bankName: '',
        ifscCode: '',
        accountNumber: ''
      }
    },
    profilePhoto: ''
  });

  useEffect(() => {
    if (!loading && user) {
      fetchUserProfile(user.uid);
    }
  }, [user, loading, fetchUserProfile]);

  useEffect(() => {
    if (profile) {
      setPreview(profile.profilePhoto || '');
      setForm({
        fullName: profile.fullName || '',
        phone: profile.phone || '',
        whatsapp: profile.whatsapp || '',
        email: profile.email || '',
        paymentMethod: {
          type: profile.paymentMethod?.type || '',
          phonePeNumber: profile.paymentMethod?.phonePeNumber || '',
          gpayNumber: profile.paymentMethod?.gpayNumber || '',
          upiId: profile.paymentMethod?.upiId || '',
          bank: {
            accountHolder: profile.paymentMethod?.bank?.accountHolder || '',
            bankName: profile.paymentMethod?.bank?.bankName || '',
            ifscCode: profile.paymentMethod?.bank?.ifscCode || '',
            accountNumber: profile.paymentMethod?.bank?.accountNumber || ''
          }
        },
        profilePhoto: profile.profilePhoto || ''
      });
    }
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleBankChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, bank: { ...prev.bank, [name]: value } }));
  };

  const handlePaymentMethodType = (e) => {
    const type = e.target.value;
    setForm((prev) => ({
      ...prev,
      paymentMethod: {
        ...prev.paymentMethod,
        type
      }
    }));
  };
  const handlePaymentField = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      paymentMethod: {
        ...prev.paymentMethod,
        [name]: value
      }
    }));
  };
  const handleBankField = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      paymentMethod: {
        ...prev.paymentMethod,
        bank: {
          ...prev.paymentMethod.bank,
          [name]: value
        }
      }
    }));
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleUploadImage = async () => {
    if (!selectedFile || !user) return;
    setUploading(true);
    try {
      const url = await uploadProfilePhoto(user.uid, selectedFile);
      setForm((prev) => ({ ...prev, profilePhoto: url }));
      setPreview(url);
      setSelectedFile(null);
      toast.success('Profile photo updated!');
    } catch (error) {
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const validate = () => {
    if (!form.fullName?.trim()) {
      toast.error('Full name required');
      return false;
    }
    if (!/^[0-9]{10}$/.test(form.phone)) {
      toast.error('Valid 10-digit phone required');
      return false;
    }
    if (!/^[0-9]{10}$/.test(form.whatsapp)) {
      toast.error('Valid 10-digit WhatsApp required');
      return false;
    }
    if (!form.paymentMethod.type) {
      toast.error('Select payment method');
      return false;
    }
    // Validate only relevant fields
    if (form.paymentMethod.type === 'PhonePe' && !/^[0-9]{10}$/.test(form.paymentMethod.phonePeNumber)) {
      toast.error('Valid PhonePe number required');
      return false;
    }
    if (form.paymentMethod.type === 'Google Pay' && !/^[0-9]{10}$/.test(form.paymentMethod.gpayNumber)) {
      toast.error('Valid GPay number required');
      return false;
    }
    if (form.paymentMethod.type === 'UPI' && !form.paymentMethod.upiId.trim()) {
      toast.error('UPI ID required');
      return false;
    }
    if (form.paymentMethod.type === 'Bank') {
      const b = form.paymentMethod.bank;
      if (!b.accountHolder.trim() || !b.bankName.trim() || !b.ifscCode.trim() || !b.accountNumber.trim()) {
        toast.error('All bank details required');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('Not logged in');
    if (!validate()) return;
    setSubmitting(true);

    // Extract fields
    const {
      paymentMethod,
      accountNumber,
      ifscCode,
      bankName,
      upiId,
      accountHolder,
      ...rest
    } = form;

    // Bank validation
    if (paymentMethod === 'Bank') {
      if (!accountNumber || !ifscCode || !bankName) {
        toast.error('Please fill all bank details');
        setSubmitting(false);
        return;
      }
    }
    // UPI validation
    if (paymentMethod === 'UPI') {
      if (!upiId) {
        toast.error('Please enter your UPI ID');
        setSubmitting(false);
        return;
      }
    }

    // Only include bank if all required fields are present
    const bankObj = (paymentMethod === 'Bank' && accountNumber && ifscCode && bankName)
      ? {
          accountNumber,
          bankName,
          ifscCode,
          name: accountHolder || form.fullName
        }
      : undefined;

    try {
      const result = await updateUserProfile(user.uid, {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        whatsapp: form.whatsapp.trim(),
        email: form.email.trim(),
        paymentMethod: form.paymentMethod,
        profilePhoto: form.profilePhoto || '',
        bank: bankObj // Only include bank if defined
      });
      if (result.success) {
        toast.success('✅ Payment Method Updated!');
      } else {
        toast.error(result.message || 'Update failed');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Update failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !profile) {
    return <div className="flex justify-center items-center min-h-[200px]">Loading...</div>;
  }

  // Avatar logic
  const getInitial = (name) => (name && name.length > 0 ? name[0].toUpperCase() : 'U');

  return (
    <div className="flex justify-center items-center w-full">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-4 sm:p-8 flex flex-col gap-8 overflow-y-auto max-h-[90vh]"
      >
        {/* Profile Photo Section */}
        <div className="flex flex-col items-center gap-2 mb-2">
          <div className="relative w-24 h-24 mb-2">
            <div className="w-24 h-24 rounded-full border-4 border-blue-400 shadow-lg bg-white flex items-center justify-center overflow-hidden ring-2 ring-blue-300 animate-in fade-in duration-300"
              style={{ boxShadow: '0 0 0 4px #a5b4fc55, 0 4px 24px #6366f1' }}>
              {preview ? (
                <img src={preview} alt="Profile" className="w-24 h-24 rounded-full object-cover" />
              ) : (
                <span className="text-4xl font-extrabold text-blue-700">{getInitial(form.fullName)}</span>
              )}
          </div>
            <label htmlFor="profileImage" className="absolute bottom-0 right-0 bg-gradient-to-r from-blue-500 to-indigo-500 p-2 rounded-full shadow-lg cursor-pointer border-2 border-white">
              <FiCamera className="text-black text-lg" />
            <input type="file" id="profileImage" className="hidden" accept="image/*" onChange={handleImageChange} />
          </label>
          </div>
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={() => document.getElementById('profileImage').click()}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg shadow hover:bg-blue-700 border border-white/20 text-sm"
            >Change Photo</button>
          <button
            type="button"
            onClick={handleUploadImage}
            disabled={!selectedFile || uploading}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold rounded-lg shadow-lg disabled:opacity-60 flex items-center gap-2"
          >
              {uploading ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span> : <FiUpload className="text-base text-black" />}
              Upload Photo
          </button>
          </div>
        </div>
        {/* Personal Info Section */}
        <div>
          <div className="font-extrabold text-xl mb-2 text-black">Personal Information</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            <div className="flex flex-col gap-1">
              <label className="font-bold mb-1 text-black">Full Name</label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-black" />
          <input
            type="text"
            name="fullName"
                  value={form.fullName}
            onChange={handleChange}
                  className="w-full pl-10 pr-3 py-3 bg-white text-black border border-white/20 ring-2 ring-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-base font-semibold shadow-inner placeholder-black"
            required
                  placeholder="Full Name"
          />
        </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-bold mb-1 text-black">Mobile Number</label>
              <div className="relative">
                <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-black" />
          <input
              type="tel"
            name="phone"
                  value={form.phone}
              onChange={handleChange}
                  className="w-full pl-10 pr-3 py-3 bg-white text-black border border-white/20 ring-2 ring-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-base font-semibold shadow-inner placeholder-black"
              required
                  placeholder="Mobile Number"
            />
          </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-bold mb-1 text-black">WhatsApp Number</label>
              <div className="relative">
                <FiMessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-black" />
            <input
              type="tel"
              name="whatsapp"
                  value={form.whatsapp}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-3 bg-white text-black border border-white/20 ring-2 ring-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-base font-semibold shadow-inner placeholder-black"
                  required
                  placeholder="WhatsApp Number"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-bold mb-1 text-black">Email</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-black" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
              onChange={handleChange}
                  className="w-full pl-10 pr-3 py-3 bg-white text-black border border-white/20 ring-2 ring-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-base font-semibold shadow-inner placeholder-black"
              required
                  placeholder="Email"
            />
              </div>
            </div>
          </div>
        </div>
        {/* Payment Details Section */}
          <div>
          <div className="font-extrabold text-xl mb-2 mt-4 flex items-center gap-2 text-black"><FiCreditCard className="text-black" /> Payment Method</div>
          <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-col gap-1">
              <label className="font-bold mb-1 text-black">Select Payment Method</label>
              <div className="relative">
                <FiCreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-black" />
                <select
                  name="paymentMethodType"
                  value={form.paymentMethod.type}
                  onChange={handlePaymentMethodType}
                  className="w-full pl-10 pr-3 py-3 bg-white text-black border border-white/20 ring-2 ring-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-base font-semibold shadow-inner cursor-pointer"
                  required
                >
                  <option value="" className="text-black bg-white">Select Payment Method</option>
                  <option value="PhonePe" className="text-black bg-white">PhonePe</option>
                  <option value="Google Pay" className="text-black bg-white">GPay</option>
                  <option value="UPI" className="text-black bg-white">UPI</option>
                  <option value="Bank" className="text-black bg-white">Bank Account</option>
                </select>
              </div>
            </div>
            <AnimatePresence mode="wait">
              {form.paymentMethod.type === 'PhonePe' && (
                <motion.div
                  key="phonepe"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col gap-1"
                >
                  <label className="font-semibold mb-1 text-black">PhonePe Number</label>
                  <div className="relative">
                    <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-black" />
                    <input
                      type="tel"
                      name="phonePeNumber"
                      value={form.paymentMethod.phonePeNumber}
                      onChange={handlePaymentField}
                      className="w-full pl-10 pr-3 py-3 bg-white text-black border border-white/20 ring-2 ring-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-base font-semibold shadow-inner placeholder-black"
                      placeholder="PhonePe Number"
                      required
                    />
                  </div>
                </motion.div>
              )}
              {form.paymentMethod.type === 'Google Pay' && (
                <motion.div
                  key="gpay"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col gap-1"
                >
                  <label className="font-semibold mb-1 text-black">GPay Number</label>
                  <div className="relative">
                    <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-black" />
                    <input
                      type="tel"
                      name="gpayNumber"
                      value={form.paymentMethod.gpayNumber}
                      onChange={handlePaymentField}
                      className="w-full pl-10 pr-3 py-3 bg-white text-black border border-white/20 ring-2 ring-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-base font-semibold shadow-inner placeholder-black"
                      placeholder="GPay Number"
                      required
                    />
                  </div>
                </motion.div>
              )}
              {form.paymentMethod.type === 'UPI' && (
                <motion.div
                  key="upi"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col gap-1"
                >
                  <label className="font-semibold mb-1 text-black">UPI ID</label>
                  <div className="relative">
                    <FiHash className="absolute left-3 top-1/2 -translate-y-1/2 text-black" />
                    <input
                      type="text"
                      name="upiId"
                      value={form.paymentMethod.upiId}
                      onChange={handlePaymentField}
                      className="w-full pl-10 pr-3 py-3 bg-white text-black border border-white/20 ring-2 ring-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-base font-semibold shadow-inner placeholder-black"
                      placeholder="UPI ID"
                      required
                    />
                  </div>
                </motion.div>
              )}
              {form.paymentMethod.type === 'Bank' && (
                <motion.div
                  key="bank"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold mb-1 text-black">Account Number</label>
                    <div className="relative">
                      <FiKey className="absolute left-3 top-1/2 -translate-y-1/2 text-black" />
            <input
              type="text"
                        name="accountNumber"
                        value={form.paymentMethod.bank.accountNumber}
                        onChange={handleBankField}
                        className="w-full pl-10 pr-3 py-3 bg-white text-black border border-white/20 ring-2 ring-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-base font-semibold shadow-inner placeholder-black"
                        placeholder="Account Number"
              required
            />
          </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold mb-1 text-black">IFSC Code</label>
                    <div className="relative">
                      <FiHash className="absolute left-3 top-1/2 -translate-y-1/2 text-black" />
              <input
                        type="text"
                        name="ifscCode"
                        value={form.paymentMethod.bank.ifscCode}
                        onChange={handleBankField}
                        className="w-full pl-10 pr-3 py-3 bg-white text-black border border-white/20 ring-2 ring-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-base font-semibold shadow-inner placeholder-black"
                        placeholder="IFSC Code"
                        required
              />
            </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold mb-1 text-black">Bank Name</label>
                    <div className="relative">
                      <FiCreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-black" />
              <input
                type="text"
                        name="bankName"
                        value={form.paymentMethod.bank.bankName}
                        onChange={handleBankField}
                        className="w-full pl-10 pr-3 py-3 bg-white text-black border border-white/20 ring-2 ring-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-base font-semibold shadow-inner placeholder-black"
                        placeholder="Bank Name"
                        required
              />
            </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold mb-1 text-black">Account Holder Name</label>
                    <div className="relative">
                      <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-black" />
              <input
                type="text"
                        name="accountHolder"
                        value={form.paymentMethod.bank.accountHolder}
                        onChange={handleBankField}
                        className="w-full pl-10 pr-3 py-3 bg-white text-black border border-white/20 ring-2 ring-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-base font-semibold shadow-inner placeholder-black"
                        placeholder="Account Holder Name"
                        required
              />
            </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        {/* Save Button */}
        <button
          type="submit"
          disabled={submitting || JSON.stringify(form) === JSON.stringify(profile)}
          className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold rounded-xl shadow-lg hover:from-blue-600 hover:to-blue-700 transition flex items-center justify-center gap-2 text-lg mt-2 disabled:opacity-60"
        >
          {submitting ? <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span> : <FiSave className="text-xl" />}
            {submitting ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

export default ProfileUpdate;