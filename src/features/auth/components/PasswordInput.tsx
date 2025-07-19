import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import type { FieldError, RegisterOptions, UseFormRegister } from 'react-hook-form';

/**
 * Defines the properties for the PasswordInput component.
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
 * PasswordInput component provides a styled input field specifically for passwords.
 * It includes a toggle button to show or hide the password text, enhancing user experience.
 * It integrates with `react-hook-form` for registration and displays validation errors.
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
    const [showPassword, setShowPassword] = useState(false);

    /**
     * Toggles the visibility of the password input field between 'text' and 'password' types.
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
            type={showPassword ? 'text' : 'password'}
            placeholder={placeholder}
            {...register(name, registerOptions)}
            className="w-full p-3 rounded-lg border border-border bg-input-bg text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200 pr-10"
            whileFocus={{ scale: 1.02 }}
          />
          <motion.button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-primary transition-colors duration-200 p-1"
            whileHover={{ opacity: 0.8 }}
            whileTap={{ opacity: 0.6 }}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
          </motion.button>
        </div>
        {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
      </div>
    );
  }
);

export default PasswordInput;