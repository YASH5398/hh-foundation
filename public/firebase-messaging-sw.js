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
  console.log('Received background message:', payload);
  
  const notificationTitle = payload.notification?.title || 'HH Foundation';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/logo192.png',
    badge: '/logo192.png',
    tag: 'hh-foundation-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ],
    data: payload.data || {}
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click events
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    // Open the app when notification is clicked
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // If app is already open, focus on it
          for (const client of clientList) {
            if (client.url.includes(self.location.origin) && 'focus' in client) {
              return client.focus();
            }
          }
          // If app is not open, open it
          if (clients.openWindow) {
            const actionLink = event.notification.data?.actionLink || '/dashboard';
            return clients.openWindow(self.location.origin + actionLink);
          }
        })
    );
  }
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