import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import updateLocale from 'dayjs/plugin/updateLocale'; // Import updateLocale for custom relative time
import type { Conversation } from '../types/conversation';
import type { Message } from '../types/message';
import type { User } from '../../../shared/types/user';

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.extend(updateLocale); // Extend with updateLocale

// Customize relative time thresholds for better chat experience
dayjs.updateLocale('en', {
  relativeTime: {
    future: 'in %s',
    past: '%s ago',
    s: 'just now',
    m: '1m',
    mm: '%dm',
    h: '1h',
    hh: '%dh',
    d: '1d',
    dd: '%dd',
    M: '1M',
    MM: '%dM',
    y: '1y',
    yy: '%dy',
  },
});

/**
 * Generates a preview string for the last message in a conversation.
 * Handles different message types (text, image, video, audio).
 * @param conversation The conversation object.
 * @param currentUser The current authenticated user.
 * @returns A formatted string preview of the last message.
 */
export const getLastMessagePreview = (conversation: Conversation, currentUser: User): string => {
  if (!conversation.last_message_content) {
    return 'Start a conversation';
  }

  const { last_message_content, last_message_sender_id, last_message_type } = conversation;
  const senderPrefix = last_message_sender_id === currentUser.id ? 'You: ' : '';
  let contentPreview = last_message_content;

  // Enhance content preview based on message type
  switch (last_message_type) {
    case 'image':
      contentPreview = `📸 Image`;
      break;
    case 'video':
      contentPreview = `📹 Video`;
      break;
    case 'audio':
      contentPreview = `🎵 Audio`;
      break;
    case 'text':
    default:
      // Truncate text content if too long
      if (contentPreview.length > 30) {
        contentPreview = contentPreview.substring(0, 27) + '...';
      }
      break;
  }

  return `${senderPrefix}${contentPreview}`;
};

/**
 * Determines the status text and styling for a user in the list.
 * @param user The user object.
 * @param conversation The associated conversation (optional, for typing status).
 * @returns An object containing the status text and its Tailwind CSS class name.
 */
export const getStatusText = (user: User, conversation: Conversation | undefined): { text: string; className: string } => {
  const isTyping = conversation?.typing_users?.includes(user.id) || false;
  if (isTyping) {
    return { text: 'typing...', className: 'text-green-400' }; // Changed to green-400 for consistency with previous useChat
  }
  if (user.is_online) {
    return { text: 'Online', className: 'text-green-500' };
  }
  if (user.last_seen) {
    return { text: dayjs(user.last_seen).fromNow(), className: 'text-text-secondary' }; // Removed text-opacity-70
  }
  return { text: 'Offline', className: 'text-text-secondary' }; // Removed text-opacity-70
};

/**
 * Finds the sender of a given message.
 * @param message The message object.
 * @param currentUser The current authenticated user.
 * @param allUsers An array of all available users.
 * @returns The User object of the sender, or undefined if not found.
 */
export const getMessageSender = (message: Message, currentUser: User, allUsers: User[]): User | undefined => {
  // Ensure allUsers is an array before attempting to find
  if (!Array.isArray(allUsers)) {
      console.error("getMessageSender: allUsers is not an array.", allUsers);
      return undefined;
  }
  return message.sender_id === currentUser.id ? currentUser : allUsers.find(u => u.id === message.sender_id);
};

/**
 * Capitalizes the first letter of a string.
 * @param str The input string.
 * @returns The string with the first letter capitalized.
 */
export const capitalizeFirstLetter = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Helper to determine media type (image, video, audio) from a File object.
 * @param file The File object to check.
 * @returns 'image', 'video', 'audio', or null if type is not recognized.
 */
export const getMediaTypeFromFile = (file: File): 'image' | 'video' | 'audio' | null => {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  return null;
};