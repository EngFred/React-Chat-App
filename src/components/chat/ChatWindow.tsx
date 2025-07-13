import React, { useEffect, useState } from 'react';
import ScrollToBottom from 'react-scroll-to-bottom';
import type { Message } from '../../types/message';
import type { Conversation } from '../../types/conversation';
import type { User } from '../../types/user';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { FiInfo, FiChevronLeft } from 'react-icons/fi';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, appId } from '../../config/firebase';

dayjs.extend(relativeTime);

interface ChatWindowProps {
  conversation: Conversation;
  messages: Message[];
  currentUser: User;
  allUsers: User[];
  onSendMessage: (text: string, type: 'text' | 'image' | 'video' | 'file', file?: File) => void;
  otherUser: User;
  onGoBack: () => void;
  isLoadingMessages: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ conversation: initialConversation, messages, currentUser, allUsers, onSendMessage, otherUser: initialOtherUser, onGoBack, isLoadingMessages }) => {
  const [otherUser, setOtherUser] = useState<User | null>(initialOtherUser);
  const [conversation, setConversation] = useState<Conversation>(initialConversation);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Real-time listener for otherUser's status
  useEffect(() => {
    if (!initialOtherUser?.id) {
      setIsLoadingUser(false);
      return;
    }

    setIsLoadingUser(true);
    const userDocRef = doc(db, `artifacts/${appId}/users`, initialOtherUser.id);
    const unsubscribe = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const userData = { id: doc.id, ...doc.data() } as User;
        setOtherUser(userData);
        setIsLoadingUser(false);
      } else {
        setIsLoadingUser(false);
      }
    }, (error) => {
      console.error('Error fetching other user status:', error);
      setIsLoadingUser(false);
    });

    return () => unsubscribe();
  }, [initialOtherUser.id]);

  // Real-time listener for conversation updates (typingUsers)
  useEffect(() => {
    if (!initialConversation?.id) return;

    const conversationDocRef = doc(db, `artifacts/${appId}/conversations`, initialConversation.id);
    const unsubscribe = onSnapshot(conversationDocRef, (doc) => {
      if (doc.exists()) {
        const conversationData = { id: doc.id, ...doc.data() } as Conversation;
        setConversation(conversationData);
      }
    }, (error) => {
      console.error('Error fetching conversation updates:', error);
    });

    return () => unsubscribe();
  }, [initialConversation.id]);

  const getParticipantDetails = (userId: string) => {
    return allUsers.find(user => user.id === userId) || {
      id: userId,
      username: 'Unknown',
      email: 'unknown@example.com',
      profilePicture: `https://ui-avatars.com/api/?name=${encodeURIComponent('U')}&background=random&color=fff&size=128`,
      isOnline: false,
      createdAt: new Date().toISOString(),
    };
  };

  const getStatusText = () => {
    const isTyping = conversation?.typingUsers?.includes(otherUser?.id ?? '') || false;
    if (isTyping) {
      return { text: 'Typing...', className: 'text-blue-500' };
    }
    if (otherUser?.isOnline) {
      return { text: 'Online', className: 'text-green-500' };
    }
    if (otherUser?.lastSeen) {
      return { text: `Last seen ${dayjs(otherUser.lastSeen).fromNow()}`, className: 'text-gray-500' };
    }
    return { text: 'Offline', className: 'text-gray-500' };
  };

  if (isLoadingUser || isLoadingMessages || !otherUser) {
    return (
      <div className="flex items-center justify-center h-full bg-background text-text-secondary text-lg">
        Loading conversation...
      </div>
    );
  }

  const headerInfo = {
    name: otherUser.username,
    image: otherUser.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.username || 'U')}&background=random&color=fff&size=128`,
    status: getStatusText(),
  };

  return (
    <motion.div
      className="flex flex-col h-full"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between p-3 bg-background border-b border-border shadow-sm sticky top-0 z-10">
        <div className="flex items-center">
          <motion.button
            className="p-2 mr-2 rounded-full hover:bg-input-bg transition-colors duration-200"
            onClick={onGoBack}
            title="Back to conversations"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FiChevronLeft size={24} className="text-text-primary" />
          </motion.button>
          <div className="relative">
            <img
              src={headerInfo.image}
              alt={headerInfo.name}
              className={`w-10 h-10 rounded-full object-cover mr-3 ${otherUser.isOnline ? 'border-2 border-green-500' : 'border-2 border-transparent'}`}
              onError={(e) => {
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(headerInfo.name || 'U')}&background=random&color=fff&size=128`;
              }}
            />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">{headerInfo.name}</h2>
            <AnimatePresence mode="wait">
              <motion.span
                key={headerInfo.status.text}
                className={`text-sm font-medium ${headerInfo.status.className}`}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
              >
                {headerInfo.status.text}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
        <motion.button
          className="p-2 rounded-full hover:bg-input-bg transition-colors duration-200"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <FiInfo size={24} className="text-text-secondary" />
        </motion.button>
      </div>
      <ScrollToBottom
        className="flex-1 p-4 overflow-y-auto bg-background pb-16 sm:pb-4"
        scrollViewClassName="messages-container"
        initialScrollBehavior="auto"
        followButtonClassName="hidden"
      >
        <style>
          {`
            .messages-container::-webkit-scrollbar {
              display: none;
            }
            .messages-container {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}
        </style>
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-text-secondary text-lg">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.senderId === currentUser.id;
            const senderDetails = isOwnMessage
              ? currentUser
              : getParticipantDetails(message.senderId);

            return (
              <MessageBubble
                key={message.id}
                message={message}
                isOwnMessage={isOwnMessage}
                sender={senderDetails}
              />
            );
          })
        )}
      </ScrollToBottom>
      <div className="p-3 bg-background border-t border-border shadow-md sticky bottom-0 z-10">
        <ChatInput onSendMessage={onSendMessage} conversationId={conversation.id} />
      </div>
    </motion.div>
  );
};

export default ChatWindow;