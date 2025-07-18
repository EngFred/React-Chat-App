import React from 'react';
import { motion } from 'framer-motion';
import { FiPhone, FiVideo } from 'react-icons/fi';
import LoadingSpinner from '../../../shared/components/LoadingSpinner'; // Assuming this is correct

interface CallInitiatorLoaderProps {
  callType: string; // 'audio' or 'video'
  message?: string; // Optional custom message
}

const CallInitiatorLoader: React.FC<CallInitiatorLoaderProps> = ({ callType, message }) => {
  const icon = callType === 'video' ? <FiVideo size={48} /> : <FiPhone size={48} />; // Even larger icons
  const defaultMessage = `Connecting to ${callType} call...`;

  return (
    <div className="flex items-center justify-center min-h-screen w-screen bg-gradient-to-br from-gray-950 to-gray-800 text-white font-sans">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }} // Starts smaller for a more pronounced scale-in
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }} // Slower, smoother animation
        className="flex flex-col items-center gap-8 p-10 md:p-12 bg-gray-800/80 rounded-2xl shadow-3xl backdrop-blur-md text-center max-w-sm mx-auto"
      >
        {/* Animated Loading Spinner */}
        <LoadingSpinner size={40} thickness={4} color="text-[var(--color-primary)]" /> {/* Larger, themed spinner */}

        {/* Call Type Icon and Message */}
        <div className="flex flex-col items-center gap-4 text-[var(--color-primary)]">
          {icon}
          <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
            {message || defaultMessage}
          </h2>
        </div>
        <p className="text-md text-gray-400 px-4">
          Please wait while we establish your secure, high-quality connection.
        </p>
      </motion.div>
    </div>
  );
};

export default CallInitiatorLoader;