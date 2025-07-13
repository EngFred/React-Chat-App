import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import type { Theme } from '../types/theme';
import { FiArrowLeft, FiUser, FiSun, FiLogOut, FiEdit3 } from 'react-icons/fi';
import { motion } from 'framer-motion';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentTheme, setTheme } = useThemeStore();
  const logout = useAuthStore((state) => state.logout);

  const themes: Theme[] = ['crystal-light', 'midnight-glow', 'ocean-breeze', 'sunset-glow', 'slate-elegance'];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      // Error handled by toast in authStore
    }
  };

  return (
    <motion.div
      className="h-full bg-background text-text-primary flex flex-col font-inter"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <header className="flex items-center p-4 sm:p-6 bg-background border-b border-border shadow-sm sticky top-0 z-10">
        <motion.button
          onClick={() => navigate('/chat')}
          className="p-2 rounded-full hover:bg-input-bg text-text-secondary transition-colors duration-200 mr-3 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          title="Back to chat"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <FiArrowLeft size={24} className="text-primary" />
        </motion.button>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-primary flex-1 text-center pr-12">Settings</h1>
      </header>
      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto flex justify-center items-start">
        <motion.div
          className="w-full max-w-3xl space-y-8 mt-4 lg:mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, staggerChildren: 0.1 }}
        >
          <motion.div
            className="bg-background rounded-3xl shadow-xl p-6 sm:p-8 border border-border transition-all duration-300 hover:shadow-2xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-primary flex items-center">
              <FiUser className="mr-3 text-accent" size={28} /> Profile Management
            </h2>
            <p className="text-text-secondary mb-6 text-sm sm:text-base leading-relaxed">
              Update your personal information, profile picture, and account details.
            </p>
            <motion.button
              onClick={() => navigate('/profile')}
              className="w-full flex items-center justify-center bg-gradient-to-r from-primary to-secondary text-[var(--color-button-text)] py-3 px-6 rounded-xl font-semibold text-base sm:text-lg hover:shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
              whileHover={{ scale: 1.05, boxShadow: '0 0 8px var(--color-accent)' }}
              whileTap={{ scale: 0.95 }}
            >
              <FiEdit3 className="mr-2" size={20} /> Edit Profile
            </motion.button>
          </motion.div>
          <motion.div
            className="bg-background rounded-3xl shadow-xl p-6 sm:p-8 border border-border transition-all duration-300 hover:shadow-2xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-primary flex items-center">
              <FiSun className="mr-3 text-accent" size={28} /> Application Theme
            </h2>
            <p className="text-text-secondary mb-6 text-sm sm:text-base leading-relaxed">
              Personalize your chat experience by choosing a vibrant theme.
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              {themes.map((theme) => (
                <motion.button
                  key={theme}
                  onClick={() => setTheme(theme)}
                  className={`relative p-2 rounded-full border-4 ${currentTheme === theme ? 'border-primary shadow-lg scale-110' : 'border-border'} focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all duration-300`}
                  title={`Set ${theme} theme`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <div className={`w-8 h-8 rounded-full theme-${theme} bg-primary`} />
                  {currentTheme === theme && (
                    <span className="absolute -top-2 -right-2 bg-accent text-white text-xs font-bold px-2 py-0.5 rounded-full animate-bounce-once">
                      Active
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
          <motion.div
            className="bg-background rounded-3xl shadow-xl p-6 sm:p-8 border border-border transition-all duration-300 hover:shadow-2xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-primary flex items-center">
              <FiLogOut className="mr-3 text-accent" size={28} /> Account Actions
            </h2>
            <p className="text-text-secondary mb-6 text-sm sm:text-base leading-relaxed">
              Securely sign out from your account or manage advanced settings.
            </p>
            <motion.button
              onClick={handleLogout}
              className="w-full flex items-center justify-center bg-red-600 text-white py-3 px-6 rounded-xl font-semibold text-base sm:text-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-background transition-all duration-300 shadow-md hover:shadow-lg"
              whileHover={{ scale: 1.05, boxShadow: '0 0 8px rgba(220, 38, 38, 0.5)' }}
              whileTap={{ scale: 0.95 }}
            >
              <FiLogOut className="mr-2" size={20} /> Logout
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SettingsPage;