import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiEye, FiEyeOff } from 'react-icons/fi'; // Icons for toggling password visibility
import type { FieldError, RegisterOptions, UseFormRegister } from 'react-hook-form';

/**
 * Props for the PasswordInput component.
 * @interface PasswordInputProps
 * @property {string} id - The unique ID for the input element and its label.
 * @property {string} label - The text label for the password input field.
 * @property {string} placeholder - The placeholder text for the password input field.
 * @property {UseFormRegister<any>} register - The register function from `react-hook-form` to register the input.
 * @property {string} name - The name of the password input field, used for form data and validation.
 * @property {FieldError} [error] - Optional error object from `react-hook-form` for displaying validation messages.
 * @property {RegisterOptions} [registerOptions] - Optional registration options for `react-hook-form` (e.g., validation rules).
 */
interface PasswordInputProps {
  id: string;
  label: string;
  placeholder: string;
  register: UseFormRegister<any>;
  name: string;
  error?: FieldError;
  registerOptions?: RegisterOptions;
}

/**
 * PasswordInput component is a reusable input field specifically for passwords.
 * It includes a toggle button to show/hide the password, integrates with `react-hook-form`,
 * and uses `framer-motion` for subtle animations.
 *
 * @param {PasswordInputProps} props - The props for the PasswordInput component.
 * @returns {JSX.Element} The rendered password input field with visibility toggle and error message.
 */
const PasswordInput: React.FC<PasswordInputProps> = React.memo(
  ({
    id,
    label,
    placeholder,
    register,
    name,
    error,
    registerOptions,
  }) => {
    // State to control the visibility of the password
    const [showPassword, setShowPassword] = useState(false);

    /**
     * Toggles the `showPassword` state, changing the input type between 'password' and 'text'.
     */
    const togglePasswordVisibility = () => {
      setShowPassword((prev) => !prev);
    };

    return (
      <div>
        <label htmlFor={id} className="block text-sm font-medium text-text-secondary mb-1">
          {label}
        </label>
        <div className="relative">
          <motion.input
            id={id}
            type={showPassword ? 'text' : 'password'} // Dynamically set input type
            placeholder={placeholder}
            {...register(name, registerOptions)} // Registers the input with react-hook-form
            className="w-full p-3 rounded-lg border border-border bg-input-bg text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200 pr-10" // Added pr-10 for icon space
            whileFocus={{ scale: 1.02 }} // Animation on focus
          />
          {/* Button to toggle password visibility */}
          <motion.button
            type="button" // Explicitly set type to "button" to prevent form submission
            onClick={togglePasswordVisibility}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-primary transition-colors duration-200 p-1"
            whileHover={{ opacity: 0.8 }}
            whileTap={{ opacity: 0.6 }}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />} {/* Icon changes based on visibility */}
          </motion.button>
        </div>
        {/* Displays error message if validation fails */}
        {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
      </div>
    );
  }
);

export default PasswordInput;
