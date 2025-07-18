import React from 'react';
import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: number; // Tailwind's size unit (e.g., 6 for w-6 h-6, default 8)
  color?: string; // Tailwind color class (e.g., 'text-primary', 'text-blue-500', default 'text-primary')
  thickness?: number; // Border thickness (e.g., 2, 4, default 4)
  className?: string; // Additional classes for the container div
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 8, // Default to w-8 h-8
  color = 'text-primary', // Default to your theme's primary color
  thickness = 4, // Default border thickness
  className = '', // Allow external classes for wrapper
}) => {
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className={spinnerClasses}>
        <span className="sr-only">Loading...</span> {/* Screen reader only text */}
      </div>
    </motion.div>
  );
};

export default LoadingSpinner;