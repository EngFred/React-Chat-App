import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import type { Theme } from '../../types/theme';
import { useThemeStore } from '../../store/themeStore';
import { motion } from 'framer-motion';

const themes: Theme[] = ['crystal-light', 'midnight-glow', 'ocean-breeze', 'sunset-glow', 'slate-elegance'];

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormInputs = z.infer<typeof registerSchema>;

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const registerUser = useAuthStore((state) => state.registerUser);
  const { currentTheme, setTheme } = useThemeStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormInputs>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit: SubmitHandler<RegisterFormInputs> = async (data) => {
    setIsSubmitting(true);
    try {
      await registerUser(data.username, data.email, data.password);
      navigate('/');
    } catch (error) {
      // Error handled by toast in authStore
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background text-text-primary px-4 sm:px-6 lg:px-8">
      <motion.div
        className="p-6 sm:p-8 rounded-xl shadow-2xl bg-background w-full max-w-md border border-border transition-colors duration-300"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 text-primary">Create Your Account</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-text-secondary mb-1">
              Username
            </label>
            <motion.input
              type="text"
              id="username"
              {...register('username')}
              className="w-full p-3 rounded-lg border border-border bg-input-bg text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200"
              placeholder="Choose a username"
              whileFocus={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            />
            {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>}
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1">
              Email
            </label>
            <motion.input
              type="email"
              id="email"
              {...register('email')}
              className="w-full p-3 rounded-lg border border-border bg-input-bg text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200"
              placeholder="your.email@example.com"
              whileFocus={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-1">
              Password
            </label>
            <motion.input
              type="password"
              id="password"
              {...register('password')}
              className="w-full p-3 rounded-lg border border-border bg-input-bg text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200"
              placeholder="••••••••"
              whileFocus={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-secondary mb-1">
              Confirm Password
            </label>
            <motion.input
              type="password"
              id="confirmPassword"
              {...register('confirmPassword')}
              className="w-full p-3 rounded-lg border border-border bg-input-bg text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200"
              placeholder="••••••••"
              whileFocus={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            />
            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>}
          </div>
          <motion.button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-primary to-secondary text-[var(--color-button-text)] p-3 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.05, boxShadow: '0 0 8px var(--color-accent)' }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {isSubmitting ? 'Registering...' : 'Register'}
          </motion.button>
        </form>
        <p className="mt-6 text-center text-text-secondary text-sm sm:text-base">
          Already have an account?{' '}
          <Link to="/" className="text-primary hover:underline font-medium">
            Login here
          </Link>
        </p>
        <div className="mt-8 text-center">
          <h3 className="text-lg font-semibold mb-3 text-text-primary">Choose Theme</h3>
          <div className="flex justify-center gap-3 flex-wrap">
            {themes.map((theme) => (
              <motion.button
                key={theme}
                onClick={() => setTheme(theme)}
                className={`p-2 rounded-full border-2 ${currentTheme === theme ? 'border-primary' : 'border-border'} focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200`}
                title={`Set ${theme} theme`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <div className={`w-6 h-6 rounded-full theme-${theme} bg-primary`} />
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;