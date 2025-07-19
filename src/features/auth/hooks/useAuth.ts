/**
 * useAuth is a custom React hook that provides authentication-related functionalities
 * such as logging in and registering users, managing loading states, and handling UI notifications.
 * It abstracts away the direct interaction with `authService` and provides a clean interface
 * for components to perform authentication operations.
 */
import { useState } from 'react';
import { toast } from 'react-toastify';
import { signInUser, signUpUser } from '../service/authService';

export const useAuth = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Handles the user login process.
   * Sets `isSubmitting` to true during the operation, calls the `signInUser` service,
   * displays success or error toasts based on the outcome, and then resets `isSubmitting`.
   * @param email The user's email.
   * @param password The user's password.
   * @returns A Promise that resolves when the login attempt is complete.
   */
  const login = async (email: string, password: string): Promise<void> => {
    setIsSubmitting(true);
    console.log('[useAuth] login: Attempting login via hook.');
    try {
      await signInUser(email, password);
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

  /**
   * Handles the user registration process.
   * Sets `isSubmitting` to true during the operation, calls the `signUpUser` service,
   * displays success or error toasts, and then resets `isSubmitting`.
   * @param username The desired username.
   * @param email The user's email.
   * @param password The user's password.
   * @returns A Promise that resolves when the registration attempt is complete.
   */
  const register = async (username: string, email: string, password: string): Promise<void> => {
    setIsSubmitting(true);
    console.log('[useAuth] register: Attempting registration via hook.');
    try {
      await signUpUser(username, email, password);
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