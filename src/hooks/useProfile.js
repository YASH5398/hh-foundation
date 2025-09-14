import { useState, useEffect, useCallback } from 'react';
import { db, storage } from '../config/firebase';
import { doc, getDoc, updateDoc, onSnapshot, increment } from 'firebase/firestore';
import { ref, uploadBytes } from 'firebase/storage';
import { createDirectImageUrl } from '../utils/firebaseStorageUtils';
import { getSocialTasks, updateSocialTask } from '../services/userService';

const useProfile = () => {
  const [profile, setProfile] = useState(null);

  // Fetch user profile from Firestore
  const fetchUserProfile = useCallback(async (uid) => {
    if (!uid) return;
    const userDoc = await getDoc(doc(db, 'users', uid));
    setProfile(userDoc.exists() ? userDoc.data() : null);
  }, []);

  // Update user profile (only allowed fields, using correct Firestore field paths)
  const updateUserProfile = useCallback(async (uid, data) => {
    if (!uid) return { success: false, message: 'No UID' };
    const updateData = {};
    // Flat fields
    if (data.fullName !== undefined && data.fullName !== null) updateData['fullName'] = data.fullName;
    if (data.phone !== undefined && data.phone !== null) updateData['phone'] = data.phone;
    if (data.whatsapp !== undefined && data.whatsapp !== null) updateData['whatsapp'] = data.whatsapp;
    if (data.email !== undefined && data.email !== null) updateData['email'] = data.email;
    if (data.profilePhoto !== undefined && data.profilePhoto !== null) updateData['profilePhoto'] = data.profilePhoto;
    // Payment method
    if (data.paymentMethod) {
      if (data.paymentMethod.type) updateData['paymentMethod.type'] = data.paymentMethod.type;
      if (data.paymentMethod.type === 'PhonePe' && data.paymentMethod.phonePeNumber)
        updateData['paymentMethod.phonePeNumber'] = data.paymentMethod.phonePeNumber;
      if (data.paymentMethod.type === 'Google Pay' && data.paymentMethod.gpayNumber)
        updateData['paymentMethod.gpayNumber'] = data.paymentMethod.gpayNumber;
      if (data.paymentMethod.type === 'UPI' && data.paymentMethod.upiId)
        updateData['paymentMethod.upiId'] = data.paymentMethod.upiId;
      if (data.paymentMethod.type === 'Bank' && data.paymentMethod.bank) {
        const bank = data.paymentMethod.bank;
        if (bank.accountHolder) updateData['paymentMethod.bank.accountHolder'] = bank.accountHolder;
        if (bank.bankName) updateData['paymentMethod.bank.bankName'] = bank.bankName;
        if (bank.ifscCode) updateData['paymentMethod.bank.ifscCode'] = bank.ifscCode;
        if (bank.accountNumber) updateData['paymentMethod.bank.accountNumber'] = bank.accountNumber;
      }
    }
    updateData.updatedAt = new Date();
    try {
      await updateDoc(doc(db, 'users', uid), updateData);
      setProfile((prev) => ({ ...prev, ...updateData }));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }, []);

  // Upload profile photo to Firebase Storage and return public URL
  const uploadProfilePhoto = useCallback(async (uid, file) => {
    if (!uid || !file) return '';
    const timestamp = Date.now();
    const fileName = `${timestamp}.jpg`;
    const storageRef = ref(storage, `profileImages/${uid}/${fileName}`);
    await uploadBytes(storageRef, file);
    
    // Create direct public URL instead of using getDownloadURL
    const url = createDirectImageUrl(uid, fileName, 'profileImages');
    return url;
  }, []);

  return {
    profile,
    setProfile,
    fetchUserProfile,
    updateUserProfile,
    uploadProfilePhoto,
  };
};

export function useSocialTasks(uid) {
  const [tasks, setTasks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    setError('');
    const ref = doc(db, 'tasks', uid);
    const unsubscribe = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setTasks(snap.data());
      } else {
        setTasks(null);
      }
      setLoading(false);
    }, (err) => {
      setError('Failed to load social tasks');
      setLoading(false);
    });
    return () => unsubscribe();
  }, [uid]);

  const completeTask = async (taskKey) => {
    if (!uid || !taskKey) return;
    const ref = doc(db, 'tasks', uid);
    // Prevent duplicate update if already completed
    if (tasks && tasks[taskKey]) return;
    const updateObj = {
      [taskKey]: true,
      [`taskDetails.${taskKey}`]: new Date(),
    };
    // Only increment if not already completed
    if (!tasks || !tasks[taskKey]) {
      updateObj.taskScore = increment(1);
    }
    try {
      await updateDoc(ref, updateObj);
    } catch (e) {
      setError('Failed to update task');
    }
  };

  return { tasks, loading, error, completeTask };
}

export default useProfile; 