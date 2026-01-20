<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { firebaseStorageService } from '../../services/firebaseStorageService';
import { authGuardService } from '../../services/authGuardService';
=======
import React, { useState } from 'react';
import { db, storage } from '../../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { createDirectImageUrl } from '../../utils/firebaseStorageUtils';
import { uploadImage } from '../../utils/uploadImage';
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5

const EpinRequestForm = () => {
  const { user } = useAuth();
  const [quantity, setQuantity] = useState('');
  const [bonus, setBonus] = useState(0);
  const [totalEpins, setTotalEpins] = useState(0);
  const [amountPaid, setAmountPaid] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [loading, setLoading] = useState(false);
<<<<<<< HEAD
  const [upiQrImageUrl, setUpiQrImageUrl] = useState(null);
  const [qrImageLoading, setQrImageLoading] = useState(true);
=======
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5

  const epinPrice = 100; // Assuming 1 E-PIN costs ₹100

  const comboOffers = {
    10: 1,
    15: 2,
    25: 4,
    50: 10,
  };

<<<<<<< HEAD
  // Fetch admin/system UPI QR image URL from Firestore
  useEffect(() => {
    const fetchSystemConfig = async () => {
      try {
        setQrImageLoading(true);
        const configDoc = await getDoc(doc(db, 'systemConfig', 'upiSettings'));
        
        if (configDoc.exists()) {
          const configData = configDoc.data();
          if (configData.upiQrImageUrl) {
            setUpiQrImageUrl(configData.upiQrImageUrl);
            console.log("UPI QR URL:", configData.upiQrImageUrl);
          } else {
            console.warn('UPI QR image URL not found in system configuration');
            setUpiQrImageUrl(null);
          }
        } else {
          console.warn('System configuration document not found');
          setUpiQrImageUrl(null);
        }
      } catch (error) {
        console.error('Error fetching system configuration:', error);
      } finally {
        setQrImageLoading(false);
      }
    };

    fetchSystemConfig();
  }, []);

=======
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
  const handleQuantityChange = (e) => {
    const qty = parseInt(e.target.value);
    setQuantity(qty);

    if (comboOffers[qty]) {
      setBonus(comboOffers[qty]);
    } else {
      setBonus(0);
    }
    setTotalEpins(qty + bonus);
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setPaymentScreenshot(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error('You must be logged in to make a request.');
      return;
    }

    if (!utrNumber || !paymentScreenshot) {
<<<<<<< HEAD
      toast.error('Please provide UTR Number and upload payment screenshot.');
=======
      toast.error('Please provide UTR Number and upload a payment screenshot.');
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
      return;
    }

    setLoading(true);
    try {
<<<<<<< HEAD
      // Check authentication before proceeding
      if (!authGuardService.isAuthenticated()) {
        toast.error('Please log in to submit E-PIN requests.');
        return;
      }

      let paymentScreenshotUrl = '';
      
      if (paymentScreenshot) {
        try {
          // Validate file before upload
          firebaseStorageService.validateFile(paymentScreenshot, {
            maxSize: 5 * 1024 * 1024, // 5MB limit
            allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
          });

          // Upload using new storage service with proper path structure
          paymentScreenshotUrl = await firebaseStorageService.uploadEPinScreenshot(paymentScreenshot, user.uid);
          console.log('E-PIN screenshot uploaded successfully:', paymentScreenshotUrl);
        } catch (uploadError) {
          console.error('Error uploading screenshot:', uploadError);
          toast.error(`Screenshot upload failed: ${uploadError.message}`);
          return;
        }
=======
      let paymentScreenshotUrl = '';
      if (paymentScreenshot) {
        const timestamp = Date.now();
        const fileName = `${timestamp}-${paymentScreenshot.name}`;
        const path = `epinScreenshots/${user.uid}/${fileName}`;
        paymentScreenshotUrl = await uploadImage(paymentScreenshot, path);
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
      }

      await addDoc(collection(db, 'epinRequests'), {
        userId: user.uid,
        quantityRequested: quantity,
        quantityBonus: bonus,
        totalEpins: quantity + bonus,
        paymentMethod: 'UPI',
        upiId: 'helpingpin@axl',
<<<<<<< HEAD
        amountPaid: amountPaid,
        utrNumber: utrNumber,
        paymentScreenshotUrl: paymentScreenshotUrl, // This is now a proper Firebase Storage download URL
=======
        qrCodeUrl: 'https://freeimage.host/i/FuYNU3N',
        amountPaid: amountPaid,
        utrNumber: utrNumber,
        paymentScreenshotUrl: paymentScreenshotUrl,
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      // Send notification to admins about new EPIN request
      try {
        const { sendNotification } = await import('../../../context/NotificationContext');
        await sendNotification({
          title: 'New E-PIN Request',
          message: `${user.displayName || user.email} has requested ${quantity + bonus} E-PINs (₹${amountPaid})`,
          type: 'admin',
          priority: 'medium',
          actionLink: '/admin/epin-requests',
          targetRole: 'admin'
        });
      } catch (notificationError) {
        console.error('Error sending admin notification:', notificationError);
      }

      toast.success('E-PIN request submitted successfully!');
      // Reset form
      setQuantity('');
      setBonus(0);
      setTotalEpins(0);
      setAmountPaid('');
      setUtrNumber('');
      setPaymentScreenshot(null);
    } catch (error) {
      console.error('Error submitting E-PIN request:', error);
      toast.error('Failed to submit E-PIN request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-6 text-center">E-PIN Request Form</h2>
      <form onSubmit={handleSubmit}>
        {/* Step 1: Quantity Selection */}
        <div className="mb-4">
          <label htmlFor="quantity" className="block text-gray-700 text-sm font-bold mb-2">
            Quantity Requested:
          </label>
          <input
            type="number"
            id="quantity"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="e.g., 10, 15, 25, 50 or custom"
            value={quantity}
            onChange={handleQuantityChange}
            min="1"
            required
          />
          {bonus > 0 && (
            <p className="text-sm text-green-600 mt-1">You get {bonus} bonus E-PIN(s)!</p>
          )}
          {quantity > 0 && (
            <p className="text-sm text-gray-600 mt-1">Total E-PINs: {quantity + bonus}</p>
          )}
        </div>

        {/* Step 2: Payment Section */}
        {quantity > 0 && (
          <div className="mb-4 p-4 border rounded-md bg-gray-50">
            <h3 className="text-lg font-semibold mb-2">Payment Details</h3>
            <p className="text-gray-700">UPI ID: <span className="font-medium">helpingpin@axl</span></p>
            <div className="my-4 flex justify-center">
<<<<<<< HEAD
              {qrImageLoading ? (
                <div className="w-48 h-48 flex items-center justify-center bg-gray-100 border border-gray-300 rounded">
                  <span className="text-gray-500">Loading QR Code...</span>
                </div>
              ) : upiQrImageUrl ? (
                <img 
                  src={upiQrImageUrl} 
                  alt="UPI QR Code" 
                  className="w-48 h-48 object-contain" 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center bg-gray-100 border border-gray-300 rounded text-gray-500 text-center">
                  QR Code not available
                </div>
              )}
=======
              <img src="https://freeimage.host/i/FuYNU3N" alt="UPI QR Code" className="w-48 h-48 object-contain" />
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
            </div>
            <p className="text-gray-700">Total Amount to Pay: <span className="font-medium">₹{(quantity + bonus) * epinPrice}</span></p>
            <input
              type="number"
              id="amountPaid"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mt-2"
              placeholder="Amount Paid (e.g., 1000)"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              required
            />
          </div>
        )}

        {/* Step 3: Payment Details (UTR & Screenshot) */}
        {quantity > 0 && (
          <div className="mb-4">
            <label htmlFor="utrNumber" className="block text-gray-700 text-sm font-bold mb-2">
              UTR Number:
            </label>
            <input
              type="text"
              id="utrNumber"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter UTR Number"
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value)}
              required
            />
          </div>
        )}

        {quantity > 0 && (
          <div className="mb-6">
            <label htmlFor="paymentScreenshot" className="block text-gray-700 text-sm font-bold mb-2">
              Payment Screenshot:
            </label>
            <input
              type="file"
              id="paymentScreenshot"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
              required
            />
            {paymentScreenshot && (
              <p className="text-sm text-gray-600 mt-1">Selected file: {paymentScreenshot.name}</p>
            )}
          </div>
        )}

        {/* Step 4: Submit */}
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit E-PIN Request'}
        </button>
      </form>
    </div>
  );
};

export default EpinRequestForm;