import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowLeft, FiMoreVertical, FiVideo, FiPhone } from 'react-icons/fi';
import { toast } from 'react-toastify';
import ProfilePicture from '../../../shared/components/ProfilePicture';
import type { User } from '../../../shared/types/user';
import type { Conversation } from '../types/conversation';
import dayjs from 'dayjs';
import { capitalizeFirstLetter } from '../../../shared/utils/helpers';

/**
 * Defines the properties for the ChatWindowHeader component.
 */
interface ChatWindowHeaderProps {
  otherUser: User;
  conversation: Conversation;
  onGoBack: () => void;
}

/**
 * ChatWindowHeader component displays the header for the chat window,
 * including the other user's profile picture, username, online status/last seen,
 * typing indicator, and call/more options buttons.
 */
const ChatWindowHeader: React.FC<ChatWindowHeaderProps> = ({
  otherUser,
  conversation,
  onGoBack,
}) => {
  // Check if the other user is currently typing in this conversation
  const isOtherUserTyping = conversation.typing_users?.includes(otherUser.id);

  /**
   * Handles click events for call buttons, showing a toast notification
   * for features not yet implemented.
   */
  const handleCallClick = () => {
    toast.info('This feature is not implemented yet.', {
      position: 'bottom-right',
      autoClose: 3000,
    });
  };

  const displayUsername = capitalizeFirstLetter(otherUser.username);

  return (
    <div className="flex items-center justify-between p-4 bg-background border-b border-border shadow-sm flex-shrink-0 z-10">
      {/* Back button for mobile view */}
      <motion.button
        onClick={onGoBack}
        className="lg:hidden p-2 rounded-full hover:bg-input-bg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary"
        title="Back to conversations"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <FiArrowLeft size={24} className="text-text-primary" />
      </motion.button>
      <div className="flex items-center flex-grow ml-3 lg:ml-0">
        <ProfilePicture src={otherUser.profile_picture} alt={otherUser.username} size={10} className="mr-3" />
        <div>
          <h2 className="text-lg font-semibold text-text-primary">{displayUsername}</h2>
          <AnimatePresence mode="wait">
            {/* Display typing indicator or online status/last seen */}
            {isOtherUserTyping ? (
              <motion.p
                key="typing"
                className="text-sm text-primary font-medium"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
              >
                Typing...
              </motion.p>
            ) : (
              <motion.p
                key="status"
                className="text-xs text-text-secondary"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
              >
                {otherUser.is_online ? 'Online' : `Last seen ${dayjs(otherUser.last_seen).fromNow()}`}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
      {/* Call Buttons and More Options */}
      <div className="flex items-center space-x-2">
        <motion.button
          onClick={handleCallClick}
          className="p-2 rounded-full hover:bg-input-bg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary"
          title="Video call"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <FiVideo size={20} className="text-primary" />
        </motion.button>
        <motion.button
          onClick={handleCallClick}
          className="p-2 rounded-full hover:bg-input-bg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary"
          title="Audio call"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <FiPhone size={20} className="text-primary" />
        </motion.button>
        <motion.button
          className="p-2 rounded-full hover:bg-input-bg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary"
          title="More options"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <FiMoreVertical size={20} className="text-text-secondary" />
        </motion.button>
      </div>
    </div>
  );
};

export default ChatWindowHeader;