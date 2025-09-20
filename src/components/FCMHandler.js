import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import messagingService from '../config/firebase-messaging';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import toast from 'react-hot-toast';

const FCMHandler = ({ children }) => {
  const { user } = useAuth();

  useEffect(() => {
    const initializeFCM = async () => {
      if (!user) return;

      try {
        // Request notification permission and get FCM token
        const hasPermission = await messagingService.requestPermission();
        
        if (hasPermission) {
          const token = await messagingService.getToken();
          
          if (token) {
            // Store token in backend
            try {
              const response = await fetch(`http://localhost:3001/api/user/${user.uid}/token`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token })
              });

              if (response.ok) {
                console.log('FCM token stored successfully');
              } else {
                console.error('Failed to store FCM token');
              }
            } catch (error) {
              console.error('Error storing FCM token:', error);
            }

            // Also update user document with FCM token for backward compatibility
            try {
              const userRef = doc(db, 'users', user.uid);
              await updateDoc(userRef, {
                fcmToken: token,
                lastTokenUpdate: new Date()
              });
            } catch (error) {
              console.error('Error updating user document with FCM token:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error initializing FCM:', error);
      }
    };

    const setupMessageListener = () => {
      // Setup foreground message listener
      const unsubscribe = messagingService.onForegroundMessage((payload) => {
        console.log('Foreground message received:', payload);
        
        // Show toast notification for foreground messages
        if (payload.notification) {
          const isChat = payload.data?.type === 'chat' || payload.data?.chatId;
          
          toast.success(
            `${payload.notification.title}: ${payload.notification.body}`,
            {
              duration: isChat ? 8000 : 5000,
              icon: isChat ? '💬' : '🔔',
              onClick: () => {
                // Handle notification click - could navigate to chat
                if (isChat && payload.data?.chatId) {
                  console.log('Navigate to chat:', payload.data.chatId);
                  // You can add navigation logic here
                }
              }
            }
          );
        }
      });

      return unsubscribe;
    };

    // Initialize FCM when user is authenticated
    if (user) {
      initializeFCM();
      const unsubscribe = setupMessageListener();
      
      // Cleanup listener on unmount
      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    }
  }, [user]);

  return children;
};

export default FCMHandler;