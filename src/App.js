import { createBrowserRouter, Navigate } from 'react-router-dom';
// Dashboard routes are now defined inline

// Layouts & Protected Routes
import DashboardLayout from './components/layout/DashboardLayout';
import AdminLayout from './admin/AdminLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminProtectedRoute from './admin/ProtectedRoute';
import PublicRoute from './components/auth/PublicRoute';
import AgentLayout from './components/layout/AgentLayout';

// Pages & Components
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import AdminLogin from './admin/AdminLogin';
import AgentLogin from './pages/agent/AgentLogin';
import DashboardHome from './components/dashboard/DashboardHome';
import AdminDashboard from './admin/AdminDashboard';
import SendHelp from './components/help/SendHelp';
import ReceiveHelp from './components/help/ReceiveHelp';
import ChatPage from './pages/ChatPage';
import UserDetails from './pages/UserDetails';
import Leaderboard from './components/leaderboard/Leaderboard';
import ProfileSettings from './components/profile/ProfileSettings';
import DirectReferrals from './components/team/DirectReferrals';
import SupportPage from './pages/SupportPage';
import ChatbotSupport from './pages/support/ChatbotSupport';
import EarnFreeEPIN from './pages/EarnFreeEPIN';
import Tasks from './pages/Tasks';
import RequestEPIN from './components/epin/RequestEpin';
import EpinHistory from './components/epin/EpinHistory';
import UpcomingPayments from './components/dashboard/UpcomingPayments';
import TransferEpin from './components/epin/TransferEpin';
import PaymentPage from './components/epin/PaymentPage';
import HomePage from './pages/HomePage';
import AboutUs from './pages/AboutUs';
import Contact from './pages/Contact';
import HowItWorks from './pages/HowItWorks';
import LeadershipTeam from './pages/LeadershipTeam';
import Levels from './pages/Levels';
import MobileApp from './pages/MobileApp';
import Security from './pages/Security';
import SuccessStories from './pages/SuccessStories';
import VideoTutorials from './pages/VideoTutorials';
import Resources from './pages/Resources';
import LiveChat from './pages/LiveChat';
import HelpCenter from './pages/HelpCenter';
import CookiePolicy from './pages/CookiePolicy';
import Disclaimer from './pages/Disclaimer';
import PrivacyPolicy from './pages/PrivacyPolicy';
import RefundPolicy from './pages/RefundPolicy';
import TermsConditions from './pages/TermsConditions';
import NotFound from './pages/NotFound';

// Agent Pages
import AgentDashboard from './pages/agent/AgentDashboard';
import AgentProfilePage from './pages/agent/AgentProfile';
import AgentSettings from './pages/agent/AgentSettings';
import SupportTickets from './pages/agent/SupportTickets';
import UserSupportTickets from './components/support/UserSupportTickets';
import Communication from './pages/agent/Communication';
import Analytics from './pages/agent/Analytics';
import DebugTools from './pages/agent/DebugTools';
import AgentChatPage from './pages/agent/AgentChat';
import EpinChecker from './pages/agent/EpinChecker';
import AgentNotifications from './pages/agent/Notifications';
import UserBugChecker from './pages/agent/UserBugChecker';
import PaymentErrors from './pages/agent/PaymentErrors';
import UserManagement from './pages/agent/UserManagement';
import UserHelpTracker from './pages/agent/UserHelpTracker';
import SuspiciousActivityDetection from './components/agent/SuspiciousActivityDetection';
import AgentProtectedRoute from './components/AgentProtectedRoute';
import UpcomingPay from './pages/agent/UpcomingPay';
import SpamMonitor from './pages/agent/SpamMonitor';
import LevelLeakageDetector from './pages/agent/LevelLeakageDetector';

// Admin Components
import UserManager from './admin/UserManager';
import UserTransactionSafetyHub from './admin/UserTransactionSafetyHub';
import MakeAgent from './admin/components/MakeAgent';
import EPinManagement from './admin/components/epin/EPinManagement';
import EpinRequestManager from './admin/components/epin/EpinRequestManager';
import HelpManager from './admin/components/HelpManager';
import SendHelpManager from './admin/components/SendHelpManager';
import ForceReceiverAssignment from './admin/components/ForceReceiverAssignment';
import LevelManager from './admin/LevelManager';
import ManageHelpAssignments from './pages/admin/ManageHelpAssignments';
import AdminInsights from './pages/admin/AdminInsights';
import Testimonials from './pages/admin/AdminTestimonials';
import Notifications from './admin/components/Notifications';
import DocumentManager from './pages/admin/DocumentManager';
import HiddenHelpRecords from './pages/admin/HiddenHelpRecords';
import SupportManager from './admin/components/SupportManager';
import BlockedUsersManager from './admin/components/BlockedUsersManager';
import AccessDenied from './admin/AccessDenied';
import AgentChats from './pages/admin/AgentChats';
import MigrationPage from './admin/components/MigrationPage';
import UnblockUser from './admin/components/UnblockUser';

export const router = createBrowserRouter([
  // Public routes
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/login',
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    ),
  },
  {
    path: '/signup',
    element: (
      <PublicRoute>
        <Signup />
      </PublicRoute>
    ),
  },
  {
    path: '/agent-login',
    element: <AgentLogin />,
  },
  {
    path: '/admin/login',
    element: <AdminLogin />,
  },

  // User details route (after signup)
  {
    path: '/user-details',
    element: (
      <ProtectedRoute>
        <UserDetails />
      </ProtectedRoute>
    ),
  },

  // Protected user dashboard routes
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardHome /> },
      { path: 'send-help', element: <SendHelp /> },
      { path: 'direct-referral', element: <DirectReferrals /> },
      { path: 'profile-settings', element: <ProfileSettings /> },
      { path: 'earn-epin', element: <EarnFreeEPIN /> },
      { path: 'leaderboard', element: <Leaderboard /> },
      { path: 'upcoming-payment', element: <UpcomingPayments /> },
      { path: 'receive-help', element: <ReceiveHelp /> },
      { path: 'chat/:helpId', element: <ChatPage /> },
      { path: 'tasks', element: <Tasks /> },
      {
        path: 'epins',
        children: [
          { path: 'request', element: <RequestEPIN /> },
          { path: 'payment', element: <PaymentPage /> },
          { path: 'history', element: <EpinHistory /> },
          { path: 'transfer', element: <TransferEpin /> },
        ]
      },
      {
        path: 'support',
        children: [
          { path: 'tickets', element: <UserSupportTickets /> },
          { path: 'live-agent', element: <LiveChat /> },
          { path: 'chatbot', element: <ChatbotSupport /> },
        ]
      },
    ],
  },

  // Protected admin routes
  {
    path: '/admin',
    element: (
      <AdminProtectedRoute>
        <AdminLayout />
      </AdminProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <AdminDashboard /> },
      { path: 'safety-hub', element: <UserTransactionSafetyHub /> },
      { path: 'users', element: <UserManager /> },
      { path: 'epin-requests', element: <EpinRequestManager /> },
      {
        path: 'epin-manager',
        element: <EPinManagement />
      },
      { path: 'help-manager', element: <HelpManager /> },
      { path: 'sendhelp-manager', element: <SendHelpManager /> },
      { path: 'force-assignment', element: <ForceReceiverAssignment /> },
      { path: 'level-manager', element: <LevelManager /> },
      { path: 'manage-assignments', element: <ManageHelpAssignments /> },
      { path: 'insights', element: <AdminInsights /> },
      { path: 'testimonials', element: <Testimonials /> },
      { path: 'notifications', element: <Notifications /> },
      { path: 'documents', element: <DocumentManager /> },
      { path: 'hidden-records', element: <HiddenHelpRecords /> },
      { path: 'support-manager', element: <SupportManager /> },
      { path: 'make-agent', element: <MakeAgent /> },
      { path: 'blocked-users', element: <BlockedUsersManager /> },
      { path: 'agent-chats', element: <AgentChats /> },
      { path: 'migration', element: <MigrationPage /> },
      { path: 'unblock-user', element: <UnblockUser /> }
    ],
  },

  // Protected agent routes
  {
    path: '/agent-dashboard',
    element: (
      <AgentProtectedRoute>
        <AgentLayout />
      </AgentProtectedRoute>
    ),
    children: [
      { index: true, element: <AgentDashboard /> },
      { path: 'profile', element: <AgentProfilePage /> },
      { path: 'settings', element: <AgentSettings /> },
      { path: 'support-tickets', element: <SupportTickets /> },
      { path: 'communication', element: <Communication /> },
      { path: 'analytics', element: <Analytics /> },
      { path: 'debug-tools', element: <DebugTools /> },
      { path: 'agent-chat', element: <AgentChatPage /> },
      { path: 'epin-checker', element: <EpinChecker /> },
      { path: 'notifications', element: <AgentNotifications /> },
      { path: 'user-bug-checker', element: <UserBugChecker /> },
      { path: 'payment-errors', element: <PaymentErrors /> },
      { path: 'user-management', element: <UserManagement /> },
      { path: 'user-help-tracker', element: <UserHelpTracker /> },
      { path: 'upcoming-pay', element: <UpcomingPay /> },
      { path: 'spam-monitor', element: <SpamMonitor /> },
      { path: 'level-leakage', element: <LevelLeakageDetector /> },
      { path: 'unblock-user', element: <UnblockUser /> }
    ]
  },

  // Other public routes
  { path: '/about', element: <AboutUs /> },
  { path: '/contact', element: <Contact /> },
  { path: '/how-it-works', element: <HowItWorks /> },
  { path: '/leadership', element: <LeadershipTeam /> },
  { path: '/levels', element: <Levels /> },
  { path: '/mobile-app', element: <MobileApp /> },
  { path: '/security', element: <Security /> },
  { path: '/success-stories', element: <SuccessStories /> },
  { path: '/video-tutorials', element: <VideoTutorials /> },
  { path: '/resources', element: <Resources /> },
  { path: '/live-chat', element: <LiveChat /> },
  { path: '/help-center', element: <HelpCenter /> },
  { path: '/cookie-policy', element: <CookiePolicy /> },
  { path: '/disclaimer', element: <Disclaimer /> },
  { path: '/privacy-policy', element: <PrivacyPolicy /> },
  { path: '/refund-policy', element: <RefundPolicy /> },
  { path: '/terms-conditions', element: <TermsConditions /> },
  { path: '/support', element: <SupportPage /> },
  { path: '/access-denied', element: <AccessDenied /> },
  { path: '*', element: <NotFound /> },
]);

