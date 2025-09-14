# HH Foundation - Agent Dashboard System

A comprehensive React-based agent dashboard system for managing support tickets, payment verifications, user management, and administrative tasks.

## 🚀 Features

### Agent Dashboard
- **Real-time Analytics**: Live metrics and performance tracking
- **Support Ticket Management**: Complete ticket lifecycle management
- **Payment Verification**: Secure payment processing and verification
- **User Management**: Comprehensive user data management with search and filters
- **Communication Tools**: Integrated chat and messaging system
- **Knowledge Base**: Searchable templates and documentation
- **Debug Tools**: System monitoring and debugging capabilities
- **Bug Tracking**: User bug report management and resolution
- **Escalation System**: Request escalation to admin level

### Technical Features
- **Mobile-First Design**: Responsive UI optimized for all devices
- **Real-time Updates**: Firebase Firestore integration for live data
- **Modern UI**: Tailwind CSS with Framer Motion animations
- **Authentication**: Secure Firebase Authentication
- **Error Handling**: Comprehensive error boundaries and validation
- **Performance Optimized**: Lazy loading and efficient data fetching

## 🛠️ Technology Stack

- **Frontend**: React 18+ with Hooks
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: React Icons (Feather Icons)
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Routing**: React Router DOM
- **State Management**: React Context API
- **Notifications**: React Hot Toast
- **Build Tool**: Create React App

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hh_foundation
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Firestore Database and Authentication
   - Copy your Firebase config to `src/config/firebase.js`

4. **Start the development server**
   ```bash
   npm start
   ```

   The application will open at `http://localhost:3000`

## 🔧 Configuration

### Firebase Setup

Create `src/config/firebase.js` with your Firebase configuration:

```javascript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  // Your Firebase config
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
```

### Environment Variables

Create a `.env` file in the root directory:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

## 📁 Project Structure

```
src/
├── components/           # Reusable components
│   ├── agent/           # Agent-specific components
│   ├── auth/            # Authentication components
│   ├── common/          # Shared components
│   ├── dashboard/       # Dashboard components
│   ├── layout/          # Layout components
│   └── ui/              # UI components
├── pages/               # Page components
│   ├── agent/           # Agent dashboard pages
│   ├── auth/            # Authentication pages
│   └── dashboard/       # User dashboard pages
├── context/             # React Context providers
├── config/              # Configuration files
├── utils/               # Utility functions
└── styles/              # Global styles
```

## 🎯 Agent Dashboard Pages

### 1. Dashboard Overview (`/agent-dashboard`)
- Real-time metrics and KPIs
- Quick action buttons
- Recent activity feed
- Performance charts

### 2. Support Tickets (`/agent-dashboard/support-tickets`)
- Ticket list with filters and search
- Ticket details and history
- Status management
- Response templates

### 3. Payment Verification (`/agent-dashboard/payment-verification`)
- Payment request queue
- Verification tools
- Transaction history
- Approval workflow

### 4. Communication (`/agent-dashboard/communication`)
- Live chat interface
- Message history
- User contact management
- Automated responses

### 5. Analytics (`/agent-dashboard/analytics`)
- Performance metrics
- Resolution time tracking
- Customer satisfaction scores
- Detailed reports

### 6. Knowledge Base (`/agent-dashboard/knowledge-base`)
- Searchable documentation
- Response templates
- FAQ management
- Category organization

### 7. User Management (`/agent-dashboard/user-management`)
- User search and filtering
- Profile management
- Account status tracking
- Activity monitoring

### 8. Debug Tools (`/agent-dashboard/debug-tools`)
- System logs viewer
- Performance monitoring
- Error tracking
- Diagnostic tools

### 9. Bug Checker (`/agent-dashboard/user-bug-checker`)
- Bug report management
- Priority assignment
- Status tracking
- Resolution workflow

### 10. Request Admin (`/agent-dashboard/request-admin`)
- Escalation requests
- Admin communication
- Request tracking
- Priority management

## 🔐 Authentication

The system uses Firebase Authentication with role-based access control:

- **Agents**: Access to agent dashboard and tools
- **Users**: Access to user dashboard
- **Admins**: Full system access

## 📱 Responsive Design

The application is built with a mobile-first approach:

- **Mobile**: Optimized for phones (320px+)
- **Tablet**: Enhanced for tablets (768px+)
- **Desktop**: Full features for desktop (1024px+)

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## 🧪 Testing

Run the test suite:

```bash
npm test
```

## 📊 Performance

- **Lighthouse Score**: 90+ across all metrics
- **Bundle Size**: Optimized with code splitting
- **Load Time**: < 3 seconds on 3G networks
- **Real-time Updates**: Sub-second data synchronization

## 🔧 Development

### Code Style

- ESLint configuration for code quality
- Prettier for code formatting
- Consistent naming conventions
- Component-based architecture

### Best Practices

- React Hooks for state management
- Error boundaries for error handling
- Lazy loading for performance
- Accessibility compliance (WCAG 2.1)

## 🐛 Troubleshooting

### Common Issues

1. **Firebase Connection Issues**
   - Verify Firebase configuration
   - Check network connectivity
   - Ensure Firestore rules are configured

2. **Authentication Problems**
   - Clear browser cache and cookies
   - Check Firebase Auth settings
   - Verify user permissions

3. **Performance Issues**
   - Enable React DevTools Profiler
   - Check network requests
   - Monitor Firestore usage

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Updates

- **v1.0.0**: Initial release with core features
- **v1.1.0**: Added real-time analytics
- **v1.2.0**: Enhanced mobile responsiveness
- **v1.3.0**: Added debug tools and bug tracking

---

**Built with ❤️ for efficient agent management**