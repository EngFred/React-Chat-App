/**
 * AppRoutes provides a centralized collection of all application route paths.
 * Using constants for routes helps prevent typos and improves maintainability.
 */
export const AppRoutes = {
  LOGIN: '/',
  REGISTER: '/register',
  CHAT: '/chat',
  SETTINGS: '/settings',
  PROFILE: '/profile',
  CALL: '/call/:callType/:userId',
  NOT_FOUND: '*',
};