export interface User {
  id: string;
  username: string;
  email: string;
  profilePicture: string | null;
  isOnline: boolean;
  lastSeen?: string | null;
  createdAt: string;
}