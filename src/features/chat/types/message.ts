/**
 * Defines the structure for a message object within the chat feature.
 * Messages can be of various types, including text, image, video, or audio,
 * and include details about sender, receiver, content, and status.
 */
export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  timestamp: string;
  type: 'text' | 'image' | 'video' | 'audio';
  read_by?: string[] | null;
  conversation_id?: string;
  created_at?: string;
  status?: 'sending' | 'sent' | 'failed';
  media_url?: string | null;
  thumbnail_url?: string | null;
  media_type?: 'image' | 'video' | 'audio' | null; // Redundant with 'type' but good for clarity
  dimensions?: { width: number; height: number; } | null;
  duration?: number | null;
}