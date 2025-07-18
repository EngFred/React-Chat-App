import React from 'react';
import type { User } from '../../../shared/types/user';
import type { Conversation } from '../types/conversation';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageSquare } from 'react-icons/fi';
import ProfilePicture from '../../../shared/components/ProfilePicture';
import { getLastMessagePreview, getStatusText } from '../utils/chatHelpers';
import { capitalizeFirstLetter } from '../../../shared/utils/helpers';

interface UserListItemProps {
  user: User;
  conversation?: Conversation;
  isSelected: boolean;
  onSelect: (user: User) => void;
  currentUser: User;
}

const UserListItem: React.FC<UserListItemProps> = ({
  user,
  conversation,
  isSelected,
  onSelect,
  currentUser,
}) => {
  const messagePreview = conversation ? getLastMessagePreview(conversation, currentUser) : 'Start a conversation';
  const { text: statusText, className: statusClassName } = getStatusText(user, conversation);

  // Apply capitalization
  const displayUsername = capitalizeFirstLetter(user.username);

  return (
    <motion.div
      className={`p-4 border-b border-border transition-colors duration-200
        ${isSelected
          ? 'bg-primary/10 border-l-4 border-primary'
          : 'hover:bg-input-bg'
        }
        ${isSelected ? 'cursor-default' : 'cursor-pointer'}
      `}
      onClick={isSelected ? undefined : () => onSelect(user)}
      whileHover={{ scale: isSelected ? 1 : 1.01, backgroundColor: isSelected ? 'var(--color-primary-rgb-10)' : 'var(--color-input-bg)' }}
      whileTap={isSelected ? {} : { scale: 0.98 }}
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
          {user.is_online && (
            <span className="absolute bottom-0.5 right-3 w-3 h-3 bg-green-500 rounded-full border-2 border-background" title="Online"></span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-md font-semibold text-text-primary truncate mr-2">{displayUsername}</h3> {/* Use displayUsername */}
            <AnimatePresence mode="wait">
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
            <p className="truncate max-w-[calc(100%-40px)]">
              {messagePreview}
            </p>
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