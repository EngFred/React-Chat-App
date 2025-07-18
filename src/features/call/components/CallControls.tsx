// src/features/call/components/CallControls.tsx
import React from 'react';
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiPhoneOff } from 'react-icons/fi';
import { motion } from 'framer-motion';

interface CallControlsProps {
  isVideoCall: boolean;
  micMuted: boolean;
  videoOff: boolean;
  toggleMic: () => void;
  toggleVideo: () => void;
  endCall: () => void;
}

const CallControls: React.FC<CallControlsProps> = ({
  isVideoCall,
  micMuted,
  videoOff,
  toggleMic,
  toggleVideo,
  endCall,
}) => {
  // --- DRASTICALLY REDUCED SIZING FOR GOOGLE MEET-LIKE AESTHETIC ---
  // Smaller padding for buttons to be compact
  const baseButtonClass = "p-2 rounded-full text-white shadow-md hover:shadow-lg transition-all duration-200 relative group flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/50";
  const primaryActionColor = "bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] focus:ring-[var(--color-accent)]";
  const dangerActionColor = "bg-red-600 hover:bg-red-700 focus:ring-red-500"; // Slightly darker red for impact

  // Significantly smaller icon sizes
  // size-6 = 24px (standard icon size for many minimal UIs)
  // md:size-7 = 28px (slight bump for larger screens)
  // lg:size-8 = 32px (maximum size for clarity on very large displays, still compact)
  const iconSizeClass = "size-6 md:size-7 lg:size-8";

  return (
    <motion.div
      // Positioned at the bottom center of the *page*
      className="absolute bottom-6 md:bottom-8 lg:bottom-10 left-1/2 transform -translate-x-1/2
                 flex justify-center items-center gap-3 md:gap-4 lg:gap-5
                 px-4 py-2 md:px-5 md:py-2.5 lg:px-6 lg:py-3
                 bg-black/60 backdrop-blur-md rounded-full shadow-2xl z-30"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
    >
      {/* Microphone Toggle Button */}
      <motion.button
        onClick={toggleMic}
        className={`${baseButtonClass} ${micMuted ? dangerActionColor : primaryActionColor}`}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        title={micMuted ? 'Unmute Microphone' : 'Mute Microphone'}
      >
        {micMuted ? <FiMicOff className={iconSizeClass} /> : <FiMic className={iconSizeClass} />}
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block text-xs bg-gray-800 text-white px-3 py-1.5 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {micMuted ? 'Unmute' : 'Mute'}
        </span>
      </motion.button>

      {/* Video Toggle Button (only for video calls) */}
      {isVideoCall && (
        <motion.button
          onClick={toggleVideo}
          className={`${baseButtonClass} ${videoOff ? dangerActionColor : primaryActionColor}`}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          title={videoOff ? 'Turn Video On' : 'Turn Video Off'}
        >
          {videoOff ? <FiVideoOff className={iconSizeClass} /> : <FiVideo className={iconSizeClass} />}
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block text-xs bg-gray-800 text-white px-3 py-1.5 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {videoOff ? 'Video On' : 'Video Off'}
          </span>
        </motion.button>
      )}

      {/* End Call Button (always red for clear action) */}
      <motion.button
        onClick={endCall}
        className={`${baseButtonClass} ${dangerActionColor}`}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        title="End Call"
      >
        <FiPhoneOff className={iconSizeClass} />
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block text-xs bg-gray-800 text-white px-3 py-1.5 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          End Call
        </span>
      </motion.button>
    </motion.div>
  );
};

export default CallControls;