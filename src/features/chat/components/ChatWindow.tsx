import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiMessageSquare } from 'react-icons/fi';
import type { Conversation } from '../types/conversation';
import type { Message } from '../types/message';
import type { User } from '../../../shared/types/user';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import ChatInput from './ChatInput';
import MessageBubble from './MessageBubble';
import ChatWindowHeader from './ChatWindowHeader';
import { getMessageSender } from '../utils/chatHelpers';

interface ChatWindowProps {
  conversation: Conversation;
  messages: Message[];
  currentUser: User;
  allUsers: User[];
  otherUser: User;
  onSendMessage: (content: string) => Promise<void>;
  onSendMediaMessage: (file: File, type: 'image' | 'video' | 'audio') => Promise<void>;
  onGoBack: () => void;
  isLoadingMessages: boolean;
  onSetTypingStatus: (isTyping: boolean) => void;
  isSendingMessage: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  messages,
  currentUser,
  allUsers,
  otherUser,
  onSendMessage,
  onSendMediaMessage,
  onGoBack,
  isLoadingMessages,
  onSetTypingStatus,
  isSendingMessage,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoadingMessages) {
      messagesEndRef.current?.scrollIntoView({ block: 'end' });
    }
  }, [messages, isLoadingMessages]);

  // Define motion props based on screen size
  const isMobile = window.innerWidth < 768;
  const motionProps = isMobile
    ? {} // No animations on mobile
    : {
        initial: { x: '100%', opacity: 0 },
        animate: { x: '0%', opacity: 1 },
        exit: { x: '100%', opacity: 0 },
        transition: { duration: 0.3 },
      };

  return (
    <motion.div
      className="flex flex-col h-full bg-background"
      {...motionProps}
    >
      {/* Chat Header */}
      <ChatWindowHeader
        otherUser={otherUser}
        conversation={conversation}
        onGoBack={onGoBack}
      />

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar pb-[2rem] sm:pb-2">
        {isLoadingMessages ? (
          <div className="flex flex-col justify-center items-center h-full">
            <LoadingSpinner size={16} thickness={3} color="text-text-secondary" />
            <p className="ml-4 text-text-secondary mt-2">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-full text-text-secondary text-lg text-center px-4">
            <FiMessageSquare size={60} className="mb-4 opacity-50" />
            <p className="font-semibold text-xl mb-2">No messages yet!</p>
            <p>Say hello to <span className="text-primary font-medium">{otherUser.username}</span> to start your conversation.</p>
          </div>
        ) : (
          messages.map((message) => {
            const sender = getMessageSender(message, currentUser, allUsers);

            if (!sender) return null;

            return (
              <MessageBubble
                key={message.id}
                message={message}
                isOwnMessage={message.sender_id === currentUser.id}
                sender={sender}
              />
            );
          })
        )}
        <div ref={messagesEndRef} className="pb-2" />
      </div>

      {/* Message Input */}
      <div className="fixed bottom-0 left-0 right-0 p-2 border-t border-border bg-background flex-shrink-0 z-20 sm:p-2 sm:static">
        <div className="w-full max-w-3xl mx-auto min-w-[100%] sm:min-w-[200px]">
          <ChatInput
            onSendMessage={onSendMessage}
            onSendMediaMessage={onSendMediaMessage}
            conversationId={conversation.id}
            onSetTypingStatus={onSetTypingStatus}
            isSendingMessage={isSendingMessage}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default ChatWindow;