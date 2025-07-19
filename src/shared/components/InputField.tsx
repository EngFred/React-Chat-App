import React from 'react';
import { motion } from 'framer-motion';
import type { FieldError, RegisterOptions, UseFormRegister } from 'react-hook-form';

/**
 * Defines the properties for the InputField component.
 */
interface InputFieldProps {
  id: string;
  label: string;
  type: 'text' | 'email';
  placeholder: string;
  register: UseFormRegister<any>;
  name: string;
  error?: FieldError;
  registerOptions?: RegisterOptions;
  className?: string;
  labelClassName?: string;
  disabled?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * InputField is a reusable presentational component for text and email input fields.
 * It provides consistent styling, integrates with `react-hook-form` for form management,
 * and displays validation errors. It also supports controlled component behavior via `value` and `onChange` props.
 */
const InputField: React.FC<InputFieldProps> = React.memo(
  ({
    id,
    label,
    type,
    placeholder,
    register,
    name,
    error,
    registerOptions,
    className,
    labelClassName,
    disabled,
    value,
    onChange,
  }) => {
    // Determine if the input should behave as a controlled component based on props.
    const isControlledByProps = value !== undefined || onChange !== undefined;

    return (
      <div>
        <label htmlFor={id} className={`block text-sm font-medium text-text-secondary mb-1 ${labelClassName || ''}`}>
          {label}
        </label>
        <motion.input
          id={id}
          type={type}
          placeholder={placeholder}
          {...register(name, registerOptions)}
          className={`w-full p-3 rounded-lg border border-border bg-input-bg text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200 ${className || ''}`}
          whileFocus={{ scale: 1.02 }}
          disabled={disabled}
          {...(isControlledByProps ? { value, onChange } : {})}
        />
        {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
      </div>
    );
  }
);

export default InputField;