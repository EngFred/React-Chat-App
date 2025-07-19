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
 * Defines the validation schema for the login form using Zod.
 * Ensures email is a valid format and password is at least 6 characters long.
 */
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

/**
 * LoginPage component provides the user interface for logging into the application.
 * It uses react-hook-form for form management and Zod for validation.
 * Upon successful login, it navigates the user to the chat page.
 */
const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isSubmitting: isAuthSubmitting } = useAuth();
  const { currentUser } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    shouldUnregister: false,
  });

  /**
   * Redirects the user to the chat page if they are already authenticated.
   * This prevents logged-in users from accessing the login page.
   */
  useEffect(() => {
    if (currentUser) {
      console.log('[LoginPage] currentUser detected, navigating to /chat.');
      navigate('/chat');
    }
  }, [currentUser, navigate]);

  /**
   * Handles the form submission for user login.
   * Calls the `login` function from the `useAuth` hook. Error handling and toasts
   * are managed within the `useAuth` hook.
   * @param data The form data containing email and password.
   */
  const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
    console.log('[LoginPage] onSubmit: Login attempt started.');
    try {
      await login(data.email, data.password);
      console.log('[LoginPage] onSubmit: Login function completed. Waiting for global auth state update.');
    } catch (error) {
      // Error toasts are handled within the useAuth hook, so no specific action here.
    }
  };

  return (
    <AuthForm
      title="Welcome Back!"
      onSubmit={handleSubmit(onSubmit)}
      isSubmitting={isAuthSubmitting}
      submitText="Login"
      footerText="Don't have an account?"
      footerLinkText="Register here"
      footerLinkTo="/register"
    >
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
      <div className="mt-6 text-center">
        <ThemeSwitcher />
      </div>
    </AuthForm>
  );
};

export default LoginPage;