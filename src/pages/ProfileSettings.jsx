import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import ProfileSettingsUI from '../components/profile/ProfileSettingsUI';
import { DEFAULT_PROFILE_IMAGE } from '../utils/profileUtils';

const ProfileSettings = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.uid) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserProfile({
            ...userData,
            email: user.email, // Ensure email is always from auth
            profileImage: userData.profileImage || DEFAULT_PROFILE_IMAGE
          });
        } else {
          // Set default profile data if document doesn't exist
          setUserProfile({
            email: user.email,
            profileImage: DEFAULT_PROFILE_IMAGE,
            fullName: '',
            phone: '',
            whatsapp: '',
            bankName: '',
            accountNumber: '',
            ifscCode: '',
            upiId: ''
          });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  // Handle form field changes
  const handleChange = (fieldName, value) => {
    setUserProfile(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  // Handle profile image upload
  const handleUploadAvatar = async (file) => {
    if (!file || !user?.uid) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, or WebP)');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    try {
      setIsSaving(true);
      toast.loading('Uploading profile image...', { id: 'upload' });

      // Create storage reference with .jpg extension
      const storageRef = ref(storage, `profileImages/${user.uid}.jpg`);
      
      // Upload file
      await uploadBytes(storageRef, file);
      
      // Get download URL
      const photoURL = await getDownloadURL(storageRef);
      
      // Update Firestore with new photo URL
      await updateDoc(doc(db, 'users', user.uid), {
        profileImage: photoURL
      });
      
      // Update local state
      setUserProfile(prev => ({
        ...prev,
        profileImage: photoURL
      }));
      
      toast.success('Profile image updated successfully!', { id: 'upload' });
    } catch (error) {
      console.error('Error uploading profile image:', error);
      toast.error('Failed to upload profile image. Please try again.', { id: 'upload' });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle form save
  const handleSave = async () => {
    if (!user?.uid) {
      toast.error('User not authenticated');
      return;
    }

    try {
      setIsSaving(true);
      toast.loading('Saving profile...', { id: 'save' });

      // Prepare data for Firestore (exclude email as it's read-only)
      const { email, ...profileData } = userProfile;
      
      // Update Firestore
      await updateDoc(doc(db, 'users', user.uid), profileData);
      
      toast.success('Profile updated successfully!', { id: 'save' });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile. Please try again.', { id: 'save' });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle form cancel/reset
  const handleCancel = () => {
    // Reload the original data
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <ProfileSettingsUI
      user={userProfile}
      onChange={handleChange}
      onSave={handleSave}
      onCancel={handleCancel}
      onUploadAvatar={handleUploadAvatar}
      isSaving={isSaving}
    />
  );
};

export default ProfileSettings;