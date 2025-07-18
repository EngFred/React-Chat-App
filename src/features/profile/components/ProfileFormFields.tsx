import React from 'react';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import InputField from '../../../shared/components/InputField';
import type { User } from '../../../shared/types/user';

interface ProfileFormInputs {
  username: string;
}

interface ProfileFormProps {
  register: UseFormRegister<ProfileFormInputs>;
  errors: FieldErrors<ProfileFormInputs>;
  currentUser: User | null; // Used for email placeholder
  isUpdatingUsername: boolean;
}

const ProfileFormFields: React.FC<ProfileFormProps> = ({
  register,
  errors,
  currentUser,
  isUpdatingUsername,
}) => {
  return (
    <>
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
        disabled={isUpdatingUsername} // Disable while updating username
      />
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