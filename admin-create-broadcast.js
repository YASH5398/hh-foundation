// Admin script to create broadcast message
// Run this from the admin panel (/admin/notifications)

console.log('👨‍💼 Admin: Creating broadcast message...');

async function adminCreateBroadcast() {
  try {
    // Import Firebase functions
    const { setDoc, doc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    // Create broadcast message with all required fields
    await setDoc(doc(db, 'broadcast', 'latest'), {
      title: 'Hi {firstName} 👋',
      message: 'Welcome to the Helping Hands Foundation dashboard! This broadcast message was created from the admin panel.',
      timestamp: serverTimestamp(),
      targetLevels: [], // No level filter - goes to all users
      statusFilter: [], // No status filter - goes to all users
      manualUserIds: [], // No manual user filter - goes to all users
      createdAt: serverTimestamp(),
      isActive: true,
      createdBy: 'admin',
      createdFrom: 'admin-panel'
    });
    
    console.log('✅ Broadcast message created successfully from admin panel!');
    console.log('📋 Document: broadcast/latest');
    console.log('📋 Message will appear for all users');
    console.log('🔄 Users should see the popup when they refresh their dashboard');
    
    // Show success message
    alert('Broadcast message created successfully! Users will see the popup when they refresh their dashboard.');
    
  } catch (error) {
    console.error('❌ Error creating broadcast message:', error);
    alert('Error creating broadcast message: ' + error.message);
  }
}

// Function to clear all user dismissals (admin only)
async function adminClearAllDismissals() {
  try {
    if (!confirm('This will clear dismissal state for ALL users. Are you sure?')) {
      return;
    }
    
    const { getDocs, collection, setDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    // Get all users
    const usersSnap = await getDocs(collection(db, 'users'));
    let clearedCount = 0;
    
    // Clear dismissal for each user
    for (const userDoc of usersSnap.docs) {
      const uid = userDoc.id;
      await setDoc(doc(db, 'popupDismissed', uid), {
        latest: false
      }, { merge: true });
      clearedCount++;
    }
    
    console.log(`✅ Cleared dismissal state for ${clearedCount} users`);
    alert(`Cleared dismissal state for ${clearedCount} users. They will see the broadcast popup again.`);
    
  } catch (error) {
    console.error('❌ Error clearing dismissals:', error);
    alert('Error clearing dismissals: ' + error.message);
  }
}

// Function to check broadcast status
async function adminCheckBroadcastStatus() {
  try {
    const { getDoc, doc, getDocs, collection } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    // Check broadcast document
    const broadcastDoc = await getDoc(doc(db, 'broadcast', 'latest'));
    
    if (broadcastDoc.exists()) {
      const data = broadcastDoc.data();
      console.log('📢 Broadcast message exists:');
      console.log('  - Title:', data.title);
      console.log('  - Message:', data.message);
      console.log('  - Created:', data.timestamp?.toDate());
      console.log('  - Active:', data.isActive);
      console.log('  - Level filters:', data.targetLevels);
      console.log('  - Status filters:', data.statusFilter);
      console.log('  - Manual users:', data.manualUserIds);
    } else {
      console.log('❌ No broadcast message found');
    }
    
    // Count users who have dismissed
    const dismissedSnap = await getDocs(collection(db, 'popupDismissed'));
    let dismissedCount = 0;
    dismissedSnap.forEach(doc => {
      const data = doc.data();
      if (data.latest === true) {
        dismissedCount++;
      }
    });
    
    console.log(`📊 ${dismissedCount} users have dismissed the broadcast`);
    
    // Get total user count
    const usersSnap = await getDocs(collection(db, 'users'));
    const totalUsers = usersSnap.size;
    
    console.log(`📊 Total users: ${totalUsers}`);
    console.log(`📊 Users who will see popup: ${totalUsers - dismissedCount}`);
    
  } catch (error) {
    console.error('❌ Error checking broadcast status:', error);
  }
}

// Export functions
window.adminBroadcast = {
  adminCreateBroadcast,
  adminClearAllDismissals,
  adminCheckBroadcastStatus
};

// Auto-run status check
adminCheckBroadcastStatus();

console.log('👨‍💼 Admin broadcast functions loaded:');
console.log('  window.adminBroadcast.adminCreateBroadcast() - Create broadcast message');
console.log('  window.adminBroadcast.adminClearAllDismissals() - Clear all dismissals');
console.log('  window.adminBroadcast.adminCheckBroadcastStatus() - Check status'); 