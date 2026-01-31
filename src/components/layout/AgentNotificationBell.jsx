import React, { useState, useEffect } from 'react';
import { FiBell } from 'react-icons/fi';
import { listenToAgentNotifications } from '../../services/agentNotificationService';
import AgentNotificationsModal from '../agent/AgentNotificationsModal';
import { AnimatePresence } from 'framer-motion';
import { useAgentAuth } from '../../context/AgentAuthContext';

export const AgentNotificationBell = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [hasPermissionError, setHasPermissionError] = useState(false);

    // Get auth state from context
    const { currentUser, isAgent, isAdmin, loading } = useAgentAuth();

    useEffect(() => {
        // Guard: Don't start listener until auth is fully loaded and user has proper role
        if (loading) return;
        if (!currentUser) return;
        if (!isAgent && !isAdmin) return;

        setHasPermissionError(false);

        const unsubscribe = listenToAgentNotifications(
            (data) => {
                const count = data.filter(n => !n.isRead).length;
                setUnreadCount(count);
            },
            (error) => {
                // Handle permission error - stop listening and don't show badge
                if (error?.code === 'permission-denied') {
                    setHasPermissionError(true);
                    setUnreadCount(0);
                }
            }
        );

        return () => unsubscribe();
    }, [currentUser, isAgent, isAdmin, loading]);

    // Don't render bell if there's a permission error or no valid role
    if (hasPermissionError) {
        return null;
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(true)}
                className={`relative p-2.5 bg-slate-900/50 border border-slate-800 rounded-xl transition-all ${isOpen ? 'text-blue-400 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                aria-label="Agent Notifications"
            >
                <FiBell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.6)] animate-pulse"></span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <AgentNotificationsModal
                        isOpen={isOpen}
                        onClose={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default AgentNotificationBell;

