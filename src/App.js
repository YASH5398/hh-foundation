import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
<<<<<<< HEAD
// Dashboard routes are now defined inline
=======
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5

// Layouts & Protected Routes
import DashboardLayout from './components/layout/DashboardLayout';
import AdminLayout from './admin/AdminLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
<<<<<<< HEAD
import DashboardWrapper from './components/auth/DashboardWrapper';
=======
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
import AdminProtectedRoute from './admin/ProtectedRoute';
import PublicRoute from './components/auth/PublicRoute';

// Pages & Components
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import AdminLogin from './admin/AdminLogin';
import AgentLogin from './pages/agent/AgentLogin';
import DashboardHome from './components/dashboard/DashboardHome';
import AdminDashboard from './admin/AdminDashboard';
import SendHelp from './components/help/SendHelp';
import ReceiveHelp from './components/help/ReceiveHelp';
<<<<<<< HEAD
import UserDetails from './pages/UserDetails';
import Leaderboard from './components/leaderboard/Leaderboard';
import ProfileSettings from './components/profile/ProfileSettings';
import DirectReferrals from './components/team/DirectReferrals';
import TransactionHistory from './components/history/TransactionHistory';
import SupportPage from './pages/SupportPage';
import SupportHub from './pages/SupportHub';
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
import PaymentVerification from './pages/agent/PaymentVerification';
import Communication from './pages/agent/Communication';
import Analytics from './pages/agent/Analytics';
import KnowledgeBase from './pages/agent/KnowledgeBase';
import DebugTools from './pages/agent/DebugTools';
import AgentChatPage from './pages/agent/AgentChat';
import EpinChecker from './pages/agent/EpinChecker';
import AgentNotifications from './pages/agent/Notifications';
import UserBugChecker from './pages/agent/UserBugChecker';
import PaymentErrors from './pages/agent/PaymentErrors';
import UserManagement from './pages/agent/UserManagement';
import SuspiciousActivityDetection from './components/agent/SuspiciousActivityDetection';
import AgentProtectedRoute from './components/AgentProtectedRoute';

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
=======
import DirectReferrals from './components/team/DirectReferrals';
import EpinDashboard from './components/epin/EpinDashboard';
import TransferEpin from './components/epin/TransferEpin';
import RequestEPIN from './components/epin/RequestEpin';
import PaymentPage from './components/epin/PaymentPage';
import EnhancedUserManager from './components/agent/EnhancedUserManager';

import EpinHistory from './components/epin/EpinHistory';
import NotFound from './pages/NotFound';
import ProfileSettings from './components/profile/ProfileSettings';
import Leaderboard from './components/leaderboard/Leaderboard';
import UpcomingPayments from './components/help/UpcomingPayments';
import Support from './pages/Support';
import UserManager from './admin/UserManager';
import UserTransactionSafetyHub from './admin/UserTransactionSafetyHub';
import EpinRequestManager from './admin/components/epin/EpinRequestManager';
import AccessDenied from './admin/AccessDenied';
import Home from './pages/HomePage';
import ChangePassword from './components/auth/ChangePassword';
import ForgotPassword from './components/auth/ForgotPassword';
import RegisterSuccess from './components/auth/RegisterSuccess';
import LevelManager from './admin/LevelManager';
import EPinManagement from './admin/components/epin/EPinManagement';
import HelpManager from './admin/components/HelpManager';
import SendHelpManager from './admin/components/SendHelpManager';
import ForceReceiverAssignment from './admin/components/ForceReceiverAssignment';
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
import ManageHelpAssignments from './pages/admin/ManageHelpAssignments';
import AdminInsights from './pages/admin/AdminInsights';
import Testimonials from './pages/admin/AdminTestimonials';
import Notifications from './admin/components/Notifications';
import DocumentManager from './pages/admin/DocumentManager';
import HiddenHelpRecords from './pages/admin/HiddenHelpRecords';
import SupportManager from './admin/components/SupportManager';
<<<<<<< HEAD
import BlockedUsersManager from './admin/components/BlockedUsersManager';
import AccessDenied from './admin/AccessDenied';

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
=======
import MakeAgent from './admin/components/MakeAgent';
import EarnFreeEPIN from './pages/EarnFreeEPIN';
import Tasks from './pages/Tasks';
import ChatbotSupport from './pages/support/ChatbotSupport';
import UserDetails from './pages/UserDetails';
import AgentChat from './pages/support/AgentChat';
import TicketSystem from './pages/support/TicketSystem';
import AgentDashboard from './pages/agent/AgentDashboard';
import SupportTickets from './pages/agent/SupportTickets';
import AgentChatPage from './pages/agent/AgentChat';
import EpinChecker from './pages/agent/EpinChecker';
import AgentNotifications from './pages/agent/Notifications';
import UserBugChecker from './pages/agent/UserBugChecker';
import PaymentErrors from './pages/agent/PaymentErrors';
import UserManagement from './pages/agent/UserManagement';
import Analytics from './pages/agent/Analytics';
import PaymentVerification from './pages/agent/PaymentVerification';
import Communication from './pages/agent/Communication';
import KnowledgeBase from './pages/agent/KnowledgeBase';
import DebugTools from './pages/agent/DebugTools';
import AgentProtectedRoute from './components/AgentProtectedRoute';
import AgentProfilePage from './pages/agent/AgentProfile';
import AgentSettings from './pages/agent/AgentSettings';
import UserSupportTickets from './components/support/UserSupportTickets';
import SupportHub from './pages/SupportHub';
import SuspiciousActivityDetection from './components/agent/SuspiciousActivityDetection';
import FCMTestComponent from './components/notifications/FCMTestComponent';
import ChatApp from './components/chat/ChatApp';

// Legal and Company Pages
import TermsConditions from './pages/TermsConditions';
import PrivacyPolicy from './pages/PrivacyPolicy';
import RefundPolicy from './pages/RefundPolicy';
import Disclaimer from './pages/Disclaimer';
import CookiePolicy from './pages/CookiePolicy';
import AboutUs from './pages/AboutUs';
import LeadershipTeam from './pages/LeadershipTeam';
import Careers from './pages/Careers';
import HelpCenter from './pages/HelpCenter';

// New Pages
import Contact from './pages/Contact';
import LiveChat from './pages/LiveChat';
import VideoTutorials from './pages/VideoTutorials';
import Community from './pages/Community';
import HowItWorks from './pages/HowItWorks';
import SuccessStories from './pages/SuccessStories';
import Resources from './pages/Resources';
import Levels from './pages/Levels';
import PaymentMethods from './pages/PaymentMethods';
import Security from './pages/Security';
import MobileApp from './pages/MobileApp';

const ErrorElement = () => (
  <div className="text-center py-10 text-red-500">Something went wrong.</div>
);

export const router = createBrowserRouter([
  // Public homepage route
  {
    path: '/',
    element: <Home />,
  },
  // Public legal and company pages
  { path: '/terms', element: <TermsConditions /> },
  { path: '/privacy', element: <PrivacyPolicy /> },
  { path: '/refund-policy', element: <RefundPolicy /> },
  { path: '/disclaimer', element: <Disclaimer /> },
  { path: '/cookie-policy', element: <CookiePolicy /> },
  { path: '/about', element: <AboutUs /> },
  { path: '/leadership', element: <LeadershipTeam /> },
  { path: '/careers', element: <Careers /> },
  { path: '/help-center', element: <HelpCenter /> },
  
  // Public information pages
  { path: '/contact', element: <Contact /> },
  { path: '/live-chat', element: <LiveChat /> },
  { path: '/tutorials', element: <VideoTutorials /> },
  { path: '/community', element: <Community /> },
  { path: '/how-it-works', element: <HowItWorks /> },
  { path: '/success-stories', element: <SuccessStories /> },
  { path: '/resources', element: <Resources /> },
  { path: '/levels', element: <Levels /> },
  { path: '/payment-methods', element: <PaymentMethods /> },
  { path: '/security', element: <Security /> },
  { path: '/mobile-app', element: <MobileApp /> },
  // Top-level auth routes
  {
    path: "/login",
    element: <PublicRoute><Login /></PublicRoute>,
  },
  {
    path: "/signup",
    element: <PublicRoute><Signup /></PublicRoute>,
  },
  {
    path: "/register",
    element: <PublicRoute><Signup /></PublicRoute>,
  },
  {
    path: "/admin/login",
    element: <PublicRoute><AdminLogin /></PublicRoute>,
  },
  {
    path: "/agent/login",
    element: <PublicRoute><AgentLogin /></PublicRoute>,
  },
  // Register success route (accessible to authenticated users)
  {
    path: '/register-success',
    element: (
      <ProtectedRoute>
        <RegisterSuccess />
      </ProtectedRoute>
    ),
  },
  // User details route (after successful signup)
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
  {
    path: '/user-details',
    element: (
      <ProtectedRoute>
        <UserDetails />
      </ProtectedRoute>
    ),
  },
<<<<<<< HEAD

  // Protected user dashboard routes
=======
  // Protected user routes
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
<<<<<<< HEAD
    children: [
      { index: true, element: <DashboardHome /> },
      { path: 'send-help', element: <SendHelp /> },
      { path: 'direct-referral', element: <DirectReferrals /> },
      { path: 'profile-settings', element: <ProfileSettings /> },
      { path: 'earn-epin', element: <EarnFreeEPIN /> },
      { path: 'leaderboard', element: <Leaderboard /> },
      { path: 'upcoming-payment', element: <UpcomingPayments /> },
      { path: 'receive-help', element: <ReceiveHelp /> },
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
          { path: 'tickets', element: <SupportTickets /> },
          { path: 'live-agent', element: <LiveChat /> },
          { path: 'chatbot', element: <ChatbotSupport /> },
        ]
      },
    ],
  },

=======
    errorElement: <ErrorElement />,
    children: [
      { index: true, element: <DashboardHome /> },
      { path: 'users', element: <EnhancedUserManager /> },
      { path: 'payments', element: <PaymentPage /> },
      { path: 'send-help', element: <SendHelp /> },
      { path: 'receive-help', element: <ReceiveHelp /> },
      { path: 'direct-referral', element: <DirectReferrals /> },
      { path: 'profile-settings', element: <ProfileSettings /> },
      { path: 'leaderboard', element: <Leaderboard /> },
      { path: 'upcoming-payment', element: <UpcomingPayments /> },
      { path: 'support', element: <SupportHub /> },
      {
        path: 'support/chatbot',
        element: <ChatbotSupport />
      },
      {
        path: 'support/live-agent',
        element: <AgentChat />
      },
      {
        path: 'support/tickets',
        element: <TicketSystem />
      },
      { path: 'support/form', element: <Support /> },
      { path: 'support/live-chat', element: <UserSupportTickets /> },
      // E-PIN routes under dashboard

      { path: 'epins/request', element: <RequestEPIN /> },
      { path: 'epins/payment', element: <PaymentPage /> },
      { path: 'epins/transfer', element: <TransferEpin /> },
      { path: 'epins/history', element: <EpinHistory /> },
      { path: 'tasks', element: <Tasks /> },
      { path: 'earn-epin', element: <EarnFreeEPIN /> },
      { path: 'testimonials', element: <EarnFreeEPIN /> },
      { path: 'fcm-test', element: <FCMTestComponent /> },
      { path: 'chat', element: <ChatApp /> },
      { path: 'change-password', element: <ChangePassword /> },
      { path: 'forgot-password', element: <ForgotPassword /> },
    ],
  },
  // Legacy E-PIN routes (redirect to dashboard)
  {
    path: '/epin',
    element: <Navigate to="/dashboard/epins/request" replace />
  },
  {
    path: '/epin/*',
    element: <Navigate to="/dashboard/epins/request" replace />
  },
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
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
      { path: 'epin-manager',
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
<<<<<<< HEAD
      { path: 'make-agent', element: <MakeAgent /> },
      { path: 'blocked-users', element: <BlockedUsersManager /> }
    ],
  },

=======
      { path: 'make-agent', element: <MakeAgent /> }
    ],
  },
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
  // Protected agent routes
  {
    path: '/agent-dashboard',
    element: (
      <AgentProtectedRoute>
        <AgentDashboard />
      </AgentProtectedRoute>
    ),
    children: [
      { path: 'profile', element: <AgentProfilePage /> },
      { path: 'settings', element: <AgentSettings /> },
      { path: 'support-tickets', element: <SupportTickets /> },
      { path: 'payment-verification', element: <PaymentVerification /> },
      { path: 'communication', element: <Communication /> },
      { path: 'analytics', element: <Analytics /> },
      { path: 'knowledge-base', element: <KnowledgeBase /> },
      { path: 'debug-tools', element: <DebugTools /> },
      { path: 'agent-chat', element: <AgentChatPage /> },
      { path: 'epin-checker', element: <EpinChecker /> },
      { path: 'notifications', element: <AgentNotifications /> },
      { path: 'user-bug-checker', element: <UserBugChecker /> },
      { path: 'payment-errors', element: <PaymentErrors /> },
      { path: 'user-management', element: <UserManagement /> },
      { path: 'suspicious-activity', element: <SuspiciousActivityDetection /> }
    ]
  },
<<<<<<< HEAD

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

=======
  { path: '/access-denied', element: <AccessDenied /> },
  { path: '*', element: <NotFound /> },
]);
>>>>>>> 60b3a7f821302b61dfef9887afd598a9a3deb9d5
