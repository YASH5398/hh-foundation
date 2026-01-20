import { Route } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";

// Import all dashboard components
import DashboardHome from "../components/dashboard/DashboardHome";
import SendHelp from "../components/help/SendHelp";
import DirectReferrals from "../components/team/DirectReferrals";
import ProfileSettings from "../components/profile/ProfileSettings";
import EarnFreeEPIN from "../pages/EarnFreeEPIN";
import Leaderboard from "../components/leaderboard/Leaderboard";
import UpcomingPayments from "../components/dashboard/UpcomingPayments";
import RequestEPIN from "../components/epin/RequestEpin";
import EpinHistory from "../components/epin/EpinHistory";
import TransferEpin from "../components/epin/TransferEpin";
import PaymentPage from "../components/epin/PaymentPage";
import SupportTickets from "../pages/agent/SupportTickets";
import LiveChat from "../pages/LiveChat";
import Tasks from "../pages/Tasks";
import ChatbotSupport from "../pages/support/ChatbotSupport";

export const dashboardRoutes = (
  <Route path="/dashboard" element={<DashboardLayout />}>

    <Route index element={<DashboardHome />} />

    <Route path="send-help" element={<SendHelp />} />
    <Route path="direct-referral" element={<DirectReferrals />} />
    <Route path="profile-settings" element={<ProfileSettings />} />

    <Route path="earn-epin" element={<EarnFreeEPIN />} />
    <Route path="leaderboard" element={<Leaderboard />} />
    <Route path="upcoming-payment" element={<UpcomingPayments />} />
    <Route path="tasks" element={<Tasks />} />

    <Route path="epins">
      <Route path="request" element={<RequestEPIN />} />
      <Route path="payment" element={<PaymentPage />} />
      <Route path="history" element={<EpinHistory />} />
      <Route path="transfer" element={<TransferEpin />} />
    </Route>

    <Route path="support">
      <Route path="tickets" element={<SupportTickets />} />
      <Route path="live-agent" element={<LiveChat />} />
      <Route path="chatbot" element={<ChatbotSupport />} />
    </Route>

  </Route>
);
