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

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  // Access login function and isSubmitting state from the custom useAuth hook
  const { login, isSubmitting: isAuthSubmitting } = useAuth();
  // Access currentUser from the global authentication store for redirection logic
  const { currentUser } = useAuthStore();

  // Initialize react-hook-form with Zod resolver for validation
  const {
    register, // Function to register form inputs
    handleSubmit, // Function to wrap the onSubmit handler
    formState: { errors }, // Object containing validation errors
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema), // Integrate Zod for schema-based validation
    mode: 'onSubmit', // Validate on form submission
    reValidateMode: 'onSubmit', // Re-validate on form submission
    shouldUnregister: false, // Keep field values in state even if unmounted
  });

  useEffect(() => {
    if (currentUser) {
      console.log('[LoginPage] currentUser detected, navigating to /chat.');
      navigate('/chat');
    }
  }, [currentUser, navigate]);

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
      {/* ThemeSwitcher is placed here, ensuring its buttons do not trigger form submission */}
      <div className="mt-6 text-center">
        <ThemeSwitcher />
      </div>
    </AuthForm>
  );
};

export default LoginPage;