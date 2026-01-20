// Node.js script to call the bootstrap function using Firebase client SDK
const { initializeApp } = require('firebase/app');
const { getFunctions, httpsCallable } = require('firebase/functions');

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC0tKqfEe2Ij3JKZvloHTYrt5Db97YsoUg",
  authDomain: "hh-foundation.firebaseapp.com",
  databaseURL: "https://hh-foundation-default-rtdb.firebaseio.com",
  projectId: "hh-foundation",
  storageBucket: "hh-foundation.firebasestorage.app",
  messagingSenderId: "310213307250",
  appId: "1:310213307250:web:bcd588790c923ddbdb0beb",
  measurementId: "G-H1J3X51DF0"
};

async function callBootstrapFunction() {
  try {
    console.log('🔧 Calling bootstrap function...');
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const functions = getFunctions(app, 'us-central1');
    
    // Call the bootstrap function
    const bootstrapFirstAdmin = httpsCallable(functions, 'bootstrapFirstAdmin');
    const result = await bootstrapFirstAdmin({
      secret: 'bootstrap-admin-2024'
    });
    
    console.log('✅ Bootstrap function result:', result.data);
    console.log('');
    console.log('🎉 SUCCESS! Admin created successfully.');
    console.log('📧 Email:', result.data.email);
    console.log('🆔 UID:', result.data.uid);
    console.log('');
    console.log('🚨 IMPORTANT: User must log out and log in again!');
    
  } catch (error) {
    console.error('❌ Error calling bootstrap function:', error);
    console.log('');
    console.log('💡 Possible reasons:');
    console.log('- Function not deployed yet');
    console.log('- Invalid secret');
    console.log('- Network connectivity issues');
    console.log('- User not found');
  }
}

callBootstrapFunction();