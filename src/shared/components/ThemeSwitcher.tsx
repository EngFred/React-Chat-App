import React from 'react';
import { motion } from 'framer-motion';
import type { Theme } from '../types/theme';
import { useThemeStore } from '../store/themeStore';

/**
 * Renders a theme switcher that allows users to select from various themes.
 * Updates the current theme in the global state using the `useThemeStore`.
 *
 * @returns {JSX.Element} The rendered theme switcher component.
 */
const ThemeSwitcher: React.FC = () => {
  const { currentTheme, setTheme } = useThemeStore();

  // Define the available themes
  const themes: Theme[] = [
    'crystal-light',
    'midnight-glow',
    'ocean-breeze',
    'sunset-glow',
    'slate-elegance',
  ];

  return (
    <div className="flex flex-col items-center">
      <h3 className="text-sm font-semibold mb-2 text-text-primary">Choose Theme</h3>
      <div className="flex justify-center gap-2 flex-wrap">
        {themes.map((theme) => (
          <motion.button
            key={theme}
            type="button"
            onClick={() => setTheme(theme)}
            aria-label={`Activate ${theme} theme`}
            className={`p-1 rounded-full border-2 ${
              currentTheme === theme ? 'border-primary' : 'border-border'
            } focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {/* Visual representation of the theme */}
            <div className={`w-5 h-5 rounded-full theme-${theme} bg-primary`} />
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default React.memo(ThemeSwitcher);
