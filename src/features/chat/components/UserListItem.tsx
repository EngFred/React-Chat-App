import React from 'react';
import type { User } from '../../../shared/types/user';
import type { Conversation } from '../types/conversation';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageSquare } from 'react-icons/fi';
import ProfilePicture from '../../../shared/components/ProfilePicture';
import { getLastMessagePreview, getStatusText } from '../utils/chatHelpers';
import { capitalizeFirstLetter } from '../../../shared/utils/helpers';

/**
 * Defines the properties for the UserListItem component.
 */
interface UserListItemProps {
  user: User;
  conversation?: Conversation; // Optional conversation details associated with this user
  isSelected: boolean;      // True if this user's chat is currently selected
  onSelect: (user: User) => void; // Callback when this user is selected
  currentUser: User;        // The currently authenticated user
}

/**
 * UserListItem component displays a single user in the user list,
 * showing their profile picture, username, online status/last seen,
 * and a preview of the last message in their conversation.
 */
const UserListItem: React.FC<UserListItemProps> = ({
  user,
  conversation,
  isSelected,
  onSelect,
  currentUser,
}) => {
  // Get the preview text for the last message in the conversation
  const messagePreview = conversation ? getLastMessagePreview(conversation, currentUser) : 'Start a conversation';
  // Get formatted status text and corresponding CSS class for the user
  const { text: statusText, className: statusClassName } = getStatusText(user, conversation);

  const displayUsername = capitalizeFirstLetter(user.username);

  return (
    <motion.div
      className={`p-4 border-b border-border transition-colors duration-200
        ${isSelected
          ? 'bg-primary/10 border-l-4 border-primary' // Styles for selected item
          : 'hover:bg-input-bg' // Hover style for non-selected items
        }
        ${isSelected ? 'cursor-default' : 'cursor-pointer'}
      `}
      onClick={isSelected ? undefined : () => onSelect(user)} // Disable click if already selected
      whileHover={{ scale: isSelected ? 1 : 1.01, backgroundColor: isSelected ? 'var(--color-primary-rgb-10)' : 'var(--color-input-bg)' }}
      whileTap={isSelected ? {} : { scale: 0.98 }} // No tap animation if selected
      transition={{ duration: 0.1 }}
    >
      <div className="flex items-center">
        <div className="relative flex-shrink-0">
          <ProfilePicture
            src={user.profile_picture}
            alt={user.username}
            size={10}
            className="mr-4"
          />
          {/* Online indicator */}
          {user.is_online && (
            <span className="absolute bottom-0.5 right-3 w-3 h-3 bg-green-500 rounded-full border-2 border-background" title="Online"></span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-md font-semibold text-text-primary truncate mr-2">{displayUsername}</h3>
            <AnimatePresence mode="wait">
              {/* Animated status text (online, last seen, typing etc.) */}
              <motion.span
                key={statusText}
                className={`text-xs font-medium ${statusClassName} flex-shrink-0`}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                transition={{ duration: 0.2 }}
              >
                {statusText}
              </motion.span>
            </AnimatePresence>
          </div>
          <div className="flex items-center justify-between text-sm text-text-secondary">
            {/* Last message preview */}
            <p className="truncate max-w-[calc(100%-40px)]">
              {messagePreview}
            </p>
            {/* Unread message count or default message icon */}
            {conversation?.unread_count && conversation.unread_count > 0 ? (
              <motion.span
                key="unread-count"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-accent text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 ml-2"
              >
                {conversation.unread_count}
              </motion.span>
            ) : (
              // Show a message icon if there's no last message content or timestamp
              !conversation?.last_message_content && !conversation?.last_message_timestamp && (
                <FiMessageSquare className="text-text-secondary flex-shrink-0 ml-2 opacity-60" size={16} />
              )
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default UserListItem;