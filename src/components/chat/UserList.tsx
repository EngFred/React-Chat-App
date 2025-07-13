import React, { useState } from 'react';
import type { User } from '../../types/user';
import type { Conversation } from '../../types/conversation';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageSquare } from 'react-icons/fi';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface UserListProps {
  conversations: Conversation[];
  onSelectConversation: (user: User) => void;
  selectedConversationId: string | null;
  currentUser: User;
  allUsers: User[];
}

const UserList: React.FC<UserListProps> = ({ conversations, onSelectConversation, selectedConversationId, currentUser, allUsers }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = allUsers.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getLastMessagePreview = (conversation: Conversation) => {
    if (!conversation.lastMessage) return 'No messages yet';
    const { content, type, fileName, senderId } = conversation.lastMessage;
    const isOwnMessage = senderId === currentUser.id;
    const prefix = isOwnMessage ? 'You: ' : '';
    let preview = '';
    if (type === 'image') preview = `Image: ${fileName || 'Photo'}`;
    else if (type === 'video') preview = `Video: ${fileName || 'Video'}`;
    else if (type === 'file') preview = `File: ${fileName || 'Document'}`;
    else preview = content.length > 30 ? `${content.substring(0, 30)}...` : content;
    return `${prefix}${preview}`;
  };

  const getStatusText = (user: User, conversation: Conversation | undefined) => {
    const isTyping = conversation?.typingUsers?.includes(user.id) || false;
    if (isTyping) {
      return { text: 'Typing...', className: 'text-blue-500' };
    }
    if (user.isOnline) {
      return { text: 'Online', className: 'text-green-500' };
    }
    if (user.lastSeen) {
      return { text: `Last seen ${dayjs(user.lastSeen).fromNow()}`, className: 'text-gray-500' };
    }
    return { text: 'Offline', className: 'text-gray-500' };
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-2 rounded-lg bg-input-bg text-text-primary border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredUsers.length === 0 ? (
          <div className="p-4 text-text-secondary text-center">
            {searchQuery ? 'No users found.' : 'No users available.'}
          </div>
        ) : (
          filteredUsers.map((user) => {
            const conversation = conversations.find(conv =>
              conv.participants.includes(user.id) && conv.participants.includes(currentUser.id)
            );
            const isSelected = selectedConversationId === conversation?.id;
            const { text, className } = getStatusText(user, conversation);
            return (
              <motion.div
                key={user.id}
                className={`p-4 border-b border-border transition-colors duration-200 ${
                  isSelected
                    ? 'bg-primary/10 border-l-4 border-primary cursor-default'
                    : 'hover:bg-input-bg cursor-pointer'
                }`}
                onClick={isSelected ? undefined : () => onSelectConversation(user)}
                whileHover={{ backgroundColor: isSelected ? 'var(--color-primary/10)' : 'var(--color-input-bg)' }}
                whileTap={isSelected ? {} : { scale: 0.98 }}
              >
                <div className="flex items-center">
                  <div className="relative flex-shrink-0">
                    <img
                      src={user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || 'U')}&background=random&color=fff&size=128`}
                      alt={user.username}
                      className="w-10 h-10 rounded-full object-cover mr-3"
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || 'U')}&background=random&color=fff&size=128`;
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-md font-semibold text-text-primary truncate">{user.username}</h3>
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={text}
                          className={`text-xs font-medium ${className} flex-shrink-0`}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.2 }}
                        >
                          {text}
                        </motion.span>
                      </AnimatePresence>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-text-secondary truncate max-w-[200px]">
                        {conversation ? getLastMessagePreview(conversation) : 'Start a conversation'}
                      </p>
                      {conversation?.unreadCount && conversation.unreadCount > 0 ? (
                        <span className="bg-accent text-white text-xs rounded-full px-2 py-1 flex-shrink-0">
                          {conversation.unreadCount}
                        </span>
                      ) : (
                        <FiMessageSquare className="text-text-secondary flex-shrink-0" size={16} />
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default UserList;