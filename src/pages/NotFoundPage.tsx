import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFoundPage: React.FC = () => {
  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen bg-background text-text-primary"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h1
        className="text-5xl sm:text-6xl font-bold text-primary mb-4"
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
      >
        404
      </motion.h1>
      <motion.p
        className="text-lg sm:text-xl text-text-secondary mb-8"
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        Page Not Found
      </motion.p>
      <motion.div
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Link
          to="/"
          className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 rounded-lg font-semibold text-base sm:text-lg hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
        >
          Go to Login Page
        </Link>
      </motion.div>
    </motion.div>
  );
};

export default NotFoundPage;