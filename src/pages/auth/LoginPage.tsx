import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useThemeStore } from '../../store/themeStore';
import type { Theme } from '../../types/theme';
import { useAuthStore } from '../../store/authStore';
import { motion } from 'framer-motion';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentTheme, setTheme } = useThemeStore();
  const { login, currentUser, initializeAuth } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    const unsubscribe = initializeAuth();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [initializeAuth]);

  useEffect(() => {
    console.log('LoginPage useEffect, currentUser:', currentUser);
    if (currentUser) {
      console.log('Navigating to /chat');
      navigate('/chat');
      toast.success('Logged in successfully!');
    }
  }, [currentUser, navigate]);

  const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
    setIsSubmitting(true);
    try {
      await login(data.email, data.password);
    } catch (error) {
      // Error handled by toast in authStore
    } finally {
      setIsSubmitting(false);
    }
  };

  const themes: Theme[] = ['crystal-light', 'midnight-glow', 'ocean-breeze', 'sunset-glow', 'slate-elegance'];

  return (
    <div className="flex items-center justify-center min-h-screen bg-background text-text-primary px-4 sm:px-6 lg:px-8">
      <motion.div
        className="p-6 sm:p-8 rounded-xl shadow-2xl bg-background w-full max-w-md border border-border transition-colors duration-300"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 text-primary">Welcome Back!</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          <motion.button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-primary to-secondary text-[var(--color-button-text)] p-3 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.05, boxShadow: '0 0 8px var(--color-accent)' }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {isSubmitting ? 'Logging In...' : 'Login'}
          </motion.button>
        </form>
        <p className="mt-6 text-center text-text-secondary text-sm sm:text-base">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary hover:underline font-medium">
            Register here
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

export default LoginPage;