import React, { useState } from 'react';
import { db } from '../../config/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const SystemConfigSetup = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const setupSystemConfig = async () => {
    if (!user) {
      toast.error('You must be logged in as an admin');
      return;
    }

    setLoading(true);
    try {
      console.log('🔧 Creating systemConfig/upiSettings document...');
      
      await setDoc(doc(db, 'systemConfig', 'upiSettings'), {
        upiQrImageUrl: 'https://firebasestorage.googleapis.com/v0/b/hh-foundation.firebasestorage.app/o/Screenshot_2026-01-06-12-03-30-81_944a2809ea1b4cda6ef12d1db9048ed3_wdcjbj.jpg?alt=media&token=91921fd6-451f-4163-a6f4-30e8716ecea1',
        phonePe: '6299261088',
        gpay: '6299261088',
        paytm: '6299261088',
        upiId: 'helpingpin@axl',
        description: 'System UPI configuration for E-PIN payments',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      toast.success('✅ System configuration created successfully!');
      console.log('✅ systemConfig/upiSettings document created');
      console.log('✅ All UPI payment fields are set');
      
    } catch (error) {
      console.error('❌ Error:', error);
      toast.error('Failed to create system configuration: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Setup System Configuration</h2>
      <p className="text-gray-700 mb-4">
        This will create the Firestore document needed for E-PIN QR code display.
      </p>
      
      <button
        onClick={setupSystemConfig}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Setting up...' : 'Create systemConfig/upiSettings'}
      </button>

      <div className="mt-6 p-4 bg-blue-50 rounded text-sm text-blue-900">
        <h3 className="font-bold mb-2">What this creates:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Collection: <code>systemConfig</code></li>
          <li>Document: <code>upiSettings</code></li>
          <li>Field: <code>upiQrImageUrl</code> (QR image)</li>
          <li>Field: <code>phonePe</code> (UPI number)</li>
          <li>Field: <code>gpay</code> (UPI number)</li>
          <li>Field: <code>paytm</code> (UPI number)</li>
          <li>Field: <code>upiId</code> (UPI ID)</li>
        </ul>
      </div>
    </div>
  );
};

export default SystemConfigSetup;
