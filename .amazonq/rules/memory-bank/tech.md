# Technology Stack

## Programming Languages
- **JavaScript (ES6+)**: Primary language for frontend and backend
- **JSX**: React component syntax
- **HTML5**: Markup for web pages
- **CSS3**: Styling with Tailwind utility classes

## Frontend Framework & Libraries

### Core Framework
- **React 18.3.1**: Component-based UI library
- **React DOM 18.3.1**: React rendering for web
- **React Router DOM 6.30.1**: Client-side routing

### UI Component Libraries
- **Tailwind CSS 3.3.2**: Utility-first CSS framework
- **Headless UI 2.2.4**: Unstyled accessible components
- **Heroicons 2.2.0**: SVG icon library
- **Lucide React 0.525.0**: Additional icon set
- **React Icons 5.5.0**: Popular icon packs
- **Radix UI Tabs 1.1.12**: Accessible tab components

### Animation & Interaction
- **Framer Motion 10.18.0**: Animation library
- **React CountUp 6.5.3**: Number animation effects

### Data Visualization
- **Recharts 3.2.0**: Chart and graph components

### Form & Input
- **Emoji Picker React 4.13.3**: Emoji selection component

### Notifications & Feedback
- **React Hot Toast 2.4.1**: Toast notification system
- **React Toastify 11.0.5**: Alternative toast notifications

### Utilities
- **Date-fns 4.1.0**: Date manipulation and formatting
- **Day.js 1.11.13**: Lightweight date library

## Backend & Cloud Services

### Firebase Platform
- **Firebase 10.14.1**: Client SDK
- **Firebase Admin 13.4.0**: Server SDK for Cloud Functions
- **Firebase Authentication**: User authentication and custom claims
- **Cloud Firestore**: NoSQL real-time database
- **Cloud Functions**: Serverless backend functions
- **Cloud Storage**: File storage for images and documents
- **Firebase Cloud Messaging (FCM)**: Push notifications
- **Firebase Hosting**: Static site hosting

### Additional Backend Services
- **Cloudinary**: Image upload and transformation service
- **EmailJS 3.2.0**: Email sending service

## Build Tools & Development

### Build System
- **CRACO 7.1.0**: Create React App Configuration Override
- **React Scripts 5.0.1**: Create React App build scripts
- **PostCSS 8.4.21**: CSS transformation tool
- **Autoprefixer 10.4.14**: CSS vendor prefix automation

### Testing
- **@testing-library/react 16.3.1**: React component testing
- **@testing-library/jest-dom 6.9.1**: Jest DOM matchers
- **@testing-library/user-event 13.5.0**: User interaction simulation
- **@firebase/testing 0.20.11**: Firebase emulator testing
- **Puppeteer 24.19.0**: Headless browser automation

### Code Quality
- **ESLint 8.44.0**: JavaScript linting
- **eslint-config-react-app 7.0.1**: React-specific ESLint rules

## Configuration Files

### Build Configuration
- `craco.config.js` - CRACO configuration for Tailwind
- `postcss.config.js` - PostCSS plugins configuration
- `tailwind.config.js` - Tailwind CSS customization
- `package.json` - Dependencies and scripts

### Firebase Configuration
- `firebase.json` - Firebase project configuration
- `firestore.rules` - Firestore security rules
- `firestore.indexes.json` - Firestore index definitions
- `storage.rules` - Cloud Storage security rules
- `.firebaserc` - Firebase project aliases

### Environment Configuration
- `.env` - Environment variables (not in version control)
- `.env.example` - Environment variable template

## Development Commands

### Local Development
```bash
npm start          # Start development server with CRACO
npm run dev        # Alternative start command with react-scripts
```

### Building
```bash
npm run build      # Production build with CRACO
```

### Testing
```bash
npm test           # Run test suite in watch mode
```

### Firebase Deployment
```bash
firebase deploy                    # Deploy all services
firebase deploy --only hosting     # Deploy frontend only
firebase deploy --only functions   # Deploy Cloud Functions only
firebase deploy --only firestore   # Deploy Firestore rules
```

### Firebase Emulators
```bash
firebase emulators:start           # Start local emulators
```

## Environment Variables Required

### Firebase Configuration
- `REACT_APP_FIREBASE_API_KEY` - Firebase API key
- `REACT_APP_FIREBASE_AUTH_DOMAIN` - Auth domain
- `REACT_APP_FIREBASE_PROJECT_ID` - Project ID
- `REACT_APP_FIREBASE_STORAGE_BUCKET` - Storage bucket
- `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` - FCM sender ID
- `REACT_APP_FIREBASE_APP_ID` - Firebase app ID
- `REACT_APP_FIREBASE_MEASUREMENT_ID` - Analytics measurement ID

### Service Configuration
- `REACT_APP_CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `REACT_APP_CLOUDINARY_UPLOAD_PRESET` - Upload preset
- `REACT_APP_EMAILJS_SERVICE_ID` - EmailJS service ID
- `REACT_APP_EMAILJS_TEMPLATE_ID` - EmailJS template ID
- `REACT_APP_EMAILJS_USER_ID` - EmailJS user ID

### Firebase Functions Environment
- Service account credentials for admin operations
- API keys for external services

## Browser Support

### Production
- >0.2% market share
- Not dead browsers
- Not Opera Mini

### Development
- Latest Chrome version
- Latest Firefox version
- Latest Safari version

## Performance Optimizations
- Code splitting via React.lazy and Suspense
- Tailwind CSS purging for minimal bundle size
- Firebase SDK tree-shaking
- Image optimization via Cloudinary
- Service worker for offline support and push notifications

## Security Measures
- Firebase Authentication with custom claims
- Firestore security rules for data access control
- Storage rules for file upload restrictions
- CORS configuration for API endpoints
- Environment variable protection
- Service account key management
