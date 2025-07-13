import { create } from 'zustand';
import type { Theme } from '../types/theme';

interface ThemeState {
  currentTheme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  currentTheme: (localStorage.getItem('app-theme') as Theme) || 'light', // Load from localStorage or default to light
  setTheme: (theme) => {
    set({ currentTheme: theme });
    localStorage.setItem('app-theme', theme); // Persist theme to localStorage
  },
}));