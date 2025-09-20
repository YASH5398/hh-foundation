import React, { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UnreadMessageService } from '../../services/unreadMessageService';

const ChatBadge = ({ 
  transactionType, 
  transactionId, 
  onClick, 
  className = '',
  showText = true,
  size = 'default', // 'small', 'default', 'large'
  customText = null
}) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!transactionId || !transactionType || !user?.uid) return;

    const unsubscribe = UnreadMessageService.subscribeToUnreadCount(
      transactionType,
      transactionId,
      user.uid,
      (count) => {
        setUnreadCount(count);
      }
    );

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [transactionType, transactionId, user?.uid]);

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return {
          button: 'px-2 py-1 text-xs',
          icon: 'w-3 h-3',
          badge: 'w-4 h-4 text-xs'
        };
      case 'large':
        return {
          button: 'px-4 py-3 text-base',
          icon: 'w-6 h-6',
          badge: 'w-6 h-6 text-sm'
        };
      default:
        return {
          button: 'px-3 py-2 text-sm',
          icon: 'w-4 h-4',
          badge: 'w-5 h-5 text-xs'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <button
      onClick={onClick}
      className={`
        relative inline-flex items-center space-x-2 
        bg-indigo-500 hover:bg-indigo-600 text-white 
        rounded-full transition-all duration-200 
        transform hover:scale-105 active:scale-95
        ${sizeClasses.button}
        ${className}
      `}
    >
      <MessageCircle className={sizeClasses.icon} />
      {showText && (
        <span className="font-medium">
          {customText || (size === 'small' ? 'Chat' : 
            transactionType === 'sendHelp' ? 'Chat with Receiver' : 'Chat with Sender')}
        </span>
      )}
      
      {/* Unread Badge */}
      {unreadCount > 0 && (
        <div className={`
          absolute -top-1 -right-1 
          bg-red-500 text-white rounded-full 
          flex items-center justify-center 
          font-bold border-2 border-white
          ${sizeClasses.badge}
        `}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </div>
      )}
    </button>
  );
};

export default ChatBadge;