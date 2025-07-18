import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiEdit3 } from 'react-icons/fi';
import { motion } from 'framer-motion';
import Header from '../../../shared/components/Header';
import Button from '../../../shared/components/Button';
import ThemeSwitcher from '../../../shared/components/ThemeSwitcher';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();

  // Define motion props based on screen size
  const isMobile = window.innerWidth < 768;
  const containerMotionProps = isMobile
    ? {} // No animations on mobile
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.5 },
      };
  const sectionMotionProps = isMobile
    ? {} // No animations on mobile
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3 },
      };
  const contentMotionProps = isMobile
    ? {} // No animations on mobile
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, staggerChildren: 0.1 },
      };

  return (
    <motion.div
      className="h-full bg-background text-text-primary flex flex-col font-inter"
      {...containerMotionProps}
    >
      {/* Header component for page title and back navigation */}
      <Header title="Settings" backRoute="/chat" />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto flex justify-center items-start">
        <motion.div
          className="w-full max-w-3xl space-y-8 mt-4 lg:mt-8"
          {...contentMotionProps}
        >
          {/* Profile Management Section */}
          <motion.div
            className="bg-background rounded-3xl shadow-xl p-6 sm:p-8 border border-border transition-all duration-300 hover:shadow-2xl"
            {...sectionMotionProps}
          >
            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-primary flex items-center">
              <FiUser className="mr-3 text-accent" size={28} /> Profile Management
            </h2>
            <p className="text-text-secondary mb-6 text-sm sm:text-base leading-relaxed">
              Update your personal information, profile picture, and account details.
            </p>
            <Button
              onClick={() => navigate('/profile')} // Navigate to the profile editing page
              className="flex items-center justify-center"
            >
              <FiEdit3 className="mr-2" size={20} /> Edit Profile
            </Button>
          </motion.div>

          {/* Theme Switcher Section */}
          <motion.div
            className="bg-background rounded-3xl shadow-xl p-6 sm:p-8 border border-border transition-all duration-300 hover:shadow-2xl"
            {...sectionMotionProps}
          >
            <ThemeSwitcher /> {/* Integrates the ThemeSwitcher component */}
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SettingsPage;