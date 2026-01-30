# Project Structure

## Directory Organization

### `/src` - Frontend Application
Main React application source code organized by feature and responsibility.

#### `/src/admin` - Admin Interface
- `AdminDashboard.jsx` - Main admin control panel
- `AdminLayout.jsx` - Admin-specific layout wrapper
- `AdminLogin.jsx` - Admin authentication page
- `UserManager.jsx` - User account management
- `LevelManager.jsx` - MLM level configuration
- `UserTransactionSafetyHub.jsx` - Payment monitoring and approval system
- `ProtectedRoute.jsx` - Admin route guards
- `AccessDenied.jsx` - Unauthorized access handler

#### `/src/components` - Reusable UI Components
Organized by feature domain:
- `admin/` - Admin-specific components
- `agent/` - Agent support interface components
- `auth/` - Login, signup, and authentication forms
- `chat/` - Real-time messaging components
- `common/` - Shared UI elements (buttons, modals, loaders)
- `dashboard/` - User dashboard widgets
- `epin/` - E-PIN purchase and management
- `help/` - Send/receive help interfaces
- `history/` - Transaction history displays
- `landing/` - Marketing and landing page sections
- `layout/` - Navigation, headers, footers
- `leaderboard/` - Ranking and achievement displays
- `notifications/` - Notification center components
- `profile/` - User profile management
- `support/` - Support ticket and chat components
- `team/` - Downline and genealogy views
- `ui/` - Base UI primitives

#### `/src/pages` - Route Pages
Top-level page components for routing:
- `admin/` - Admin panel pages
- `agent/` - Agent dashboard pages
- `support/` - Support center pages
- Marketing pages: `HomePage.jsx`, `AboutUs.jsx`, `HowItWorks.jsx`
- Feature pages: `ChatPage.jsx`, `Levels.jsx`, `Tasks.jsx`
- Legal pages: `PrivacyPolicy.jsx`, `TermsConditions.jsx`

#### `/src/services` - Business Logic Layer
Service modules handling data operations:
- `adminService.js` - Admin operations and user management
- `agentService.js` - Agent chat and support functions
- `authGuardService.js` - Authentication state management
- `chatService.js` - Real-time chat operations
- `epinService.js` - E-PIN purchase and validation
- `helpService.js` - Help request/assignment logic
- `levelService.js` - MLM level calculations
- `notificationService.js` - Push notification handling
- `realtimeService.js` - Firestore real-time listeners
- `userService.js` - User profile CRUD operations
- `epin/` - E-PIN specific service modules

#### `/src/context` - React Context Providers
Global state management:
- `AuthContext.jsx` - User authentication state
- `AgentAuthContext.jsx` - Agent authentication state
- `NotificationContext.jsx` - Notification state and preferences

#### `/src/hooks` - Custom React Hooks
Reusable stateful logic:
- `useProfile.js` - User profile data fetching
- `useHelpFlow.js` - Help request workflow management
- `useMLMActivation.js` - E-PIN activation logic
- `useChatNotifications.js` - Chat notification handling
- `useCountdown.js` - Timer and countdown utilities
- `useEscalation.js` - Support ticket escalation

#### `/src/config` - Configuration Files
- `firebase.js` - Firebase SDK initialization
- `firestoreConstants.js` - Collection and field name constants
- `statusConstants.js` - Status enum definitions
- `helpStatus.js` - Help request status values
- `supportConfig.js` - Support system configuration

#### `/src/utils` - Utility Functions
Pure helper functions:
- `eligibilityUtils.js` - Eligibility calculation logic
- `amountUtils.js` - Currency formatting and calculations
- `authUtils.js` - Authentication helpers
- `firestoreUtils.js` - Firestore query builders
- `validation.js` - Form validation rules
- `formatDate.js` - Date formatting utilities

### `/functions` - Firebase Cloud Functions
Backend serverless functions:
- `index.js` - Main function exports and HTTP endpoints
- `notificationTriggers.js` - Firestore trigger-based notifications
- `notificationFirestoreTriggers.js` - Additional notification triggers
- `setAdminClaims.js` - Admin role assignment function

#### `/functions/chatbot` - AI Chatbot System
- `handleChatbotMessage.js` - Main chatbot message handler
- `intentDetector.js` - User intent classification
- `replyEngine.js` - Response generation logic
- `firestoreReader.js` - Context data retrieval

#### `/functions/shared` - Shared Backend Logic
- `mlmCore.js` - Core MLM calculation algorithms
- `eligibilityUtils.js` - Server-side eligibility checks
- `sharedEligibilityUtils.js` - Common eligibility functions

### `/public` - Static Assets
- `index.html` - HTML entry point
- `firebase-messaging-sw.js` - Service worker for push notifications
- `images/` - Static images (avatars, payment icons)
- `manifest.json` - PWA manifest
- `robots.txt` - SEO crawler instructions

### `/backend` - Express Server (Optional)
Standalone backend server for specific operations:
- `index.js` - Express server setup
- `package.json` - Backend dependencies

### `/server` - Additional Server Utilities
- `cloudinaryConfig.js` - Cloudinary SDK configuration
- `routes/upload.js` - File upload endpoints

## Core Component Relationships

### Authentication Flow
```
App.js → AuthContext → 
  ├─ User Routes → Dashboard Components
  ├─ Admin Routes → AdminLayout → Admin Components
  └─ Agent Routes → Agent Components
```

### Help Request Flow
```
SendHelpCard → helpService.js → 
  Cloud Functions (startHelpAssignment) → 
  Firestore (helpRequests, users) → 
  notificationService → FCM
```

### E-PIN Activation Flow
```
EPINPurchase → epinService.js → 
  Firestore (epinRequests) → 
  Admin Approval (UserTransactionSafetyHub) → 
  QR Code Generation → User Activation
```

### Chat System Flow
```
ChatPage → chatService.js → 
  Firestore (chats, messages) → 
  realtimeService (listeners) → 
  Real-time UI Updates
```

## Architectural Patterns

### Frontend Architecture
- **Component-Based**: React functional components with hooks
- **Context API**: Global state management for auth and notifications
- **Service Layer**: Separation of business logic from UI components
- **Custom Hooks**: Reusable stateful logic extraction
- **Route-Based Code Splitting**: Lazy loading for performance

### Backend Architecture
- **Serverless Functions**: Firebase Cloud Functions for backend logic
- **Event-Driven**: Firestore triggers for automated workflows
- **Real-time Database**: Firestore for live data synchronization
- **Microservices Pattern**: Separate functions for distinct responsibilities

### Data Flow Pattern
1. User interaction in React component
2. Component calls service function
3. Service interacts with Firebase SDK
4. Firestore triggers Cloud Function (if applicable)
5. Cloud Function processes and updates data
6. Real-time listener updates UI automatically

### Security Pattern
- **Custom Claims**: Role-based access control via Firebase Auth
- **Firestore Rules**: Database-level security rules
- **Protected Routes**: Client-side route guards
- **Server Validation**: Cloud Functions validate all critical operations
