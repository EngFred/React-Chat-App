import React from 'react';
import { motion } from 'framer-motion';
import type { FieldError, RegisterOptions, UseFormRegister } from 'react-hook-form';

/**
 * Props for the InputField component.
 * @interface InputFieldProps
 * @property {string} id - The unique ID for the input element and its label.
 * @property {string} label - The text label for the input field.
 * @property {'text' | 'email'} type - The HTML type attribute for the input (e.g., 'text', 'email').
 * @property {string} placeholder - The placeholder text for the input field.
 * @property {UseFormRegister<any>} register - The register function from `react-hook-form` to register the input.
 * @property {string} name - The name of the input field, used for form data and validation.
 * @property {FieldError} [error] - Optional error object from `react-hook-form` for displaying validation messages.
 * @property {RegisterOptions} [registerOptions] - Optional registration options for `react-hook-form` (e.g., validation rules).
 * @property {string} [className] - Optional CSS class names to apply to the input element.
 * @property {string} [labelClassName] - Optional CSS class names to apply to the label element.
 * @property {boolean} [disabled] - NEW: Optional prop to disable the input field.
 * @property {string} [value] - NEW: Optional prop to control the input's value programmatically (for suggestions).
 * @property {(e: React.ChangeEvent<HTMLInputElement>) => void} [onChange] - NEW: Optional onChange handler for manual control.
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
  disabled?: boolean; // NEW PROP
  value?: string; // NEW PROP
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void; // NEW PROP
}

/**
 * InputField component is a reusable presentational component for text and email inputs.
 * It integrates with `react-hook-form` for easy registration and error display,
 * and uses `framer-motion` for subtle focus animations.
 *
 * @param {InputFieldProps} props - The props for the InputField component.
 * @returns {JSX.Element} The rendered input field with label and error message.
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
    disabled, // Destructure the new prop
    value,    // Destructure the new prop
    onChange, // Destructure the new prop
  }) => {
    // If a `value` prop is provided, we should use it to control the input.
    // However, `react-hook-form`'s `register` function also wants to control the input.
    // To avoid conflicts, we'll conditionally apply `value` and `onChange` from props
    // if they are provided, overriding react-hook-form's default behavior for controlled inputs.
    // For react-hook-form to still track the field's state, we must still spread `register`.
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
          {...register(name, registerOptions)} // Registers the input with react-hook-form
          className={`w-full p-3 rounded-lg border border-border bg-input-bg text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200 ${className || ''}`}
          whileFocus={{ scale: 1.02 }}
          // Apply new props
          disabled={disabled} // Use the disabled prop
          // Conditionally apply value and onChange for programmatic control
          {...(isControlledByProps ? { value, onChange } : {})}
        />
        {/* Displays error message if validation fails */}
        {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
      </div>
    );
  }
);

export default InputField;