// Firebase Cloud Messaging Service Worker
// This file handles background notifications when the app is not in focus

importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC0tKqfEe2Ij3JKZvloHTYrt5Db97YsoUg",
  authDomain: "hh-foundation.firebaseapp.com",
  databaseURL: "https://hh-foundation-default-rtdb.firebaseio.com",
  projectId: "hh-foundation",
  storageBucket: "hh-foundation.appspot.com",
  messagingSenderId: "310213307250",
  appId: "1:310213307250:web:bcd588790c923ddbdb0beb",
  measurementId: "G-H1J3X51DF0"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('📨 Received background message:', payload);
  
  const notificationTitle = payload.notification?.title || 'New Message';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new message',
    icon: '/logo192.png',
    badge: '/logo192.png',
    tag: payload.data?.type === 'chat' ? 'chat-message' : 'notification',
    requireInteraction: true,
    actions: [
      {
        action: 'open_chat',
        title: payload.data?.type === 'chat' ? 'Open Chat' : 'Open App'
      },
      {
        action: 'mark_read',
        title: 'Mark as Read'
      }
    ],
    data: {
      ...payload.data,
      click_action: payload.data?.type === 'chat' ? '/chat' : '/',
      timestamp: Date.now(),
      chatId: payload.data?.chatId,
      senderId: payload.data?.senderId
    }
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click events
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event);
  
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data || {};
  
  if (action === 'open_chat' || !action) {
    // Open the appropriate page
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        const targetUrl = data.click_action || '/';
        
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(window.location.origin) && 'focus' in client) {
            // If it's a chat notification, navigate to chat
            if (data.chatId && client.url.includes('/chat')) {
              return client.focus();
            } else if (!data.chatId) {
              return client.focus();
            }
          }
        }
        
        // Open new window/tab
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
    );
  } else if (action === 'mark_read') {
    // Handle mark as read action
    console.log('📖 Marking message as read');
    
    if (data.chatId) {
      // Call backend API to mark messages as read
      fetch('http://localhost:3001/api/chat/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chatId: data.chatId })
      }).then(response => {
        if (response.ok) {
          console.log('Messages marked as read successfully');
        } else {
          console.error('Failed to mark messages as read');
        }
      }).catch(error => {
        console.error('Error marking messages as read:', error);
      });
    }
  }
});
// Handle notification close events
self.addEventListener('notificationclose', (event) => {
  console.log('🔕 Notification closed:', event);
  // Optional: Track notification dismissal analytics
});





// Handle service worker installation
self.addEventListener('install', (event) => {
  console.log('Firebase messaging service worker installed');
  self.skipWaiting();
});

// Handle service worker activation
self.addEventListener('activate', (event) => {
  console.log('Firebase messaging service worker activated');
  event.waitUntil(self.clients.claim());
});
