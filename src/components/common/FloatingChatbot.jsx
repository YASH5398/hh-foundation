import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { db } from '../../config/firebase';
import { doc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';
import { FiSend, FiMessageCircle, FiUser, FiX, FiMaximize2, FiMinimize2 } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

// Custom CSS for animations
const customStyles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes slideUp {
    from { transform: translateY(100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
  }
  
  .animate-slideUp {
    animation: slideUp 0.4s ease-out;
  }
  
  .animate-pulse-gentle {
    animation: pulse 2s infinite;
  }
  
  .chatbot-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  
  .chatbot-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  
  .chatbot-scrollbar::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
  }
  
  .chatbot-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
  
  .message-bubble {
    word-wrap: break-word;
    overflow-wrap: break-word;
    hyphens: auto;
  }
  
  @media (max-width: 640px) {
    .chatbot-mobile {
      height: 100vh !important;
      width: 100vw !important;
      border-radius: 0 !important;
    }
  }
`;

// Note: In production, store API key in environment variables
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || 'AIzaSyAII33W1SnpTpH0lL8ilbTuGC46ntaA5JM';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

const FloatingChatbot = ({ fullScreen = false }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  
  // Handle dismiss functionality
  const handleDismiss = () => {
    setIsDismissed(true);
    setIsOpen(false);
  };
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatRoomId, setChatRoomId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationContext, setConversationContext] = useState([]);
  const [lastResponses, setLastResponses] = useState(new Set());
  const [hasShownIntro, setHasShownIntro] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const messagesEndRef = useRef(null);
  
  // Check if current page should have full-screen chatbot
  const shouldBeFullScreen = fullScreen || 
    location.pathname === '/' || 
    location.pathname.startsWith('/support');
    
  // Load user profile data for real-time responses
  useEffect(() => {
    if (!user?.uid) return;
    
    const loadUserProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    };
    
    loadUserProfile();
  }, [user?.uid]);
  
  // Add single intro message when chatbot opens for first time
  const addIntroMessage = () => {
    if (hasShownIntro) return;
    
    const isLandingPage = location.pathname === '/';
    const isSupportPage = location.pathname.startsWith('/support');
    
    let introMessage;
    
    if (isLandingPage) {
      introMessage = {
        text: "Hey dost 👋 main yaha hoon help ke liye! Kuch bhi puchho 🤝",
        sender: 'ai',
        timestamp: new Date()
      };
    } else if (isSupportPage) {
      introMessage = {
        text: "Hey dost 👋 main yaha hoon help ke liye! Kuch bhi puchho 🤝",
        sender: 'ai',
        timestamp: new Date()
      };
    }
    
    if (introMessage) {
      setIsTyping(true);
      setTimeout(() => {
        setMessages(prev => [...prev, {
          ...introMessage,
          id: `intro-${Date.now()}`
        }]);
        setIsTyping(false);
        setHasShownIntro(true);
        scrollToBottom();
      }, 800);
    }
  };
  
  // Handle chatbot open
  const handleChatbotOpen = () => {
    setIsOpen(true);
    setIsDismissed(false);
    if (shouldBeFullScreen) {
      setIsFullScreen(true);
    }
    // Add intro message only if not shown before
    setTimeout(() => {
      addIntroMessage();
    }, 500);
  };
  
  // Handle chatbot dismiss
  const handleChatbotDismiss = () => {
    setIsOpen(false);
    setIsDismissed(true);
    setIsFullScreen(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Initialize or get existing chat room
  useEffect(() => {
    if (!user?.uid) return;

    const initializeChatRoom = async () => {
      const chatbotChatRef = doc(db, 'chatbotChats', user.uid);
      const chatbotChatDoc = await getDoc(chatbotChatRef);
      
      if (!chatbotChatDoc.exists()) {
        // Create new chat room for chatbot
        await setDoc(chatbotChatRef, {
          userId: user.uid,
          userName: user.displayName || user.email,
          agentId: 'CHATBOT',
          agentName: 'AI Assistant',
          status: 'active',
          createdAt: serverTimestamp(),
          closedAt: null
        });
      }
      
      setChatRoomId(user.uid);
    };

    initializeChatRoom();
  }, [user?.uid, user?.displayName, user?.email]);

  // Load messages from subcollection
  useEffect(() => {
    if (!chatRoomId) return;

    const messagesRef = collection(db, 'chatbotChats', chatRoomId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(chatMessages);
    });

    return () => unsubscribe();
  }, [chatRoomId]);

  const getGeminiResponse = async (userMessage) => {
    try {
      // Check if API key is available
      if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your-api-key-here') {
        return getLocalResponse(userMessage);
      }

      // Build conversation context for better responses
      const contextMessages = conversationContext.slice(-6); // Last 6 messages for context
      const contextText = contextMessages.length > 0 
        ? `Previous conversation context: ${contextMessages.map(msg => `${msg.type}: ${msg.text}`).join(' | ')} | Current message: ${userMessage}`
        : userMessage;

      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a helpful customer support assistant for HH Foundation MLM platform. Provide varied, contextual responses and avoid repeating previous answers. Context: ${contextText}. Please provide a helpful, unique, and concise response.`
            }]
          }]
        })
      });

      if (!response.ok) {
        console.error('API Response Error:', response.status, response.statusText);
        return getLocalResponse(userMessage);
      }

      const data = await response.json();
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || getLocalResponse(userMessage);
      
      // Update conversation context
      setConversationContext(prev => [
        ...prev.slice(-5), // Keep last 5 messages
        { type: 'user', text: userMessage },
        { type: 'assistant', text: aiResponse }
      ]);
      
      return aiResponse;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      return getLocalResponse(userMessage);
    }
  };

  const getLocalResponse = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();
    const isLandingPage = location.pathname === '/';
    const isSupportPage = location.pathname.startsWith('/support');
    
    // Get user's real-time data for personalized responses
    const userName = userProfile?.name || user?.displayName || 'dost';
    const userLevel = userProfile?.currentLevel || 'new member';
    const referralCount = userProfile?.referralCount || 0;
    const receiveHelpStatus = userProfile?.receiveHelpStatus || 'not started';
    
    // Landing page responses with real-time data integration
     const landingPageResponses = {
       greetings: [
         `Arre ${userName}! 😊 Wapas aa gaye? Main yaha hi tha tumhara intezaar kar raha tha! Kya puchna hai bhai? 🤝`,
         `Hello ${userName}! 👋 Phir se milke khushi hui! Koi confusion hai kya? Main clear kar deta hoon! 😄`,
         `Hey buddy! 🤗 ${referralCount > 0 ? `Dekho toh, tumhare ${referralCount} referrals hain! Kamaal hai! 🎉` : 'Abhi tak referrals nahi hain, par koi baat nahi!'} Kuch aur puchna hai? 🚀`
       ],
       howItWorks: [
         `Dekho ${userName}, yeh bilkul simple hai! 🎯 Tum 2 logo ki help karte ho, aur 2 alag log tumhari help karte hain! ${userLevel !== 'new member' ? `Tum already ${userLevel} level mein ho, toh samajh gaye hoge!` : 'Ek baar try karo, samajh aa jayega!'} Levels hain: ₹1000, ₹5000, ₹25000. Chote se start karo! 💪`,
         `Bhai, imagine karo ek dost ka circle! 🔄 Tum 2 friends ki help karte ho paisa deke, phir 2 aur friends tumhari help karte hain! ${receiveHelpStatus === 'completed' ? 'Tumne toh already receive kar liya hai! 🎉' : receiveHelpStatus === 'pending' ? 'Tumhara receive help pending hai, jaldi milega! ⏰' : 'Abhi start karo, maza aayega!'} Sab kuch real-time track hota hai! 📊`
       ],
       levels: [
         `Levels ki baat kar rahe ho? 🎮 Level 1 (₹1000) - beginners ke liye perfect! Level 2 (₹5000) - thoda confidence aa gaya? Level 3 (₹25000) - big players! ${userLevel !== 'new member' ? `Tum ${userLevel} mein ho, next level try karna hai?` : 'Kahan se start karna chahte ho?'} 🚀`,
         `Arre yaar, levels toh easy hain! 🎯 ${userLevel !== 'new member' ? `Tum already ${userLevel} level mein experienced ho!` : 'Bike chalana seekhte hain pehle (Level 1), phir car (Level 2), phir plane (Level 3)!'} Jo comfortable lage, wahan se start karo! 😊`
       ],
       safety: [
         `Safety? Bhai, hum Fort Knox se bhi zyada secure hain! 🛡️ ${userProfile?.isVerified ? 'Tumhara account verified hai, toh tension mat lo!' : 'Account verify kar lo, aur bhi safe ho jayega!'} Bank-level security, 24/7 monitoring, sab kuch transparent! Tumhara paisa bilkul safe hai! 💪`,
         `Security ke mamle mein hum koi compromise nahi karte! 🔒 Real-time tracking, verified profiles, secure payments - sab kuch! ${referralCount > 0 ? `${referralCount} referrals ke saath tumhara trust score bhi badh gaya hai!` : 'Jaise jaise use karoge, trust score badhta jayega!'} Bilkul tension-free raho! 😌`
       ],
       benefits: [
         `Benefits? Arre bhai, list hi lamba hai! 🎉 ${receiveHelpStatus === 'completed' ? 'Tumne toh already experience kar liya hai!' : 'Financial growth, community support, transparent system!'} ${referralCount > 0 ? `Plus tumhare ${referralCount} referrals se passive income bhi!` : 'Referrals banao, passive income bhi milega!'} Karma + Money = Perfect combo! 💰✨`,
         `Fayde toh bahut hain yaar! 🌟 Help karte ho (good vibes ✨), paisa kamata ho (practical vibes 💰), community join karte ho (social vibes 👥)! ${userLevel !== 'new member' ? `${userLevel} level mein ho, toh pata hi hoga kitna maza aata hai!` : 'Ek baar try karo, addiction ho jayega!'} 😄`
       ],
       joining: [
         `Join karna hai? 🎊 ${userProfile ? 'Arre tum toh already member ho! Next level try karo!' : 'Bilkul easy hai! Maggi banane se bhi kam time lagta hai!'} Register → Level choose → Match ho jao → Help karo → Help receive karo! ${referralCount > 0 ? `Tumhare ${referralCount} referrals already hain, toh experienced ho!` : 'Bas 5 minute ka kaam hai!'} 🚀`,
         `Joining process? Bhai, social media se bhi easy! 🌟 ${userProfile?.registrationDate ? 'Tumne toh already kar liya hai!' : 'Cat videos dekhne se better hai - yahan paisa bhi milta hai!'} ${receiveHelpStatus === 'pending' ? 'Tumhara receive help pending hai, jaldi complete hoga!' : 'Start karo, maza aayega!'} 🍋`
       ]
     };
    
    // Support page responses with real-time data
     const supportPageResponses = {
       greetings: [
         `Arre ${userName}! 🔧 Phir se problem aa gayi? Tension mat lo, main hoon na! ${userLevel !== 'new member' ? `${userLevel} level mein ho, experienced ho tum!` : 'New ho, par main sab samjha dunga!'} Kya issue hai bhai? 😄`,
         `Hello ${userName}! 👋 Problem-solving time! ${receiveHelpStatus === 'pending' ? 'Receive help pending hai, uske saath koi issue?' : 'Koi technical problem?'} Main Sherlock Holmes hoon support issues ke liye! 🕵️‍♀️✨`,
         `Welcome back dost! 🛠️ ${referralCount > 0 ? `${referralCount} referrals ke saath tum experienced ho, phir bhi problem aa gayi?` : 'Koi baat nahi, sabke saath hota hai!'} Batao kya mission hai aaj? 😂`
       ],
       account: [
         `Account ki problem? 🔐 ${userProfile?.isVerified ? 'Verified account hai tumhara, phir bhi issue?' : 'Account verify nahi hai, shayad yahi problem hai!'} Login issues, profile updates, ya kuch aur? ${userLevel !== 'new member' ? `${userLevel} level mein experienced ho, jaldi solve kar denge!` : 'New user ho, step by step batata hoon!'} 💪`,
         `Account issues? Arre yaar! 👨‍💻 ${receiveHelpStatus === 'completed' ? 'Receive help complete hai, account toh theek hona chahiye!' : receiveHelpStatus === 'pending' ? 'Receive help pending hai, account issue ki wajah se?' : 'Account setup karne mein problem?'} Main tumhare account ka personal trainer hoon! 💪`
       ],
       payment: [
         `Payment ka chakkar? 💳 ${receiveHelpStatus === 'pending' ? 'Receive help pending hai, payment ka wait kar rahe ho?' : receiveHelpStatus === 'completed' ? 'Payment receive kar chuke ho, phir kya problem?' : 'Payment karne mein issue?'} ${referralCount > 0 ? `${referralCount} referrals ke saath experienced ho, phir bhi payment issue?` : 'Pehli baar payment kar rahe ho?'} Sab solve kar denge! 🧩`,
         `Payment problems? 🚦 ${userLevel !== 'new member' ? `${userLevel} level mein ho, payment process toh pata hoga!` : 'New ho, payment process confusing lag raha hai?'} Stuck transaction, missing payment, ya kuch aur? Pizza delivery se bhi fast solve kar denge! 🍕⚡`
       ],
       technical: [
         `Technical difficulties? 🤖 ${userProfile?.lastLoginDate ? 'Recently login kiye the, tab se problem?' : 'Login karne mein hi problem?'} App hang ho raha hai, website slow hai, ya kuch aur? ${userLevel !== 'new member' ? `${userLevel} level mein experienced ho, technical issues rare hain!` : 'New user ho, technical issues common hain!'} Digital mechanic hoon main! 💻✨`,
         `Tech troubles? 🛠️ ${receiveHelpStatus === 'pending' ? 'Receive help pending hai, technical issue ki wajah se?' : 'General technical problem?'} App crashes, slow loading, weird errors - sab dekha hai maine! ${referralCount > 0 ? `${referralCount} referrals ke saath experienced ho, jaldi fix kar denge!` : 'Step by step solve karte hain!'} 🧈`
       ],
       tickets: [
         `Support ticket banana hai? 🎫 ${userProfile?.previousTickets ? 'Pehle bhi ticket banaye hain, experienced ho!' : 'Pehli baar ticket bana rahe ho?'} Santa ko letter likhne jaisa hai - toys ki jagah solutions milte hain! ${userLevel !== 'new member' ? `${userLevel} level mein ho, priority support milega!` : '2-4 hours mein response milega!'} ☕`,
         `Support tickets? 🎟️ ${receiveHelpStatus === 'pending' ? 'Receive help ke liye ticket banana hai?' : 'General support ticket?'} Human superheroes tumhare issue ko solve karenge! ${referralCount > 0 ? `${referralCount} referrals ke saath VIP treatment milega!` : 'Average 2-4 hours, par often faster!'} 🦸‍♀️`
       ],
       liveAgent: [
         `Real human se baat karni hai? 👨‍💼👩‍💼 ${userLevel !== 'new member' ? `${userLevel} level mein ho, priority support milega!` : 'New user ho, special attention milega!'} Customer service ninjas 24/7 available hain! ${receiveHelpStatus === 'pending' ? 'Receive help ke bare mein baat karni hai?' : 'General support chahiye?'} 🥷`,
         `Human backup time? 🤝 ${referralCount > 0 ? `${referralCount} referrals ke saath experienced ho, agents ko pata hoga tumhara case!` : 'New ho, agents ko detail mein batayenge!'} Avengers of customer support! ${userProfile?.preferredLanguage ? `${userProfile.preferredLanguage} mein baat kar sakte hain!` : 'Hindi/English dono mein help milegi!'} 🚀`
       ],
       general: [
         `Confused ho kya category mein? 🤔 ${userLevel !== 'new member' ? `${userLevel} level mein experienced ho, phir bhi confusion?` : 'New ho, sab confusing lagta hai!'} Support GPS hoon main! ${receiveHelpStatus === 'pending' ? 'Receive help related hai ya kuch aur?' : 'Koi bhi problem ho, direction de dunga!'} 🧭`,
         "Got a mystery issue? 🕵️‍♂️ I love a good challenge! Whether it's something weird, something confusing, or something that just doesn't make sense, let's figure it out together! I'm basically a digital detective! 🔍"
       ]
     };
    
    const generalResponses = {
      greetings: [
        "Hello! I'm your AI assistant. How can I help you today?",
        "Hi there! Welcome to HH Foundation support. What can I assist you with?",
        "Greetings! I'm here to help with any questions about our platform."
      ],
      help: [
        "I'm here to help! You can ask me about account issues, payments, referrals, or any other questions about our platform.",
        "I can assist with various topics including account management, payment processing, referral systems, and general platform questions. What would you like to know?"
      ],
      payment: [
        "For payment-related issues, please check your payment history in the dashboard or contact our support team for assistance.",
        "Payment concerns? You can view your transaction history in the dashboard. For specific issues, our support team is available to help."
      ],
      referral: [
        "You can find your referral link in the dashboard. Share it with others to earn commissions when they join!",
        "Your unique referral link is available in the dashboard. Share it to earn rewards when others join through your link!"
      ],
      default: [
        "Thank you for your message. For complex issues, please consider contacting our live support agents for personalized assistance.",
        "I appreciate your question. For detailed support, our live agents are available to provide personalized help."
      ]
    };
    
    let selectedResponse;
    
    // Enhanced keyword matching for better responses
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey') || lowerMessage.includes('greet')) {
      if (isLandingPage) {
        selectedResponse = getUniqueResponse(landingPageResponses.greetings);
      } else if (isSupportPage) {
        selectedResponse = getUniqueResponse(supportPageResponses.greetings);
      } else {
        selectedResponse = getUniqueResponse(generalResponses.greetings);
      }
    } else if (isLandingPage) {
      // Landing page specific enhanced matching
      if ((lowerMessage.includes('how') && (lowerMessage.includes('work') || lowerMessage.includes('does'))) || 
          lowerMessage.includes('explain') || lowerMessage.includes('understand') || lowerMessage.includes('process')) {
        selectedResponse = getUniqueResponse(landingPageResponses.howItWorks);
      } else if (lowerMessage.includes('level') || lowerMessage.includes('amount') || lowerMessage.includes('money') || 
                lowerMessage.includes('₹') || lowerMessage.includes('price') || lowerMessage.includes('cost')) {
        selectedResponse = getUniqueResponse(landingPageResponses.levels);
      } else if (lowerMessage.includes('safe') || lowerMessage.includes('secure') || lowerMessage.includes('trust') || 
                lowerMessage.includes('security') || lowerMessage.includes('protection') || lowerMessage.includes('scam')) {
        selectedResponse = getUniqueResponse(landingPageResponses.safety);
      } else if (lowerMessage.includes('benefit') || lowerMessage.includes('advantage') || lowerMessage.includes('profit') || 
                lowerMessage.includes('earn') || lowerMessage.includes('gain') || lowerMessage.includes('why')) {
        selectedResponse = getUniqueResponse(landingPageResponses.benefits);
      } else if (lowerMessage.includes('join') || lowerMessage.includes('register') || lowerMessage.includes('sign up') || 
                lowerMessage.includes('start') || lowerMessage.includes('begin') || lowerMessage.includes('get started')) {
        selectedResponse = getUniqueResponse(landingPageResponses.joining);
      }
    } else if (isSupportPage) {
      // Support page specific enhanced matching
      if (lowerMessage.includes('account') || lowerMessage.includes('login') || lowerMessage.includes('profile') || 
          lowerMessage.includes('password') || lowerMessage.includes('access') || lowerMessage.includes('sign in')) {
        selectedResponse = getUniqueResponse(supportPageResponses.account);
      } else if (lowerMessage.includes('payment') || lowerMessage.includes('money') || lowerMessage.includes('transaction') || 
                lowerMessage.includes('₹') || lowerMessage.includes('pay') || lowerMessage.includes('refund')) {
        selectedResponse = getUniqueResponse(supportPageResponses.payment);
      } else if (lowerMessage.includes('technical') || lowerMessage.includes('bug') || lowerMessage.includes('error') || 
                lowerMessage.includes('crash') || lowerMessage.includes('slow') || lowerMessage.includes('loading')) {
        selectedResponse = getUniqueResponse(supportPageResponses.technical);
      } else if (lowerMessage.includes('ticket') || lowerMessage.includes('support') || lowerMessage.includes('complaint')) {
        selectedResponse = getUniqueResponse(supportPageResponses.tickets);
      } else if (lowerMessage.includes('agent') || lowerMessage.includes('human') || lowerMessage.includes('person') || 
                lowerMessage.includes('live') || lowerMessage.includes('chat') || lowerMessage.includes('speak')) {
        selectedResponse = getUniqueResponse(supportPageResponses.liveAgent);
      } else {
        selectedResponse = getUniqueResponse(supportPageResponses.general);
      }
    }
    
    // Fallback to general responses if no specific match found
    if (!selectedResponse) {
      if (lowerMessage.includes('help') || lowerMessage.includes('assist')) {
        selectedResponse = getUniqueResponse(generalResponses.help);
      } else if (lowerMessage.includes('payment') || lowerMessage.includes('money') || lowerMessage.includes('transaction')) {
        selectedResponse = getUniqueResponse(generalResponses.payment);
      } else if (lowerMessage.includes('referral') || lowerMessage.includes('refer') || lowerMessage.includes('commission')) {
        selectedResponse = getUniqueResponse(generalResponses.referral);
      } else {
        selectedResponse = getUniqueResponse(generalResponses.default);
      }
    }
    
    // Update conversation context for local responses too
    setConversationContext(prev => [
      ...prev.slice(-5),
      { type: 'user', text: userMessage },
      { type: 'assistant', text: selectedResponse }
    ]);
    
    return selectedResponse;
  };
  
  const getUniqueResponse = (responses) => {
    const availableResponses = responses.filter(response => !lastResponses.has(response));
    
    if (availableResponses.length === 0) {
      setLastResponses(new Set());
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    const selectedResponse = availableResponses[Math.floor(Math.random() * availableResponses.length)];
    
    setLastResponses(prev => {
      const newSet = new Set(prev);
      newSet.add(selectedResponse);
      if (newSet.size > 3) {
        const firstItem = newSet.values().next().value;
        newSet.delete(firstItem);
      }
      return newSet;
    });
    
    return selectedResponse;
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatRoomId || isLoading || !user) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Add user message
      const userMessageData = {
        senderUid: user.uid,
        senderType: 'user',
        senderName: user.displayName || user.email,
        text: messageText,
        timestamp: serverTimestamp()
      };

      await addDoc(collection(db, 'chatbotChats', chatRoomId, 'messages'), userMessageData);

      // Simulate typing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Get AI response
      const aiResponse = await getGeminiResponse(messageText);

      // Add AI response
      const aiMessageData = {
        senderUid: 'CHATBOT',
        senderType: 'agent',
        senderName: 'AI Assistant',
        text: aiResponse,
        timestamp: serverTimestamp()
      };

      await addDoc(collection(db, 'chatbotChats', chatRoomId, 'messages'), aiMessageData);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const TypingIndicator = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-start space-x-2 mb-2"
    >
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
        <FiMessageCircle className="w-3 h-3 text-white" />
      </div>
      <div className="bg-white text-gray-800 rounded-lg rounded-bl-sm shadow-sm px-3 py-2">
        <div className="flex space-x-1">
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
        </div>
      </div>
    </motion.div>
  );

  // Don't render if user is not logged in
  if (!user) return null;

  return (
    <>
      {/* Inject custom styles */}
      <style>{customStyles}</style>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50"
          >
            <FiMessageCircle className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className={`fixed z-50 flex flex-col overflow-hidden animate-slideUp ${
              isFullScreen || shouldBeFullScreen
                ? 'inset-0 bg-white shadow-2xl chatbot-mobile'
                : 'bottom-6 right-6 w-96 h-[32rem] bg-white rounded-lg shadow-2xl sm:w-96 sm:h-[32rem] chatbot-mobile'
            }`}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <FiMessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {location.pathname === '/' ? 'HH Foundation Assistant' : 
                     location.pathname.startsWith('/support') ? 'Support Assistant' : 'AI Assistant'}
                  </h3>
                  <p className="text-sm opacity-90">
                    {location.pathname === '/' ? 'Learn about our platform' : 
                     location.pathname.startsWith('/support') ? 'Get instant support' : 'Online - Ready to help'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {!shouldBeFullScreen && (
                  <button
                    onClick={() => setIsFullScreen(!isFullScreen)}
                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                    title={isFullScreen ? 'Exit full screen' : 'Full screen'}
                  >
                    {isFullScreen ? <FiMinimize2 className="w-5 h-5" /> : <FiMaximize2 className="w-5 h-5" />}
                  </button>
                )}
                <button
                   onClick={handleDismiss}
                   className="p-2 hover:bg-white hover:bg-opacity-20 rounded transition-colors group"
                   title="Dismiss chatbot"
                 >
                   <FiX className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
                 </button>
                {!shouldBeFullScreen && (
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Chat Content */}
            {!isDismissed && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 chatbot-scrollbar">
                  {messages.length === 0 && (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiMessageCircle className="w-8 h-8 text-white" />
                      </div>
                      {location.pathname === '/' ? (
                        <>
                          <p className="text-lg text-gray-600">Welcome to HH Foundation! 🌟</p>
                          <p className="text-sm text-gray-500 mt-2">Ask me about our helping platform, levels, safety, or how to get started!</p>
                          <div className="mt-4 flex flex-wrap gap-2 justify-center">
                            <button 
                              onClick={() => setNewMessage('How does HH Foundation work?')}
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs hover:bg-blue-200 transition-colors"
                            >
                              How it works?
                            </button>
                            <button 
                              onClick={() => setNewMessage('What are the different levels?')}
                              className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs hover:bg-purple-200 transition-colors"
                            >
                              Levels & Pricing
                            </button>
                            <button 
                              onClick={() => setNewMessage('Is it safe and secure?')}
                              className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs hover:bg-green-200 transition-colors"
                            >
                              Safety & Security
                            </button>
                          </div>
                        </>
                      ) : location.pathname.startsWith('/support') ? (
                        <>
                          <p className="text-lg text-gray-600">Hi! I'm your support assistant 🛟</p>
                          <p className="text-sm text-gray-500 mt-2">I can help with account issues, payments, or connect you with live agents!</p>
                          <div className="mt-4 flex flex-wrap gap-2 justify-center">
                            <button 
                              onClick={() => setNewMessage('I need help with my account')}
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs hover:bg-blue-200 transition-colors"
                            >
                              Account Help
                            </button>
                            <button 
                              onClick={() => setNewMessage('Payment issue')}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs hover:bg-red-200 transition-colors"
                            >
                              Payment Issue
                            </button>
                            <button 
                              onClick={() => setNewMessage('Connect me to live agent')}
                              className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs hover:bg-green-200 transition-colors"
                            >
                              Live Agent
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-lg text-gray-600">Hi! How can I help you today?</p>
                          <p className="text-sm text-gray-500 mt-2">Ask me anything and I'll do my best to assist you.</p>
                        </>
                      )}
                    </div>
                  )}

                  <AnimatePresence>
                    {messages.map((message, index) => {
                      const isUser = message.senderType === 'user';
                      return (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className={`flex items-end space-x-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                        >
                          {!isUser && (
                            <motion.div 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.1 }}
                              className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md"
                            >
                              <span className="text-sm">🤖</span>
                            </motion.div>
                          )}
                          
                          <motion.div 
                            whileHover={{ scale: 1.02 }}
                            className={`max-w-[70%] px-4 py-3 rounded-2xl text-base shadow-sm transition-all duration-300 message-bubble animate-fadeIn ${
                              isUser 
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md' 
                                : 'bg-white text-gray-800 rounded-bl-md border border-gray-100'
                            }`}
                          >
                            <p className="leading-relaxed break-words">{message.text}</p>
                            <p className={`text-xs mt-2 opacity-70 ${
                              isUser ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {formatTime(message.timestamp)}
                            </p>
                          </motion.div>
                          
                          {isUser && (
                            <motion.div 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.1 }}
                              className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md"
                            >
                              <span className="text-sm">👤</span>
                            </motion.div>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {/* Enhanced Typing Indicator */}
                  <AnimatePresence>
                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-end space-x-2 justify-start"
                      >
                        <motion.div 
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md"
                        >
                          <span className="text-sm">🤖</span>
                        </motion.div>
                        <div className="bg-white text-gray-800 rounded-2xl rounded-bl-md shadow-sm px-4 py-3 border border-gray-100">
                          <div className="flex space-x-1">
                            <motion.div 
                              animate={{ y: [0, -4, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                              className="w-2 h-2 bg-blue-400 rounded-full"
                            />
                            <motion.div 
                              animate={{ y: [0, -4, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                              className="w-2 h-2 bg-blue-400 rounded-full"
                            />
                            <motion.div 
                              animate={{ y: [0, -4, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                              className="w-2 h-2 bg-blue-400 rounded-full"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div ref={messagesEndRef} />
                </div>

                {/* Enhanced Input */}
                <div className="p-4 sm:p-6 border-t bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex items-end space-x-2 sm:space-x-4 max-w-4xl mx-auto">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message... 💬"
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-12 border border-gray-200 rounded-2xl text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                        disabled={isLoading}
                      />
                      {newMessage.trim() && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                          <span className="text-xs text-gray-400">↵</span>
                        </motion.div>
                      )}
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || isLoading}
                      className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:bg-gray-300 rounded-2xl flex items-center justify-center transition-all duration-200 flex-shrink-0 shadow-md hover:shadow-lg animate-pulse-gentle"
                    >
                      <FiSend className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </motion.button>
                  </div>
                  
                  {/* Quick Action Buttons */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-wrap gap-1 sm:gap-2 mt-3 sm:mt-4 max-w-4xl mx-auto"
                  >
                    <button
                      onClick={() => setNewMessage(location.pathname === '/' ? "How does this work?" : "I need help with my account")}
                      className="text-xs bg-white border border-gray-200 text-gray-600 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      {location.pathname === '/' ? "How it works?" : "Account help"}
                    </button>
                    <button
                      onClick={() => setNewMessage(location.pathname === '/' ? "Is it safe?" : "Payment issue")}
                      className="text-xs bg-white border border-gray-200 text-gray-600 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full hover:bg-green-50 hover:border-green-200 hover:text-green-600 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      {location.pathname === '/' ? "Safety" : "Payment"}
                    </button>
                    <button
                      onClick={() => setNewMessage(location.pathname === '/' ? "What are the levels?" : "Talk to agent")}
                      className="text-xs bg-white border border-gray-200 text-gray-600 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full hover:bg-purple-50 hover:border-purple-200 hover:text-purple-600 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      {location.pathname === '/' ? "Levels" : "Live agent"}
                    </button>
                  </motion.div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingChatbot;