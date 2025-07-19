import type { Message } from './message';

/**
 * Defines the structure for a conversation object within the chat feature.
 * A conversation can be either private between two users or a group chat.
 */
export interface Conversation {
  id: string;
  type: 'private' | 'group';
  participants: string[];
  last_message_content?: string | null;
  last_message_timestamp?: string | null;
  last_message_sender_id?: string | null;
  last_message?: Message | null;
  unread_count?: number; // Client-side derived property for the current user's unread count
  unread_counts?: { [userId: string]: number }; // Stores unread counts for each participant
  typing_users?: string[];
  created_at?: string;
  last_message_type?: 'text' | 'image' | 'video' | 'audio' | null;
}