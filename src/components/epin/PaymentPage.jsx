// NOTE:
// This is a FULLY CORRECTED, MINIMAL, and ROBUST version of PaymentPage
// focused on GUARANTEED QR rendering and APP REDIRECTION with FALLBACKS.

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiCreditCard, FiCheck, FiCopy, FiSmartphone, FiShield } from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { createNotification } from '../../services/notificationService';
import { uploadImage } from '../../services/storageUpload';

// Brand Icons
const PhonePeLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
    <path d="M19.5 4.5H4.5A2.25 2.25 0 002.25 6.75v10.5A2.25 2.25 0 004.5 19.5h15A2.25 2.25 0 0021.75 17.25V6.75A2.25 2.25 0 0019.5 4.5zM12 15.75c-2.07 0-3.75-1.68-3.75-3.75s1.68-3.75 3.75-3.75 3.75 1.68 3.75 3.75-1.68 3.75-3.75 3.75z" />
  </svg>
);

const GPayLogo = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const PaytmLogo = () => (
  <div className="font-bold text-xl tracking-tighter">
    <span className="text-[#002e6e]">Pay</span><span className="text-[#00baf2]">tm</span>
  </div>
);

// Fallback / Hardcoded Defaults
const DEFAULT_PAYMENT_CONFIG = {
  vpa: 'helpingpin@axl',
  name: 'HelpingHands E-PIN',
  phone: '6299261088',
  defaultQr: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=helpingpin@axl&pn=HelpingHands&am=0&cu=INR'
  // Note: We use a dynamic generation or placeholder if system config missing. 
  // Ideally, use a static asset, but for resilience, we direct value.
};

export default function PaymentPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const selectedPackage = location.state?.selectedPackage;

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [upiQrImageUrl, setUpiQrImageUrl] = useState(null);
  const [qrImageLoading, setQrImageLoading] = useState(true);

  // Initialize with fallback defaults to prevent "Missing Config" errors
  const [upiDetails, setUpiDetails] = useState({
    vpa: DEFAULT_PAYMENT_CONFIG.vpa,
    name: DEFAULT_PAYMENT_CONFIG.name,
    phone: DEFAULT_PAYMENT_CONFIG.phone
  });

  const pricePerEpin = 60;

  // Detect Mobile
  const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  useEffect(() => {
    const fetchSystemConfig = async () => {
      try {
        setQrImageLoading(true);
        const configDoc = await getDoc(doc(db, 'systemConfig', 'upiSettings'));

        if (configDoc.exists()) {
          const configData = configDoc.data();

          setUpiDetails({
            vpa: configData.upiId || configData.vpa || DEFAULT_PAYMENT_CONFIG.vpa,
            name: configData.payeeName || DEFAULT_PAYMENT_CONFIG.name,
            phone: configData.payeePhone || DEFAULT_PAYMENT_CONFIG.phone
          });

          if (configData.upiQrImageUrl) {
            setUpiQrImageUrl(configData.upiQrImageUrl);
          } else {
            // Generate dynamic QR if missing using the VPA
            // This ensures a QR is always visible
            setUpiQrImageUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${configData.upiId || DEFAULT_PAYMENT_CONFIG.vpa}&pn=${configData.payeeName || DEFAULT_PAYMENT_CONFIG.name}&cu=INR`)}`);
          }
        } else {
          // Document missing - Use Defaults silently
          console.warn("Payment config missing, using fallbacks.");
          setUpiQrImageUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${DEFAULT_PAYMENT_CONFIG.vpa}&pn=${DEFAULT_PAYMENT_CONFIG.name}&cu=INR`)}`);
        }
      } catch (error) {
        console.error('Error fetching system configuration:', error);
        // Fallback QR
        setUpiQrImageUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${DEFAULT_PAYMENT_CONFIG.vpa}&pn=${DEFAULT_PAYMENT_CONFIG.name}&cu=INR`)}`);
      } finally {
        setQrImageLoading(false);
      }
    };

    fetchSystemConfig();
  }, []);

  const handlePaymentAppRedirect = (app) => {
    // Rely on state which is initialized with fallbacks
    const { vpa, name } = upiDetails;

    if (!vpa) {
      return toast.error("Payment setup incomplete.");
    }

    const amount = (selectedPackage.paid * pricePerEpin).toFixed(2);
    const note = "EPIN Purchase";

    // Base UPI Params
    const params = `pa=${vpa}&pn=${encodeURIComponent(name)}&am=${amount}&tn=${encodeURIComponent(note)}&cu=INR`;

    let url = `upi://pay?${params}`;

    if (app === 'PhonePe') {
      url = `phonepe://pay?${params}`;
    } else if (app === 'GPay') {
      url = `tez://upi/pay?${params}`;
    } else if (app === 'Paytm') {
      url = `paytmmp://pay?${params}`;
    }

    if (isMobile()) {
      window.location.href = url;
    } else {
      navigator.clipboard.writeText(vpa).then(() => {
        toast.success("UPI ID Copied!");
        toast(`Pay ₹${amount} via ${app} or any UPI App`, { icon: '📱' });
      });
    }
  };

  useEffect(() => {
    if (!selectedPackage) {
      navigate('/dashboard/epins/request');
    }
  }, [navigate, selectedPackage]);

  if (!selectedPackage) return null;

  const totalPrice = selectedPackage.paid * pricePerEpin;

  const handleSubmitRequest = async (e) => {
    e.preventDefault();

    if (!user?.uid) return toast.error('User not authenticated');
    if (!utrNumber.trim()) return toast.error('Enter UTR number');
    if (!screenshot) return toast.error('Upload payment screenshot');

    setLoading(true);

    try {
      const paymentScreenshotUrl = await uploadImage(screenshot, `epin-screenshots/${user.uid}`);

      const docRef = await addDoc(collection(db, 'epinRequests'), {
        userId: user.uid,
        userEmail: user.email,
        packageDetails: selectedPackage,
        totalAmount: totalPrice,
        utrNumber: utrNumber.trim(),
        paymentScreenshotUrl,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await createNotification({
        uid: user.uid,
        userId: user.userId || user.uid,
        title: 'E-PIN Request Submitted',
        message: `Your E-PIN request of ₹${totalPrice} was submitted.`,
        type: 'success',
        category: 'epin_request',
        data: { requestId: docRef.id },
      });

      toast.success('Request submitted successfully');
      navigate('/dashboard/epins/request');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 text-gray-900 dark:text-gray-100">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-600 dark:text-gray-300 hover:bg-white p-2 rounded-full transition-all"> <FiArrowLeft size={20} /> </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Complete Payment</h1>
        </div>

        {/* Summary Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Payable Amount</p>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">₹{totalPrice.toLocaleString()}</div>
            </div>
            <div className="bg-blue-50 text-blue-700 font-bold px-4 py-2 rounded-xl border border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
              {selectedPackage.total} E-PINs
            </div>
          </div>
        </div>

        {!showPaymentForm ? (
          <>
            {/* Split Layout */}
            <div className="grid md:grid-cols-2 gap-6">

              {/* Left: Quick Pay Apps */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <FiSmartphone className="text-gray-400" />
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Instant Pay (Auto-Fill)</h3>
                </div>

                <button
                  onClick={() => handlePaymentAppRedirect('PhonePe')}
                  className="w-full bg-[#5f259f] hover:bg-[#4d1e82] text-white p-4 rounded-xl shadow-lg shadow-purple-200 dark:shadow-purple-900/20 flex items-center justify-between transition-all active:scale-[0.98] group"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-white/10 p-2 rounded-lg"><PhonePeLogo /></div>
                    <span className="font-bold text-lg">PhonePe</span>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] opacity-80">Pay to</div>
                    <div className="font-mono text-xs font-bold">{upiDetails.phone}</div>
                  </div>
                </button>

                <button
                  onClick={() => handlePaymentAppRedirect('GPay')}
                  className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-500 text-gray-800 dark:text-white p-4 rounded-xl shadow-sm flex items-center justify-between transition-all active:scale-[0.98] group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700"><GPayLogo /></div>
                    <span className="font-bold text-lg">Google Pay</span>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-gray-400">Pay to</div>
                    <div className="font-mono text-xs font-bold text-gray-600 dark:text-gray-400">{upiDetails.phone}</div>
                  </div>
                </button>

                <button
                  onClick={() => handlePaymentAppRedirect('Paytm')}
                  className="w-full bg-[#00baf2] hover:bg-[#00a6d9] text-white p-4 rounded-xl shadow-lg shadow-cyan-200 dark:shadow-cyan-900/20 flex items-center justify-between transition-all active:scale-[0.98] group"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-white p-2 rounded-lg h-10 flex items-center justify-center min-w-[3rem]"><PaytmLogo /></div>
                    <span className="font-bold text-lg">Paytm</span>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] opacity-80">Pay to</div>
                    <div className="font-mono text-xs font-bold">{upiDetails.phone}</div>
                  </div>
                </button>

                <button
                  onClick={() => handlePaymentAppRedirect('UPI')}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white p-4 rounded-xl shadow-lg shadow-orange-200 dark:shadow-orange-900/20 flex items-center justify-between transition-all active:scale-[0.98] group"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-2 rounded-lg"><FiSmartphone className="w-6 h-6" /></div>
                    <span className="font-bold text-lg">Other UPI Apps</span>
                  </div>
                  <FiCheck className="opacity-0 group-hover:opacity-100 transition-opacity text-white/50" />
                </button>
              </div>

              {/* Right: Manual / QR */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <FiCopy className="text-gray-400" />
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Scan or Copy</h3>
                </div>

                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                  {qrImageLoading ? (
                    <div className="w-48 h-48 flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl animate-pulse">Loading QR...</div>
                  ) : upiQrImageUrl ? (
                    <div className="bg-white p-3 rounded-xl shadow-inner border border-gray-100">
                      <img src={upiQrImageUrl} alt="UPI QR" className="w-48 h-48 object-contain mix-blend-multiply" />
                    </div>
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl">QR Unavailable</div>
                  )}
                  <p className="text-xs font-semibold text-gray-400 mt-4 uppercase tracking-widest">Scan to Pay</p>
                </div>

                <button
                  onClick={() => {
                    if (upiDetails.vpa) {
                      navigator.clipboard.writeText(upiDetails.vpa);
                      toast.success("UPI ID Copied!");
                    }
                  }}
                  className="w-full flex items-center justify-between bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 p-4 rounded-xl group hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-gray-800 transition-all cursor-pointer"
                >
                  <div className="text-left overflow-hidden">
                    <p className="text-xs font-bold text-gray-400 uppercase">UPI ID</p>
                    <p className="font-mono font-semibold text-gray-800 dark:text-gray-200 truncate pr-2">{upiDetails.vpa}</p>
                  </div>
                  <FiCopy className="text-gray-400 group-hover:text-blue-500" />
                </button>
              </div>
            </div>

            {/* Confirmation Section */}
            <div className="mt-8 bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="flex items-start gap-4 mb-4">
                <FiShield className="text-green-600 mt-1 shrink-0" />
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm">Action Required</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    After completing the payment in your app, please click the button below to upload proofs.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentForm(true)}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <FiCheck className="w-5 h-5" /> I Have Paid ₹{totalPrice}
              </button>
            </div>
          </>
        ) : (
          /* Form */
          <motion.form
            onSubmit={handleSubmitRequest}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-800 space-y-6"
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <FiCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Verify Payment</h3>
              <p className="text-sm text-gray-500">Provide details to activate your E-PINs</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">UTR / Ref Number</label>
              <input
                className="w-full border rounded-xl p-4 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-mono placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 border-gray-200 dark:border-gray-700"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                placeholder="e.g. 3314XXXXXX78"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Payment Screenshot</label>
              <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setScreenshot(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  required
                />
                <FiCreditCard className="mx-auto text-gray-400 w-8 h-8 mb-2" />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {screenshot ? screenshot.name : 'Tap to upload screenshot'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <button
                type="button"
                onClick={() => setShowPaymentForm(false)}
                className="w-full text-gray-600 dark:text-gray-400 font-bold py-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                Go Back
              </button>
              <button
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/20 disabled:opacity-70 transition-all"
              >
                {loading ? 'Verifying...' : 'Submit'}
              </button>
            </div>
          </motion.form>
        )}
      </div>
    </div>
  );
}
