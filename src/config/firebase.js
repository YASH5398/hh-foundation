import { initializeApp } from "firebase/app";
import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging } from "firebase/messaging";
import { getFunctions } from "firebase/functions";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  onSnapshot,
  orderBy,
  limit,
  writeBatch,
  serverTimestamp,
  increment,
  runTransaction,
  arrayUnion,
  or,
  Timestamp } from
"firebase/firestore";

// ✅ Firebase config for HH Foundation (can be overridden at runtime by `window.__FIREBASE_CONFIG__`)
const defaultFirebaseConfig = {
  apiKey: "AIzaSyC0tKqfEe2Ij3JKZvloHTYrt5Db97YsoUg",
  authDomain: "hh-foundation.firebaseapp.com",
  databaseURL: "https://hh-foundation-default-rtdb.firebaseio.com",
  projectId: "hh-foundation",
  storageBucket: "hh-foundation.firebasestorage.app",
  messagingSenderId: "310213307250",
  appId: "1:310213307250:web:bcd588790c923ddb0beb",
  measurementId: "G-H1J3X51DF0"
};

// Allow hosting or other runtime injection to override config so deployed build can use same project as localhost
let firebaseConfig = defaultFirebaseConfig;
if (typeof window !== 'undefined' && window.__FIREBASE_CONFIG__) {
  try {
    console.log('🔍 FIREBASE INIT: Using runtime Firebase config override from window.__FIREBASE_CONFIG__');
    firebaseConfig = window.__FIREBASE_CONFIG__;
  } catch (e) {
    console.warn('🔍 FIREBASE INIT: Failed to apply runtime Firebase config override, using default config', e);
  }
}

console.log('🔍 FIREBASE INIT: ===== FIREBASE CONFIGURATION =====');
console.log(String('🔍 FIREBASE INIT: Project ID:') + " " + String(firebaseConfig.projectId));
console.log(String('🔍 FIREBASE INIT: Auth Domain:') + " " + String(firebaseConfig.authDomain));
console.log(String('🔍 FIREBASE INIT: App ID:') + " " + String(firebaseConfig.appId));
console.log(String('🔍 FIREBASE INIT: Storage Bucket:') + " " + String(firebaseConfig.storageBucket));
console.log(String('🔍 FIREBASE INIT: Messaging Sender ID:') + " " + String(firebaseConfig.messagingSenderId));
console.log(String('🔍 FIREBASE INIT: Runtime override used?') + " " + String(typeof window !== 'undefined' && !!window.__FIREBASE_CONFIG__));
console.log('🔍 FIREBASE INIT: =====================================');

// ✅ Initialize Firebase - SINGLE AUTH INSTANCE ONLY
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

console.log('🔍 FIREBASE INIT: Firebase app initialized successfully');
console.log(String('🔍 FIREBASE INIT: App name:') + " " + String(app.name));
console.log(String('🔍 FIREBASE INIT: App options.projectId:') + " " + String(app.options.projectId));
console.log(String('🔍 FIREBASE INIT: App options.authDomain:') + " " + String(app.options.authDomain));

// Export app options for debugging
if (typeof window !== 'undefined') {
  window.__FIREBASE_APP_OPTIONS__ = app.options;
  console.log('🔍 FIREBASE INIT: App options exported to window.__FIREBASE_APP_OPTIONS__');
}

// ✅ Enable Firebase Auth persistence (browserLocalPersistence)
// This ensures the session is restored on page refresh
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).
  then(() => {
    console.log('✅ Firebase Auth persistence enabled (browserLocalPersistence)');
  }).
  catch((error) => {
    console.error(String('❌ Failed to enable Firebase Auth persistence:') + " " + String(error));
    // Non-fatal error - auth will still work without persistence
  });
}

// Prefer initializeFirestore with long-polling auto-detection to reduce WebChannel/proxy issues
// (can manifest as Listen/channel 400 in some environments).
const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true
});
export const functions = getFunctions(app, "us-central1");

// ✅ Initialize messaging (only in browser environment with proper checks)
let messaging = null;
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    // Check if we're in a secure context (required for FCM)
    if (window.isSecureContext) {
      messaging = getMessaging(app);
      console.log('✅ Firebase Messaging initialized successfully');
    } else {
      console.warn('⚠️ Firebase Messaging requires a secure context (HTTPS or localhost)');
    }
  } catch (error) {
    console.error(String('❌ Firebase Messaging initialization failed:') + " " + String(error));
    messaging = null;
  }
} else {
  console.log('ℹ️ Firebase Messaging not available: missing window or serviceWorker support');
}

// ✅ Export services
export const storage = getStorage(app); // use default bucket from app config

export {
  app,
  db,
  messaging,
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  onSnapshot,
  orderBy,
  limit,
  writeBatch,
  serverTimestamp,
  increment,
  runTransaction,
  arrayUnion,
  or,
  Timestamp };