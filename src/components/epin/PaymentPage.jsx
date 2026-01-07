// NOTE:
// This is a FULLY CORRECTED, MINIMAL, and ROBUST version of PaymentPage
// focused on GUARANTEED QR rendering.
// All business logic remains the same.
// Uses Cloudinary for image uploads (FREE tier, no Blaze plan required)

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiCreditCard, FiUpload, FiCheck } from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import notificationService from '../../services/notificationService';
import { uploadImageToCloudinary } from '../../services/cloudinaryService';

const QR_IMAGE_URL = 'https://res.cloudinary.com/dq6hzrfxc/image/upload/v1767681301/Screenshot_2026-01-06-12-03-30-81_944a2809ea1b4cda6ef12d1db9048ed3_wdcjbj.jpg';

export default function PaymentPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const selectedPackage = location.state?.selectedPackage;

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const pricePerEpin = 60;

  if (!selectedPackage) {
    navigate('/dashboard/epins/request');
    return null;
  }

  const totalPrice = selectedPackage.paid * pricePerEpin;

  const handleSubmitRequest = async (e) => {
    e.preventDefault();

    if (!user?.uid) return toast.error('User not authenticated');
    if (!utrNumber.trim()) return toast.error('Enter UTR number');
    if (!screenshot) return toast.error('Upload payment screenshot');

    setLoading(true);

    try {
      // Upload screenshot to Cloudinary (FREE tier, no Firebase Storage)
      const screenshotUrl = await uploadImageToCloudinary(
        screenshot,
        (p) => setUploadProgress(p)
      );

      const docRef = await addDoc(collection(db, 'epinRequests'), {
        userId: user.uid,
        userEmail: user.email,
        packageDetails: selectedPackage,
        totalAmount: totalPrice,
        utrNumber: utrNumber.trim(),
        screenshotUrl,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await notificationService.createNotification({
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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-600"> <FiArrowLeft /> </button>
          <h1 className="text-2xl font-bold">Payment</h1>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-xl p-5 shadow">
          <p className="font-semibold">{selectedPackage.total} E-PINs</p>
          <p className="text-green-600 text-xl font-bold">₹{totalPrice}</p>
        </div>

        {!showPaymentForm ? (
          <>
            {/* Payment Methods */}
            <div className="bg-white rounded-xl p-5 shadow space-y-4">
              <h3 className="font-bold flex items-center gap-2"> <FiCreditCard /> Payment Methods </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {['PhonePe', 'GPay', 'Paytm'].map((m) => (
                  <div key={m} className="border rounded-lg p-3 text-center">
                    <p className="text-sm font-semibold">{m}</p>
                    <p className="font-mono">6299261088</p>
                  </div>
                ))}

                <div className="border rounded-lg p-3 text-center">
                  <p className="text-sm font-semibold">UPI ID</p>
                  <p className="font-mono text-xs">helpingpin@axl</p>
                </div>

                {/* QR – GUARANTEED RENDER */}
                <div className="col-span-2 sm:col-span-1 border rounded-lg p-3">
                  <p className="text-sm font-semibold text-center mb-2">QR Code</p>
                  <div className="w-full h-40 flex items-center justify-center bg-gray-100">
                    <img
                      src={QR_IMAGE_URL}
                      alt="UPI QR"
                      className="w-32 h-32 object-contain"
                      referrerPolicy="no-referrer"
                      loading="eager"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowPaymentForm(true)}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold"
              >
                <FiCheck className="inline mr-2" /> Payment Done
              </button>
            </div>
          </>
        ) : (
          /* Form */
          <motion.form
            onSubmit={handleSubmitRequest}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl p-5 shadow space-y-4"
          >
            <div>
              <label className="text-sm font-semibold">UTR Number</label>
              <input
                className="w-full border rounded p-3"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Payment Screenshot</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setScreenshot(e.target.files[0])}
                required
              />
            </div>

            <button
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold"
            >
              {loading ? 'Submitting…' : 'Submit Request'}
            </button>
          </motion.form>
        )}
      </div>
    </div>
  );
}
