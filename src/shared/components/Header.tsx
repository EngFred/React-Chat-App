import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { motion } from 'framer-motion';

/**
 * @interface HeaderProps
 * @description Props for the Header component.
 * @property {string} title - The main title text displayed in the header.
 * @property {string} [backRoute] - The path to navigate to when the back button is clicked. Required if `showBackButton` is true.
 * @property {boolean} [showBackButton=true] - Determines whether the back button is displayed. Defaults to true.
 * @property {React.ReactNode} [extraButtons] - Optional React nodes to render on the right side of the header (e.g., action buttons).
 */
interface HeaderProps {
  title: string;
  backRoute?: string;
  showBackButton?: boolean;
  extraButtons?: React.ReactNode;
}

/**
 * @function Header
 * @description Reusable header component for application pages. It can display a title,
 * an optional back button for navigation, and a slot for additional buttons/elements.
 * @param {HeaderProps} props - The props for the Header component.
 * @returns {JSX.Element} The rendered header component.
 */
const Header: React.FC<HeaderProps> = ({ title, backRoute, showBackButton = true, extraButtons }) => {
  const navigate = useNavigate();

  return (
    <header className="flex items-center p-3 sm:p-4 bg-background border-b border-border shadow-sm sticky top-0 z-10">
      {showBackButton && backRoute && (
        <motion.button
          onClick={() => navigate(backRoute)}
          className="p-2 rounded-full hover:bg-input-bg text-text-secondary transition-colors duration-200 mr-3"
          title="Back"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <FiArrowLeft size={24} className="text-primary" />
        </motion.button>
      )}
      <h1 className="text-xl sm:text-2xl font-bold text-primary flex-1">{title}</h1>
      {extraButtons}
    </header>
  );
};

export default Header;