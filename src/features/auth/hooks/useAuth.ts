import { useState } from 'react';
import { toast } from 'react-toastify';

import { signInUser, signUpUser } from '../service/authService';
import { useAuthStore } from '../../../shared/store/authStore';

export const useAuth = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  // The Firebase Auth listener in authStore will handle state sync.
  const { } = useAuthStore(); // No longer destructuring fetchAndSyncUserSession

  const login = async (email: string, password: string): Promise<void> => {
    setIsSubmitting(true);
    console.log('[useAuth] login: Attempting login via hook.');
    try {
      await signInUser(email, password);
      // The onAuthStateChanged listener in authStore will fire automatically.
      console.log('[useAuth] login: Firebase sign-in successful. Auth listener will handle global state sync.');
      toast.success('Login successful!');
    } catch (error: any) {
      console.error('[useAuth] login: Login failed:', error);
      const firebaseErrorMessages: { [key: string]: string } = {
        'auth/invalid-email': 'Invalid email address format.',
        'auth/user-disabled': 'This account has been disabled.',
        'auth/user-not-found': 'No user found with this email.',
        'auth/invalid-credential': 'Incorrect email or password.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/too-many-requests': 'Too many failed login attempts. Please try again later.',
      };
      toast.error(firebaseErrorMessages[error.code] || error.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
      console.log('[useAuth] login: isSubmitting set to false.');
    }
  };

  const register = async (username: string, email: string, password: string): Promise<void> => {
    setIsSubmitting(true);
    console.log('[useAuth] register: Attempting registration via hook.');
    try {
      await signUpUser(username, email, password);
      // The onAuthStateChanged listener in authStore will fire automatically.
      console.log('[useAuth] register: Sign-up request successful. Auth listener will handle global state sync.');
      toast.success('Registration successful!');
    } catch (error: any) {
      console.error('[useAuth] register: Registration failed:', error);
      const firebaseErrorMessages: { [key: string]: string } = {
        'auth/email-already-in-use': 'This email is already registered.',
        'auth/weak-password': 'Password should be at least 6 characters.',
        'auth/invalid-email': 'Invalid email address format.',
      };
      toast.error(firebaseErrorMessages[error.code] || error.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
      console.log('[useAuth] register: isSubmitting set to false.');
    }
  };

  return { login, register, isSubmitting };
};