const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBxGQoJqXqXqXqXqXqXqXqXqXqXqXqXqXq",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function setAdminRole() {
  try {
    // Set admin role for a specific user
    await setDoc(doc(db, 'users', 'USER_UID_HERE'), {
      role: 'admin',
      isAdmin: true
    }, { merge: true });
    
    console.log('Admin role set successfully!');
  } catch (error) {
    console.error('Error setting admin role:', error);
  }
}

async function initializeTickerConfig() {
  try {
    // Initialize ticker configuration
    await setDoc(doc(db, 'appConfig', 'ticker'), {
      message: '₹300 Send Help active | Receive ₹900 → Upgrade with ₹600 | Earn ₹600/help in Silver | E-PIN transfer live | 24/7 WhatsApp: 6299261088 🚀',
      updatedAt: new Date(),
      updatedBy: 'system'
    });
    
    console.log('Ticker configuration initialized successfully!');
  } catch (error) {
    console.error('Error initializing ticker config:', error);
  }
}

// Run both functions
async function initializeAll() {
  await setAdminRole();
  await initializeTickerConfig();
  console.log('All initialization complete!');
}

initializeAll(); 