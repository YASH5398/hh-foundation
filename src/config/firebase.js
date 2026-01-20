import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
<<<<<<< HEAD
import { getFirestore, initializeFirestore } from "firebase/firestore";
=======
import { getFirestore } from "firebase/firestore";
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
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
<<<<<<< HEAD
  increment,
  runTransaction,
  arrayUnion,
  Timestamp
=======
  increment
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
} from "firebase/firestore";

// ✅ Firebase config for HH Foundation
const firebaseConfig = {
  apiKey: "AIzaSyC0tKqfEe2Ij3JKZvloHTYrt5Db97YsoUg",
  authDomain: "hh-foundation.firebaseapp.com",
  databaseURL: "https://hh-foundation-default-rtdb.firebaseio.com",
  projectId: "hh-foundation",
<<<<<<< HEAD
  storageBucket: "hh-foundation.firebasestorage.app",
=======
  storageBucket: "hh-foundation.appspot.com",
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
  messagingSenderId: "310213307250",
  appId: "1:310213307250:web:bcd588790c923ddbdb0beb",
  measurementId: "G-H1J3X51DF0"
};

// ✅ Initialize Firebase - SINGLE AUTH INSTANCE ONLY
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);

<<<<<<< HEAD
// Prefer initializeFirestore with long-polling auto-detection to reduce WebChannel/proxy issues
// (can manifest as Listen/channel 400 in some environments).
const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true
});
export const functions = getFunctions(app, "us-central1");
=======
const db = getFirestore(app);
export const functions = getFunctions(app);
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5

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
    console.error('❌ Firebase Messaging initialization failed:', error);
    messaging = null;
  }
} else {
  console.log('ℹ️ Firebase Messaging not available: missing window or serviceWorker support');
}

// ✅ Export services
export const storage = getStorage(app); // use default bucket from app config

export {
  app,
  analytics,
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
<<<<<<< HEAD
  increment,
  runTransaction,
  arrayUnion,
  Timestamp
=======
  increment
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
};