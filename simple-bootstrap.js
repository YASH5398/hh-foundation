// Simple HTTP endpoint to bootstrap admin - can be called via curl/browser
// Add this to your functions/index.js and deploy

const express = require('express');
const cors = require('cors');

// Simple HTTP function for bootstrapping admin
exports.simpleBootstrapAdmin = httpsOnRequest({ cors: true }, async (req, res) => {
  // CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  const TARGET_UID = 'kFhXYjSCO1Pw0qlZc7eCoRJFvEq1';
  const BOOTSTRAP_SECRET = 'bootstrap-admin-2024';
  
  // Get secret from query parameter or body
  const secret = req.query.secret || req.body?.secret;
  
  if (secret !== BOOTSTRAP_SECRET) {
    res.status(403).json({
      error: 'Invalid bootstrap secret',
      code: 'permission-denied'
    });
    return;
  }

  try {
    // Check if user exists
    const userRecord = await admin.auth().getUser(TARGET_UID);
    
    // Set admin custom claims
    await admin.auth().setCustomUserClaims(TARGET_UID, {
      role: 'admin'
    });

    console.log(`✅ Bootstrap admin created: ${TARGET_UID}`);

    // Log this action for security
    await db.collection('adminActions').add({
      actionType: 'bootstrap_admin_created',
      targetUid: TARGET_UID,
      performedBy: 'system',
      reason: 'Initial admin bootstrap via HTTP',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      userEmail: userRecord.email,
      requestIP: req.ip
    });

    res.json({
      success: true,
      message: 'Bootstrap admin created successfully',
      uid: TARGET_UID,
      email: userRecord.email,
      note: 'User must log out and log in again for claims to take effect'
    });

  } catch (error) {
    console.error('❌ Bootstrap admin error:', error);
    
    if (error.code === 'auth/user-not-found') {
      res.status(404).json({
        error: 'Target user not found',
        code: 'not-found'
      });
    } else {
      res.status(500).json({
        error: 'Failed to create bootstrap admin',
        code: 'internal',
        details: error.message
      });
    }
  }
});