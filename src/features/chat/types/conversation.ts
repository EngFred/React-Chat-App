import type { Message } from './message';

export interface Conversation {
  id: string;
  type: 'private' | 'group';
  participants: string[];
  // Denormalized fields for Firestore efficiency and real-time list updates
  last_message_content?: string | null; // Will now store "Image", "Video", "Audio" for media
  last_message_timestamp?: string | null;
  last_message_sender_id?: string | null;
  last_message?: Message | null;
  unread_count?: number;
  unread_counts?: { [userId: string]: number };
  typing_users?: string[];
  created_at?: string;
  last_message_type?: 'text' | 'image' | 'video' | 'audio' | null; // New: Type of the last message
}