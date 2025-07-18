import React from 'react';
import { motion } from 'framer-motion';
import { FiPhone, FiVideo } from 'react-icons/fi';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';

interface CallLoaderProps {
  callType: string; // 'audio' or 'video'
  message?: string; // Optional custom message
}

const CallLoader: React.FC<CallLoaderProps> = ({ callType, message }) => {
  // Determine the icon based on the call type
  const icon = callType === 'video' ? <FiVideo size={30} /> : <FiPhone size={30} />;
  const defaultMessage = `Connecting to ${callType} call...`;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white text-lg font-sans">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-4 p-8 bg-gray-800/70 rounded-xl shadow-2xl backdrop-blur-sm"
      >
        {/* Animated Loading Spinner */}
        <LoadingSpinner size={24} thickness={4} color="text-primary" /> {/* Using text-primary for theme */}

        {/* Call Type Icon and Message */}
        <div className="flex items-center gap-3 text-primary"> {/* Using text-primary for theme */}
          {icon}
          <p className="text-xl font-semibold">{message || defaultMessage}</p>
        </div>
        <p className="text-sm text-gray-400 text-center">Please wait while we establish the connection.</p>
      </motion.div>
    </div>
  );
};

export default CallLoader;