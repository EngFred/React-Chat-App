import React from 'react';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import InputField from '../../../shared/components/InputField';
import type { User } from '../../../shared/types/user';

/**
 * @interface ProfileFormInputs
 * @description Defines the expected structure of form inputs for the profile.
 * @property {string} username - The username field.
 */
interface ProfileFormInputs {
  username: string;
}

/**
 * @interface ProfileFormProps
 * @description Defines the props for the ProfileFormFields component.
 * @property {UseFormRegister<ProfileFormInputs>} register - The register function from `react-hook-form` to register input fields.
 * @property {FieldErrors<ProfileFormInputs>} errors - An object containing validation errors from `react-hook-form`.
 * @property {User | null} currentUser - The current authenticated user object, used to display the email.
 * @property {boolean} isUpdatingUsername - A boolean indicating if the username update operation is in progress.
 */
interface ProfileFormProps {
  register: UseFormRegister<ProfileFormInputs>;
  errors: FieldErrors<ProfileFormInputs>;
  currentUser: User | null;
  isUpdatingUsername: boolean;
}

/**
 * @function ProfileFormFields
 * @description A sub-component for the Profile page that renders the input fields
 * for editing user profile information, specifically username and email.
 * It integrates with `react-hook-form` for form management and validation.
 *
 * @param {ProfileFormProps} props - The props for the component.
 * @returns {React.FC<ProfileFormProps>} A React functional component.
 */
const ProfileFormFields: React.FC<ProfileFormProps> = ({
  register,
  errors,
  currentUser,
  isUpdatingUsername,
}) => {
  return (
    <>
      {/* Username Input Field */}
      <InputField
        id="username"
        label="Username"
        type="text"
        placeholder="Your username"
        register={register}
        name="username"
        error={errors.username}
        className="rounded-lg border-2 border-gray-700 focus:border-primary-light bg-gray-800 text-white placeholder-gray-500"
        labelClassName="text-text-secondary text-sm font-semibold mb-2"
        disabled={isUpdatingUsername} // Disable input while username is being updated
      />
      {/* Email Input Field (disabled as email is typically not editable from here) */}
      <InputField
        id="email"
        label="Email"
        type="email"
        placeholder={currentUser?.email || ''} 
        register={register}
        name="email"
        error={undefined} 
        registerOptions={{ disabled: true }} 
        className="rounded-lg border-2 border-gray-700 bg-gray-800 text-gray-400 placeholder-gray-500 cursor-not-allowed"
        labelClassName="text-text-secondary text-sm font-semibold mb-2"
      />
    </>
  );
};

export default ProfileFormFields;