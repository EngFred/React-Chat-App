export const getDefaultAvatar = (username: string): string =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random&color=fff&size=128`;

/**
 * Capitalizes the first letter of a string if it's not already capitalized.
 * Returns the original string if it's empty or already capitalized.
 * @param str The input string (e.g., a username).
 * @returns The string with its first letter capitalized.
 */
export const capitalizeFirstLetter = (str: string): string => {
  if (!str) return '';
  if (str.length === 0) return str; // Handle empty string
  const firstChar = str.charAt(0);
  if (firstChar >= 'A' && firstChar <= 'Z') {
    return str; // Already capitalized
  }
  return firstChar.toUpperCase() + str.slice(1);
};