import React, { useState, useMemo } from 'react';
import type { User } from '../../../shared/types/user';
import type { Conversation } from '../types/conversation';
import UserListItem from './UserListItem';

interface UserListProps {
  conversations: Conversation[];
  onSelectConversation: (user: User) => void;
  selectedConversationId: string | null;
  currentUser: User;
  allUsers: User[];
}

const UserList: React.FC<UserListProps> = ({
  conversations,
  onSelectConversation,
  selectedConversationId,
  currentUser,
  allUsers,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAndSortedUsers = useMemo(() => {
    const usersWithConversations = allUsers.map(user => {
      // Find private conversation between current user and this 'other' user
      const conversation = conversations.find(conv =>
        conv.type === 'private' &&
        conv.participants.includes(user.id) &&
        conv.participants.includes(currentUser.id)
      );
      return { user, conversation };
    });

    const filtered = usersWithConversations.filter(({ user }) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    filtered.sort((a, b) => {
      const timeA = a.conversation?.last_message_timestamp ? new Date(a.conversation.last_message_timestamp).getTime() : 0;
      const timeB = b.conversation?.last_message_timestamp ? new Date(b.conversation.last_message_timestamp).getTime() : 0;

      const hasMessagesA = !!a.conversation?.last_message_content;
      const hasMessagesB = !!b.conversation?.last_message_content;

      if (hasMessagesA && hasMessagesB) {
        return timeB - timeA;
      }
      if (hasMessagesA && !hasMessagesB) return -1;
      if (!hasMessagesA && hasMessagesB) return 1;

      if (a.user.is_online && !b.user.is_online) return -1;
      if (!a.user.is_online && b.user.is_online) return 1;

      return a.user.username.localeCompare(b.user.username);
    });
    return filtered;
  }, [allUsers, conversations, currentUser.id, searchQuery]);


  return (
    <div className="flex flex-col h-full">
      {/* Search Input */}
      <div className="p-4 border-b border-border bg-background z-10">
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-2.5 rounded-xl bg-input-bg text-text-primary border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm placeholder-text-secondary"
        />
      </div>

      {/* User/Conversation List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredAndSortedUsers.length === 0 ? (
          <div className="p-4 text-text-secondary text-center">
            {searchQuery ? 'No users found matching your search.' : 'No users available.'}
          </div>
        ) : (
          filteredAndSortedUsers.map(({ user, conversation }) => (
            <UserListItem
              key={user.id}
              user={user}
              conversation={conversation}
              isSelected={selectedConversationId === conversation?.id}
              onSelect={onSelectConversation}
              currentUser={currentUser}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default UserList;