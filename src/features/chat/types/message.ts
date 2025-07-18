export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string; // For text, or a description like "Image" for media
  timestamp: string;
  type: 'text' | 'image' | 'video' | 'audio'; // Expanded type
  read_by?: string[] | null;
  conversation_id?: string;
  created_at?: string;
  status?: 'sending' | 'sent' | 'failed';

  // New fields for media messages
  media_url?: string | null;
  thumbnail_url?: string | null; // For videos/images if you generate thumbs
  media_type?: 'image' | 'video' | 'audio' | null; // Redundant with 'type' but good for clarity
  dimensions?: { width: number; height: number; } | null; // For images/videos
  duration?: number | null; // For videos/audio in seconds
}