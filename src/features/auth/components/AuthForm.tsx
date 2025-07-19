import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Button from '../../../shared/components/Button';

/**
 * Defines the properties for the AuthForm component.
 */
interface AuthFormProps {
  title: string;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
  submitText: string;
  footerText: string;
  footerLinkText: string;
  footerLinkTo: string;
  children: React.ReactNode;
  isRegister?: boolean;
}

/**
 * AuthForm is a reusable presentational component for authentication forms (login and registration).
 * It provides a consistent layout, styling, and basic form structure, including a title,
 * form fields (passed as children), a submit button with loading state, and a footer link
 * for navigation between login and registration.
 */
const AuthForm: React.FC<AuthFormProps> = React.memo(
  ({ title, onSubmit, isSubmitting, submitText, footerText, footerLinkText, footerLinkTo, children, isRegister }) => {
    return (
      <div className="flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
        <motion.div
          className={`relative p-6 sm:p-8 rounded-2xl shadow-xl bg-gradient-to-br from-background to-input-bg w-full
            ${isRegister ? 'max-w-md md:max-w-3xl' : 'max-w-sm'}
            transition-colors duration-300 auth-form-scroll max-h-[85vh] overflow-y-auto`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <h2 className="text-lg sm:text-xl font-bold text-center mb-6 text-primary">
            {title}
          </h2>
          <form
            key="auth-form"
            onSubmit={onSubmit}
            className={`grid grid-cols-1 gap-4 ${isRegister ? 'md:grid-cols-2' : ''}`}
          >
            {children}

            <div className={`col-span-1 ${isRegister ? 'md:col-span-2' : ''}`}>
              <Button
                type="submit"
                disabled={isSubmitting}
                variant="primary"
                className="w-full mt-2"
                title={isSubmitting ? `${submitText}ing...` : submitText}
                isLoading={isSubmitting}
                loadingText={`${submitText}ing...`}
              >
                {submitText}
              </Button>
            </div>

            <div className={`col-span-1 text-center ${isRegister ? 'md:col-span-2' : ''}`}>
              <p className="text-text-secondary text-sm mt-2">
                {footerText}{' '}
                <Link
                  to={footerLinkTo}
                  className="text-primary hover:underline font-medium transition-colors duration-200"
                  title={footerLinkText}
                >
                  {footerLinkText}
                </Link>
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    );
  }
);

export default AuthForm;