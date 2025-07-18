import { create } from 'zustand';
import type { Theme } from '../types/theme';

/**
 * Interface defining the shape of the theme state.
 * @interface ThemeState
 * @property {Theme} currentTheme - The currently active theme.
 * @property {(theme: Theme) => void} setTheme - Function to update the current theme.
 */
interface ThemeState {
  currentTheme: Theme;
  setTheme: (theme: Theme) => void;
}

/**
 * Zustand store for managing the application's theme.
 * It persists the selected theme to `localStorage`.
 *
 * @returns {ThemeState} The theme state and actions.
 */
export const useThemeStore = create<ThemeState>((set) => ({
  // Initialize currentTheme from localStorage, or default to 'light' if not found
  currentTheme: (localStorage.getItem('app-theme') as Theme) || 'light',
  /**
   * Sets the new theme and persists it to localStorage.
   * @param {Theme} theme - The theme to set.
   */
  setTheme: (theme) => {
    set({ currentTheme: theme }); // Update the state
    localStorage.setItem('app-theme', theme); // Persist theme to localStorage
  },
}));
