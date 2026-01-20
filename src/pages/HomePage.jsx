import React from 'react';
import Hero from '../components/landing/Hero';
import WhyChooseUs from '../components/landing/WhyChooseUs';
import HowItWorks from '../components/landing/HowItWorks';
import LevelsCharts from '../components/landing/LevelsCharts';
import UpcomingPayments from '../components/landing/UpcomingPayments';
import Leaderboard from '../components/landing/Leaderboard';
import Testimonials from '../components/landing/Testimonials';
import FAQs from '../components/landing/FAQs';
import TermsConditions from '../components/landing/TermsConditions';
import Rules from '../components/landing/Rules';
import MoreFeatures from '../components/landing/MoreFeatures';
import Footer from '../components/landing/Footer';
import FloatingChatbot from '../components/common/FloatingChatbot';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <Hero />
      
      {/* Why Choose Us */}
      <WhyChooseUs />
      
      {/* How It Works */}
      <HowItWorks />
      
      {/* Levels & Charts */}
      <LevelsCharts />
      
      {/* Upcoming Payments */}
      <UpcomingPayments />
      
      {/* Leaderboard */}
      <Leaderboard />
      
      {/* Testimonials */}
      <Testimonials />
      
      {/* FAQs */}
      <FAQs />
      
      {/* Terms & Conditions */}
      <TermsConditions />
      
      {/* Platform Rules */}
      <Rules />
      
      {/* More Features */}
      <MoreFeatures />
      
      {/* Footer */}
      <Footer />
      
      {/* Floating Chatbot */}
      <FloatingChatbot />
    </div>
  );
}