/**
 * Defines the structure for a User object used across the application.
 */
export interface User {
  id: string;
  username: string;
  email: string;
  profile_picture?: string | null;
  is_online: boolean;
  last_seen?: string | null;
  created_at: string;
}