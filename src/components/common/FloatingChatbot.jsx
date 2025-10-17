import { useAuth } from '../../context/AuthContext';

const FloatingChatbot = ({ fullScreen = false }) => {
  const { user } = useAuth();
  
  // Temporarily disabled - return null to hide the chatbot
  // The chatbot functionality has been disabled for maintenance
  // To re-enable, restore the original implementation from git history
  
  // Don't render if user is not logged in
  if (!user) return null;
  
  // Return null to completely hide the chatbot
  return null;
};

export default FloatingChatbot;