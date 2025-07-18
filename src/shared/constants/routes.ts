export const AppRoutes = {
  /**
   * @constant {string} LOGIN - The path for the login page.
   */
  LOGIN: '/',
  /**
   * @constant {string} REGISTER - The path for the registration page.
   */
  REGISTER: '/register',
  /**
   * @constant {string} CHAT - The path for the main chat application page.
   */
  CHAT: '/chat',
  /**
   * @constant {string} SETTINGS - The path for the user settings page.
   */
  SETTINGS: '/settings',
  /**
   * @constant {string} PROFILE - The path for the user profile page.
   */
  PROFILE: '/profile',
  /**
   * @constant {string} CALL - The base path for audio/video call pages.
   * It includes dynamic parameters for call type and user ID.
   * Example usage: `/call/audio/user123` or `/call/video/user456`.
   */
  CALL: '/call/:callType/:userId',
  /**
   * @constant {string} NOT_FOUND - The path for any undefined or not-found routes.
   */
  NOT_FOUND: '*',
};