import React from 'react';
import { motion } from 'framer-motion';

/**
 * @interface ButtonProps
 * @description Defines the props for the Button component.
 * @property {React.ReactNode} children - The content to be rendered inside the button (e.g., text, icons).
 * @property {() => void | Promise<void>} [onClick] - Callback function to be executed when the button is clicked. Can be synchronous or asynchronous.
 * @property {'button' | 'submit' | 'reset'} [type='button'] - The native HTML button type.
 * @property {'primary' | 'secondary' | 'danger'} [variant='primary'] - Defines the visual style of the button.
 * @property {boolean} [disabled=false] - If true, the button will be disabled and unclickable.
 * @property {string} [className=''] - Additional Tailwind CSS classes to apply to the button.
 * @property {string} [title] - A tooltip text that appears on hover.
 * @property {boolean} [isLoading=false] - If true, displays a loading spinner and `loadingText` instead of `children`.
 * @property {string} [loadingText='Loading...'] - The text to display when `isLoading` is true.
 */
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void | Promise<void>;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  className?: string;
  title?: string;
  isLoading?: boolean;
  loadingText?: string;
}

/**
 * @function Button
 * @description A highly customizable and animated button component.
 * It supports different visual variants, loading states, and integrates Framer Motion
 * for subtle hover and tap animations.
 *
 * @param {ButtonProps} props - The props for the component.
 * @returns {React.FC<ButtonProps>} A React functional component.
 */
const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  className = '',
  title,
  isLoading = false,
  loadingText = 'Loading...',
}) => {
  // Base styles applied to all button variants for consistent padding, rounding, etc.
  const baseStyles = 'w-full p-3 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background transition-all duration-200 flex items-center justify-center';

  // Styles specific to each button variant.
  const variantStyles = {
    primary: 'bg-gradient-to-r from-primary to-secondary text-[var(--color-button-text)] focus:ring-primary',
    secondary: 'bg-input-bg text-text-primary hover:bg-gray-300 focus:ring-primary',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600',
  };

  // Determine if the button should be disabled (either explicitly disabled or in a loading state).
  const isDisabled = disabled || isLoading;

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      // Combine base, variant, and conditional disabled styles with any extra classes.
      className={`${baseStyles} ${variantStyles[variant]} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      title={title}
      // Framer Motion animations for hover and tap states.
      // Scale and boxShadow are only applied if the button is not disabled.
      whileHover={{ scale: isDisabled ? 1 : 1.05, boxShadow: isDisabled ? '' : '0 0 8px var(--color-accent)' }}
      whileTap={{ scale: isDisabled ? 1 : 0.95 }}
    >
      {isLoading ? (
        // Render loading spinner and text if isLoading is true.
        <>
          <svg
            className="animate-spin h-5 w-5 text-white mr-2"
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
        // Render children content when not loading.
        children
      )}
    </motion.button>
  );
};

export default Button;