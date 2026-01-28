// Main Chatbot Handler - Production Grade
// Orchestrates intent detection, Firestore reads, and reply generation
// Ensures strict UID-based access and secure conversation storage

const admin = require('firebase-admin');
const { onRequest: httpsOnRequest } = require('firebase-functions/v2/https');

const { detectIntent } = require('./intentDetector');
const { getUserData } = require('./firestoreReader');
const { generateReply } = require('./replyEngine');

// Lazy get db to avoid initialization order issues
const getDb = () => admin.firestore();

const handleChatbotMessage = httpsOnRequest(async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Access-Control-Max-Age', '3600');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).send('OK');
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }

  try {
    console.log('HandleChatbotMessage: Request received');
    
    const { message } = req.body;

    // Validate input
    if (!message || typeof message !== 'string') {
      console.log('HandleChatbotMessage: Invalid message');
      res.status(400).json({ error: 'Message is required and must be a string' });
      return;
    }

    const userMessage = message.trim();
    if (!userMessage) {
      console.log('HandleChatbotMessage: Empty message');
      res.status(400).json({ error: 'Message cannot be empty' });
      return;
    }

    // Extract and validate Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Authentication required. Please login first."
      });
    }

    const idToken = authHeader.split("Bearer ")[1];

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    console.log("AUTH OK UID:", uid);

    // Detect user intent from message
    console.log('HandleChatbotMessage: Detecting intent for message:', userMessage);
    const intent = detectIntent(userMessage);
    console.log('HandleChatbotMessage: Detected intent:', intent);

    // Read user data with strict UID-based access
    console.log('HandleChatbotMessage: Reading user data for UID:', uid);
    const userData = await getUserData(uid);
    if (!userData) {
      console.log('HandleChatbotMessage: User data not found for UID:', uid);
      res.status(404).json({ 
        error: 'User account not found',
        code: 'USER_NOT_FOUND'
      });
      return;
    }
    console.log('HandleChatbotMessage: Successfully read user data');

    // Generate contextual reply based on intent and user data
    console.log('HandleChatbotMessage: Generating reply');
    const botReply = await generateReply(intent, userData, uid);
    console.log('HandleChatbotMessage: Generated reply:', botReply.substring(0, 50) + '...');

    // Save conversation to Firestore with strict access control
    try {
      console.log('HandleChatbotMessage: Saving conversation to Firestore');
      const db = getDb();
      const timestamp = admin.firestore.FieldValue.serverTimestamp();
      
      // Create session ID
      const sessionId = `${uid}_session`;
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Save user message with strict UID scoping
      await db.collection('chatMessages').doc(`user_${messageId}`).set({
        sessionId,
        sender: 'user',
        text: userMessage,
        intent,
        uid,  // Critical: UID for access control
        messageId: `user_${messageId}`,
        timestamp
      });

      // Save bot reply with strict UID scoping
      await db.collection('chatMessages').doc(`bot_${messageId}`).set({
        sessionId,
        sender: 'bot',
        text: botReply,
        intent,
        uid,  // Critical: UID for access control
        messageId: `bot_${messageId}`,
        timestamp
      });

      // Update session with latest interaction
      await db.collection('chatSessions').doc(sessionId).set({
        uid,  // Critical: UID for access control
        sessionId,
        lastIntent: intent,
        lastUserMessage: userMessage,
        lastBotReply: botReply,
        messageCount: admin.firestore.FieldValue.increment(1),
        lastInteraction: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp
      }, { merge: true });
      
      console.log('HandleChatbotMessage: Conversation saved successfully');
    } catch (storageError) {
      console.error('HandleChatbotMessage: Error saving conversation:', storageError.message);
      // Don't fail the request for storage errors - reply is more important
    }

    // Return successful response
    console.log('HandleChatbotMessage: Sending response');
    res.status(200).json({
      success: true,
      reply: botReply,
      intent,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('HandleChatbotMessage: Unexpected error:', error.message, error.stack);
    
    // Return error response
    res.status(500).json({
      success: false,
      error: 'Something went wrong. Please try again or contact support.',
      code: 'INTERNAL_ERROR',
      reply: 'I apologize, but I encountered an error. Please try your question again or contact our support team for assistance.'
    });
  }
});

module.exports = handleChatbotMessage;
