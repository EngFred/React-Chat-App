import React from 'react';
import { motion } from 'framer-motion';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void | Promise<void>;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  className?: string;
  title?: string;
  // NEW PROP: To indicate a loading state for the button itself
  isLoading?: boolean;
  // Optional: Text to display during loading
  loadingText?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  className = '',
  title,
  isLoading = false, // Default to false
  loadingText = 'Loading...', // Default loading text
}) => {
  const baseStyles = 'w-full p-3 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background transition-all duration-200 flex items-center justify-center'; // Added flex items-center justify-center
  const variantStyles = {
    primary: 'bg-gradient-to-r from-primary to-secondary text-[var(--color-button-text)] focus:ring-primary',
    secondary: 'bg-input-bg text-text-primary hover:bg-gray-300 focus:ring-primary',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600',
  };

  // Determine the effective disabled state
  const isDisabled = disabled || isLoading;

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={isDisabled} // Use the effective disabled state
      className={`${baseStyles} ${variantStyles[variant]} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      title={title}
      whileHover={{ scale: isDisabled ? 1 : 1.05, boxShadow: isDisabled ? '' : '0 0 8px var(--color-accent)' }}
      whileTap={{ scale: isDisabled ? 1 : 0.95 }}
    >
      {isLoading ? (
        // Render spinner and loading text when isLoading is true
        <>
          <svg
            className="animate-spin h-5 w-5 text-white mr-2" // Added mr-2 for spacing
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          {loadingText}
        </>
      ) : (
        // Render children (normal button text/content) when not loading
        children
      )}
    </motion.button>
  );
};

export default Button;