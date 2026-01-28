import React, { useState, useRef, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import './ChatbotWidget.css';

const ChatbotWidget = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [idToken, setIdToken] = useState(null);
  const messagesEndRef = useRef(null);

  const auth = getAuth();

  // Get ID token on mount
  useEffect(() => {
    const getToken = async () => {
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken(true);
        setIdToken(token);
      }
    };
    getToken();
  }, [auth.currentUser]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!userInput.trim() || !idToken) return;

    const userMessage = userInput.trim();
    setUserInput('');

    // Add user message to UI
    setMessages((prev) => [...prev, { sender: 'user', text: userMessage }]);

    setLoading(true);

    try {
      const response = await fetch(
        'https://us-central1-hh-foundation.cloudfunctions.net/handleChatbotMessage',
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({
            message: userMessage
          })
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Add bot reply to UI
        setMessages((prev) => [...prev, { sender: 'bot', text: data.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: data.reply || 'Sorry, something went wrong. Please try again.'
          }
        ]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: 'Unable to connect to support. Please check your connection and try again.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="chatbot-widget">
      <div className="chatbot-header">
        <h3>HH Foundation Support</h3>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="chatbot-messages">
        {messages.length === 0 && (
          <div className="chatbot-welcome">
            <p>Hi! I am here to help. Ask me about:</p>
            <ul>
              <li>E-PIN issues</li>
              <li>Send Help or Receive Help status</li>
              <li>Upcoming payments</li>
              <li>Referrals and ranking</li>
              <li>Profile and payments</li>
              <li>Support tickets and tasks</li>
            </ul>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`message message-${msg.sender}`}>
            <div className="message-bubble">
              <p>{msg.text}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="message message-bot">
            <div className="message-bubble typing">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chatbot-input-area">
        <textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your question here..."
          disabled={loading}
          rows="2"
        />
        <button onClick={sendMessage} disabled={loading || !userInput.trim()}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default ChatbotWidget;
