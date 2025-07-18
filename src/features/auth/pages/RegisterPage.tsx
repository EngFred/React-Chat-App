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

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerUserHook, isSubmitting: isAuthSubmitting } = useAuth();
  const { currentUser } = useAuthStore();

  const {
    register, // Function to register form inputs
    handleSubmit, // Function to wrap the onSubmit handler
    formState: { errors }, // Object containing validation errors
  } = useForm<RegisterFormInputs>({
    resolver: zodResolver(registerSchema), // Integrate Zod for schema-based validation
    mode: 'onSubmit', // Validate on form submission
    reValidateMode: 'onSubmit', // Re-validate on form submission
    shouldUnregister: false, // Keep field values in state even if unmounted
  });

  useEffect(() => {
    if (currentUser) {
      console.log('[RegisterPage] currentUser detected, navigating to /chat.');
      navigate('/chat');
    }
  }, [currentUser, navigate]); // Dependencies: currentUser (from store) and navigate (from hook)

  const onSubmit: SubmitHandler<RegisterFormInputs> = async (data) => {
    console.log('[RegisterPage] onSubmit: Registration attempt started.');
    try {
      await registerUserHook(data.username, data.email, data.password);
      console.log('[RegisterPage] onSubmit: register function completed. Waiting for currentUser update.');
    } catch (error) {
      // Error toasts are handled within the useAuth hook.
    }
    // No finally block needed here for isSubmitting, as useAuth hook manages it.
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
      {/* ThemeSwitcher is placed here, ensuring its buttons do not trigger form submission */}
      <div className="col-span-full md:col-span-2 mt-6 text-center">
        <ThemeSwitcher />
      </div>
    </AuthForm>
  );
};

export default RegisterPage;