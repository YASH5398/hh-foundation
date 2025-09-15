import {
  createUserWithEmailAndPassword
} from "firebase/auth";
import {
  doc,
  setDoc,
  serverTimestamp,
  getDocs,
  collection,
  query,
  where,
  writeBatch
} from "firebase/firestore";
import { auth, db } from "../config/firebase";
import emailjs from 'emailjs-com';
import { assignReceiverToNewUser } from "./assignHelpForActiveUsers";
import { NotificationService } from './notificationService';
import { DEFAULT_PROFILE_IMAGE } from '../utils/profileUtils';

const generateUserId = () => {
  const randomNumber = Math.floor(10000000 + Math.random() * 90000000);
  return `HHF${randomNumber}`;
};

const getRank = (level) => {
  switch (level) {
    case 1: return "Star";
    case 2: return "Silver";
    case 3: return "Gold";
    case 4: return "Platinum";
    case 5: return "Diamond";
    default: return "Unknown";
  }
};

export const registerUser = async (userData) => {
  const {
    fullName,
    email,
    password,
    phone,
    whatsapp,
    sponsorId,
    epins,
    paymentMethod,
    bankDetails, // Add bankDetails to destructuring
  } = userData;

  try {
    // ✅ STEP 1: Validate E-PIN
    const epinQuery = query(
      collection(db, "epins"),
      where("epin", "==", epins.trim()),
      where("isUsed", "==", false)
    );

    const epinSnapshot = await getDocs(epinQuery);
    if (epinSnapshot.empty) {
      throw new Error("E-PIN not found or already used.");
    }

    const epinDocRef = epinSnapshot.docs[0].ref;

    // ✅ STEP 2: Create Auth User
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const userId = generateUserId();
    const joinDateString = new Date().toLocaleDateString("en-GB");

    const newUserDoc = {
      uid: user.uid,
      userId,
      fullName,
      email,
      phone,
      whatsapp,
      sponsorId: sponsorId || '',
      referralCount: 0,
      isActivated: false,
      levelStatus: 'Star',
      helpVisibility: true,
      helpReceived: 0,
      isBlocked: false,
      isOnHold: false, // Explicitly set
      isReceivingHeld: false, // Explicitly set
      isSystemAccount: false,
      role: 'user', // Default role for new users
      epins: epins || '',
      profileImage: DEFAULT_PROFILE_IMAGE,
      deviceToken: '',
      registrationTime: serverTimestamp(),
      referredUsers: [],
      totalEarnings: 0,
      totalReceived: 0,
      totalSent: 0,
      totalTeam: 0,
      uplineId: '',
      bank: {
        name: bankDetails?.name || '',
        accountNumber: bankDetails?.accountNumber || '',
        bankName: bankDetails?.bankName || '',
        ifscCode: bankDetails?.ifscCode || ''
      },
      kycDetails: {
        aadhaar: bankDetails?.aadhaar || '',
        pan: bankDetails?.pan || '',
        level: 'Silver',
        levelStatus: 'Active',
        nextLevelPaymentDone: false,
        paymentBlocked: false
      },
      paymentMethod: {
        upi: paymentMethod?.upi || '',
        gpay: paymentMethod?.gpay || '',
        phonePe: paymentMethod?.phonePe || '',
        bank: paymentMethod?.bank || ''
      }
    };

    // ✅ STEP 3: Write both user doc & mark epin used in batch
    const batch = writeBatch(db);
    batch.set(doc(db, "users", user.uid), {
      ...newUserDoc,
      isOnHold: false, // Always set explicitly
      isReceivingHeld: false, // Always set explicitly
    });
    batch.update(epinDocRef, { isUsed: true });

    await batch.commit();

    // Immediately assign a receiver for Send Help
    try {
      await assignReceiverToNewUser(user.uid);
    } catch (err) {
      console.error("Error assigning receiver to new user:", err);
    }

    // ✅ STEP 4: Send Welcome Email via EmailJS
    try {
      await emailjs.send(
        process.env.REACT_APP_EMAILJS_SERVICE_ID,
        process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
        {
          userName: fullName,
          userId: userId,
          email: email,
          password: password,
          sponsorId: sponsorId || '-',
          registrationDate: joinDateString,
        },
        process.env.REACT_APP_EMAILJS_PUBLIC_KEY
      );
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Optionally: continue, don't block registration
    }

    // ✅ STEP 5: Create welcome notification
    try {
      await NotificationService.createNotification({
        userId: user.uid,
        title: '🎉 Welcome to Helping Hands Foundation!',
        message: `Welcome ${fullName}! Your account has been successfully created. Your User ID is ${userId}. Start your journey with us today!`,
        type: 'welcome',
        targetAudience: 'user',
        createdBy: 'system',
        actionLink: '/dashboard',
        priority: 'high'
      });
    } catch (notificationError) {
      console.error('Failed to create welcome notification:', notificationError);
    }

    // ✅ STEP 6: Return details to UI
    return {
      fullName,
      email,
      userId,
      password,
      joinDate: joinDateString,
      rank: getRank(newUserDoc.level),
    };

  } catch (error) {
    console.error("Error registering user:", error);
    throw error;
  }
};