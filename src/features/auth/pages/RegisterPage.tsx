import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAuthStore } from '../../../shared/store/authStore';
import AuthForm from '../components/AuthForm';
import InputField from '../../../shared/components/InputField';
import PasswordInput from '../components/PasswordInput';
import ThemeSwitcher from '../../../shared/components/ThemeSwitcher';

/**
 * Defines the validation schema for the registration form using Zod.
 * Ensures username, email, password, and confirmPassword meet specific criteria,
 * and that password and confirmPassword match.
 */
const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterFormInputs = z.infer<typeof registerSchema>;

/**
 * RegisterPage component provides the user interface for creating a new account.
 * It uses react-hook-form for form management and Zod for validation, including password confirmation.
 * Upon successful registration, it navigates the user to the chat page.
 */
const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerUserHook, isSubmitting: isAuthSubmitting } = useAuth();
  const { currentUser } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormInputs>({
    resolver: zodResolver(registerSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    shouldUnregister: false,
  });

  /**
   * Redirects the user to the chat page if they are already authenticated.
   * This prevents logged-in users from accessing the registration page.
   */
  useEffect(() => {
    if (currentUser) {
      console.log('[RegisterPage] currentUser detected, navigating to /chat.');
      navigate('/chat');
    }
  }, [currentUser, navigate]);

  /**
   * Handles the form submission for user registration.
   * Calls the `register` function from the `useAuth` hook. Error handling and toasts
   * are managed within the `useAuth` hook.
   * @param data The form data containing username, email, password, and confirmPassword.
   */
  const onSubmit: SubmitHandler<RegisterFormInputs> = async (data) => {
    console.log('[RegisterPage] onSubmit: Registration attempt started.');
    try {
      await registerUserHook(data.username, data.email, data.password);
      console.log('[RegisterPage] onSubmit: register function completed. Waiting for currentUser update.');
    } catch (error) {
      // Error toasts are handled within the useAuth hook.
    }
  };

  return (
    <AuthForm
      title="Create Your Account"
      onSubmit={handleSubmit(onSubmit)}
      isSubmitting={isAuthSubmitting}
      submitText="Register"
      footerText="Already have an account?"
      footerLinkText="Login here"
      footerLinkTo="/"
      isRegister={true}
    >
      <InputField
        id="username"
        label="Username"
        type="text"
        placeholder="Choose a username"
        register={register}
        name="username"
        error={errors.username}
      />
      <InputField
        id="email"
        label="Email"
        type="email"
        placeholder="your.email@example.com"
        register={register}
        name="email"
        error={errors.email}
      />
      <PasswordInput
        id="password"
        label="Password"
        placeholder="••••••••"
        register={register}
        name="password"
        error={errors.password}
      />
      <PasswordInput
        id="confirmPassword"
        label="Confirm Password"
        placeholder="••••••••"
        register={register}
        name="confirmPassword"
        error={errors.confirmPassword}
      />
      <div className="col-span-full md:col-span-2 mt-6 text-center">
        <ThemeSwitcher />
      </div>
    </AuthForm>
  );
};

export default RegisterPage;