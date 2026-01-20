// Script to call the HTTP bootstrap function
const https = require('https');

const FUNCTION_URL = 'https://us-central1-hh-foundation.cloudfunctions.net/simpleBootstrapAdmin';
const SECRET = 'bootstrap-admin-2024';

async function callHttpBootstrap() {
  console.log('🔧 Calling HTTP bootstrap function...');
  console.log('URL:', FUNCTION_URL);
  
  const url = `${FUNCTION_URL}?secret=${SECRET}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ SUCCESS!');
      console.log('Response:', data);
      console.log('');
      console.log('🎉 Admin custom claims set successfully!');
      console.log('📧 Email:', data.email);
      console.log('🆔 UID:', data.uid);
      console.log('🔑 Custom Claims:', data.customClaims);
      console.log('');
      console.log('🚨 CRITICAL: User must log out and log back in!');
      console.log('');
      console.log('🧪 Verification code:');
      console.log('const idTokenResult = await auth.currentUser.getIdTokenResult(true);');
      console.log('console.log("Admin role:", idTokenResult.claims.role === "admin");');
    } else {
      console.log('❌ Error:', data);
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
    console.log('');
    console.log('💡 Possible issues:');
    console.log('- Function not deployed yet');
    console.log('- Network connectivity');
    console.log('- Function URL incorrect');
    console.log('');
    console.log('Try deploying first:');
    console.log('firebase deploy --only functions:simpleBootstrapAdmin');
  }
}

// Use fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

callHttpBootstrap();