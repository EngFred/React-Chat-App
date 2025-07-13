export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string; // ISO string
  type: 'text' | 'image' | 'video' | 'file';
  imageUrl?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  readBy?: string[] | null; // Array of user IDs who have read the message
}