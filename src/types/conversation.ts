import type { Message } from "./message";

export interface Conversation {
  id: string;
  type: 'private';
  participants: string[];
  lastMessage?: Message | null;
  unreadCount?: number;
  typingUsers?: string[];
}