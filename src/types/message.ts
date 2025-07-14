import type { Call } from './call';

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  type: 'text' | 'image' | 'video' | 'file' | 'call';
  imageUrl?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  readBy?: string[] | null;
  callData?: Call | null;
  conversationId?: string;
}