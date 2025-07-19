import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import updateLocale from 'dayjs/plugin/updateLocale';
import type { Conversation } from '../types/conversation';
import type { Message } from '../types/message';
import type { User } from '../../../shared/types/user';

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.extend(updateLocale);

// Customizing dayjs relative time thresholds for a more concise chat experience
dayjs.updateLocale('en', {
  relativeTime: {
    future: 'in %s',
    past: '%s ago',
    s: 'just now', // Seconds will show as "just now"
    m: '1m',       // 1 minute
    mm: '%dm',     // e.g., 5m for 5 minutes
    h: '1h',       // 1 hour
    hh: '%dh',     // e.g., 3h for 3 hours
    d: '1d',       // 1 day
    dd: '%dd',     // e.g., 2d for 2 days
    M: '1M',       // 1 month
    MM: '%dM',     // e.g., 2M for 2 months
    y: '1y',       // 1 year
    yy: '%dy',     // e.g., 2y for 2 years
  },
});

/**
 * Generates a preview string for the last message in a conversation.
 * It provides a short, readable summary, indicating the sender and message type.
 *
 * @param conversation The conversation object containing last message details.
 * @param currentUser The current authenticated user, used to determine if the message was sent by 'You'.
 * @returns A formatted string preview of the last message (e.g., "You: 📸 Image", "John: Hello there...").
 */
export const getLastMessagePreview = (conversation: Conversation, currentUser: User): string => {
  // If there's no last message content, suggest starting a conversation.
  if (!conversation.last_message_content) {
    return 'Start a conversation';
  }

  const { last_message_content, last_message_sender_id, last_message_type } = conversation;
  // Prefix "You: " if the current user was the sender of the last message.
  const senderPrefix = last_message_sender_id === currentUser.id ? 'You: ' : '';
  let contentPreview = last_message_content;

  // Enhance content preview based on message type for better readability in the list.
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
      // Truncate long text messages to keep the preview concise.
      if (contentPreview.length > 30) {
        contentPreview = contentPreview.substring(0, 27) + '...';
      }
      break;
  }

  return `${senderPrefix}${contentPreview}`;
};

/**
 * Determines the status text and associated Tailwind CSS styling for a user displayed in a list.
 * This can show "Online", "typing...", or "Last seen X [time ago]".
 *
 * @param user The `User` object for whom to determine the status.
 * @param conversation The `Conversation` object associated with the user, used to check for typing status. Optional.
 * @returns An object containing `text` (the status string) and `className` (Tailwind CSS class for styling).
 */
export const getStatusText = (user: User, conversation: Conversation | undefined): { text: string; className: string } => {
  // Check if the user is currently typing in the given conversation.
  const isTyping = conversation?.typing_users?.includes(user.id) || false;

  if (isTyping) {
    return { text: 'typing...', className: 'text-green-400' };
  }
  if (user.is_online) {
    return { text: 'Online', className: 'text-green-500' };
  }
  if (user.last_seen) {
    // Format last seen time using dayjs relative time plugin (e.g., "2m ago", "1h ago").
    return { text: dayjs(user.last_seen).fromNow(), className: 'text-text-secondary' };
  }
  // Default to 'Offline' if no other status applies.
  return { text: 'Offline', className: 'text-text-secondary' };
};

/**
 * Finds the `User` object representing the sender of a given message.
 * It efficiently checks if the current user is the sender, otherwise searches
 * through all available users.
 *
 * @param message The `Message` object for which to find the sender.
 * @param currentUser The currently authenticated `User` object.
 * @param allUsers An array of all available `User` objects in the application.
 * @returns The `User` object of the sender, or `undefined` if the sender cannot be found (e.g., `allUsers` is not an array or sender ID does not match any user).
 */
export const getMessageSender = (message: Message, currentUser: User, allUsers: User[]): User | undefined => {
  // Basic validation to ensure `allUsers` is an array.
  if (!Array.isArray(allUsers)) {
      console.error("getMessageSender: allUsers is not an array.", allUsers);
      return undefined;
  }
  // If the message's sender ID matches the current user's ID, the current user is the sender.
  return message.sender_id === currentUser.id ? currentUser : allUsers.find(u => u.id === message.sender_id);
};

/**
 * Capitalizes the first letter of a given string.
 * This is a utility for presentation purposes, like usernames.
 *
 * @param str The input string (e.g., "john").
 * @returns The string with its first letter capitalized (e.g., "John"), or an empty string if the input is falsy.
 */
export const capitalizeFirstLetter = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Helper function to determine the media type ('image', 'video', 'audio') of a `File` object
 * based on its MIME type.
 *
 * @param file The `File` object (e.g., obtained from an HTML input element).
 * @returns 'image', 'video', 'audio', or `null` if the file type is not recognized as one of these media types.
 */
export const getMediaTypeFromFile = (file: File): 'image' | 'video' | 'audio' | null => {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  return null;
};