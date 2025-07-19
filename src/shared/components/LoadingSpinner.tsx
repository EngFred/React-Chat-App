import React from 'react';
import { motion } from 'framer-motion';

/**
 * @interface LoadingSpinnerProps
 * @description Defines the props for the LoadingSpinner component.
 * @property {number} [size=8] - The size of the spinner (corresponds to Tailwind's `h-` and `w-` classes, e.g., 8 means h-8 w-8).
 * @property {string} [color='text-primary'] - The Tailwind CSS class for the spinner's color (e.g., 'text-blue-500').
 * @property {number} [thickness=4] - The thickness of the spinner's border (corresponds to Tailwind's `border-` class, e.g., 4 means border-4).
 * @property {string} [className=''] - Additional Tailwind CSS classes to apply to the spinner's container.
 */
interface LoadingSpinnerProps {
  size?: number;
  color?: string;
  thickness?: number;
  className?: string;
}

/**
 * @function LoadingSpinner
 * @description A customizable and animated loading spinner component.
 * It uses Tailwind CSS for styling and Framer Motion for a simple entrance animation.
 * The spinner is accessible with `role`, `aria-live`, and `sr-only` text.
 *
 * @param {LoadingSpinnerProps} props - The props for the component.
 * @returns {React.FC<LoadingSpinnerProps>} A React functional component.
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 8,
  color = 'text-primary',
  thickness = 4,
  className = '',
}) => {
  // Dynamically create Tailwind CSS classes based on props.
  const spinnerClasses = `
    inline-block
    h-${size} w-${size}
    border-${thickness} border-solid
    rounded-full
    border-t-transparent
    animate-spin
    ${color}
    shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.3)]
  `;

  return (
    <motion.div
      className={`flex items-center justify-center ${className}`}
      initial={{ opacity: 0 }} // Start with opacity 0 for fade-in animation
      animate={{ opacity: 1 }} // Animate to opacity 1
      transition={{ duration: 0.2 }} // Quick fade-in transition
      role="status" // Indicates that this element is a live region advisory for assistive technologies
      aria-live="polite" // Announces updates politely without interrupting current tasks
      aria-label="Loading" // Provides a concise label for the element
    >
      <div className={spinnerClasses}>
        <span className="sr-only">Loading...</span> {/* Screen reader only text for accessibility */}
      </div>
    </motion.div>
  );
};

export default LoadingSpinner;