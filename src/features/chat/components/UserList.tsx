import React, { useState, useMemo } from 'react';
import type { User } from '../../../shared/types/user';
import type { Conversation } from '../types/conversation';
import UserListItem from './UserListItem';

/**
 * Defines the properties for the UserList component.
 */
interface UserListProps {
  conversations: Conversation[];
  onSelectConversation: (user: User) => void;
  selectedConversationId: string | null;
  currentUser: User;
  allUsers: User[];
}

/**
 * UserList component displays a searchable and sortable list of users,
 * integrating their latest conversation details. Users are sorted by
 * recent activity (if they have messages), then online status, then username.
 */
const UserList: React.FC<UserListProps> = ({
  conversations,
  onSelectConversation,
  selectedConversationId,
  currentUser,
  allUsers,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * Memoized computation for filtering and sorting the user list.
   * Users are filtered by search query and then sorted based on:
   * 1. Latest message timestamp (conversations with recent activity first).
   * 2. Online status (online users before offline users).
   * 3. Alphabetical order by username.
   */
  const filteredAndSortedUsers = useMemo(() => {
    // Pair each user with their corresponding private conversation (if any)
    const usersWithConversations = allUsers.map(user => {
      const conversation = conversations.find(conv =>
        conv.type === 'private' &&
        conv.participants.includes(user.id) &&
        conv.participants.includes(currentUser.id)
      );
      return { user, conversation };
    });

    // Filter users based on the search query
    const filtered = usersWithConversations.filter(({ user }) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort the filtered users
    filtered.sort((a, b) => {
      const timeA = a.conversation?.last_message_timestamp ? new Date(a.conversation.last_message_timestamp).getTime() : 0;
      const timeB = b.conversation?.last_message_timestamp ? new Date(b.conversation.last_message_timestamp).getTime() : 0;

      const hasMessagesA = !!a.conversation?.last_message_content;
      const hasMessagesB = !!b.conversation?.last_message_content;

      // Prioritize conversations with actual messages by last message timestamp
      if (hasMessagesA && hasMessagesB) {
        return timeB - timeA; // Most recent first
      }
      if (hasMessagesA && !hasMessagesB) return -1; // A has messages, B does not
      if (!hasMessagesA && hasMessagesB) return 1;  // B has messages, A does not

      // If neither has messages, prioritize by online status
      if (a.user.is_online && !b.user.is_online) return -1; // A is online, B is not
      if (!a.user.is_online && b.user.is_online) return 1;  // B is online, A is not

      // Fallback to alphabetical order by username
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
              conversation={conversation} // Pass the found conversation or null
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