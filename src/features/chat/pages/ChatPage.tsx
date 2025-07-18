import React, { useState, useEffect, useCallback } from 'react';
import { FiSettings, FiMessageSquare } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useThemeStore } from '../../../shared/store/themeStore';
import { useAuthStore } from '../../../shared/store/authStore';
import UserList from '../components/UserList';
import ChatWindow from '../components/ChatWindow';
import type { Theme } from '../../../shared/types/theme';
import { useChat } from '../hooks/useChat';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import { createPortal } from 'react-dom';
import type { User } from '../../../shared/types/user';

const ChatPage: React.FC = () => {
  const { currentTheme, setTheme } = useThemeStore();
  const { currentUser, loadingAuth } = useAuthStore();
  const navigate = useNavigate();

  // State to manage sidebar visibility, default to true for mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const {
    allUsers,
    conversations,
    messages,
    selectedConversation,
    selectedOtherUser,
    isLoadingInitialData,
    isLoadingMessages,
    sendMessage,
    sendMediaMessage,
    isSendingMessage,
    selectUserForChat,
    resetChatWindow,
    setTypingStatus,
  } = useChat();

  // Handle sidebar visibility on resize
  useEffect(() => {
    const handleResize = () => {
      // On small screens, show user list by default unless a conversation is selected
      if (window.innerWidth < 768) {
        setIsSidebarOpen(!selectedConversation);
      } else {
        // On large screens, always show sidebar
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Initialize on mount
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedConversation]);

  const handleSelectUserForChat = useCallback(
    (user: User) => {
      selectUserForChat(user);
      // Hide sidebar on small screens when a user is selected
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    },
    [selectUserForChat]
  );

  const handleGoBackToUserList = useCallback(() => {
    resetChatWindow();
    // Show sidebar on small screens when going back
    if (window.innerWidth < 768) {
      setIsSidebarOpen(true);
    }
  }, [resetChatWindow]);

  const themes: Theme[] = ['crystal-light', 'midnight-glow', 'ocean-breeze', 'sunset-glow', 'slate-elegance'];

  if (loadingAuth || isLoadingInitialData || !currentUser?.id) {
    return createPortal(
      <motion.div
        className="fixed inset-0 flex flex-col items-center justify-center bg-background text-text-secondary z-[9999]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <LoadingSpinner size={24} thickness={4} color="text-primary" />
        <p className="mt-4 text-lg font-medium">Loading chat data...</p>
        <p className="text-sm">Please wait a moment while we fetch your conversations.</p>
      </motion.div>,
      document.body
    );
  }

  return (
    <motion.div
      className="flex h-screen bg-background text-text-primary overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Sidebar (UserList) */}
      <div
        className={`fixed inset-y-0 left-0 w-full sm:w-80 md:w-96 bg-background border-r border-border shadow-lg md:relative ${
          isSidebarOpen ? 'block' : 'hidden'
        } flex flex-col z-40`}
      >
        <div className="p-4 border-b border-border flex justify-between items-center bg-background z-10">
          <h1 className="text-2xl font-extrabold text-primary tracking-wide">ChatSphere</h1>
          <div className="flex items-center space-x-2">
            <motion.button
              onClick={() => navigate('/settings')}
              className="p-2 rounded-full hover:bg-input-bg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary"
              title="Settings"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FiSettings size={22} className="text-text-secondary" />
            </motion.button>
          </div>
        </div>
        <div className="flex-grow overflow-y-auto custom-scrollbar">
          {currentUser && (
            <UserList
              conversations={conversations}
              onSelectConversation={handleSelectUserForChat}
              selectedConversationId={selectedConversation?.id || null}
              currentUser={currentUser}
              allUsers={allUsers}
            />
          )}
        </div>
        <div className="p-4 border-t border-border mt-auto bg-background z-10">
          <h3 className="text-sm font-semibold mb-3 text-text-secondary">Choose Theme</h3>
          <div className="flex justify-start gap-3 flex-wrap">
            {themes.map((theme) => (
              <motion.button
                key={theme}
                type="button"
                onClick={() => setTheme(theme)}
                className={`w-8 h-8 rounded-full border-2 p-0.5
                            ${currentTheme === theme ? 'border-primary shadow-lg' : 'border-border opacity-70'}
                            focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 transform`}
                title={`Set ${theme} theme`}
                whileHover={{ scale: 1.15, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
              >
                <div className={`w-full h-full rounded-full theme-${theme} bg-primary`} />
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content (ChatWindow or Placeholder) */}
      <motion.main
        className={`flex-1 flex flex-col bg-background relative z-10 ${isSidebarOpen && window.innerWidth < 768 ? 'hidden' : 'flex'}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {selectedConversation && currentUser && selectedOtherUser ? (
          <ChatWindow
            conversation={selectedConversation}
            messages={messages}
            currentUser={currentUser}
            allUsers={allUsers}
            onSendMessage={sendMessage}
            onSendMediaMessage={sendMediaMessage}
            isSendingMessage={isSendingMessage}
            otherUser={selectedOtherUser}
            onGoBack={handleGoBackToUserList}
            isLoadingMessages={isLoadingMessages}
            onSetTypingStatus={setTypingStatus}
          />
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 text-text-secondary text-lg p-4 text-center md:flex">
            <FiMessageSquare size={80} className="mb-4 text-text-secondary opacity-50" />
            <p className="font-semibold text-xl mb-2">Welcome to ChatSphere!</p>
            <p>Select a user from the list to start a conversation.</p>
          </div>
        )}
      </motion.main>
    </motion.div>
  );
};

export default ChatPage;