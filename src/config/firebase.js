import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging } from "firebase/messaging";
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
  increment 
} from "firebase/firestore";

// ✅ Firebase config for HH Foundation
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

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// ✅ Initialize messaging (only in browser environment)
let messaging = null;
if (typeof window !== 'undefined') {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.log('Messaging not supported in this environment');
  }
}

// ✅ Export services
export const storage = getStorage(app, 'gs://hh-foundation.appspot.com');

export { 
  app, 
  analytics, 
  auth, 
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
  increment
};