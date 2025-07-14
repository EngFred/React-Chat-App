import React from 'react';
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiPhoneOff } from 'react-icons/fi';
import { motion } from 'framer-motion';

interface CallControlsProps {
  callType: 'video' | 'audio';
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  muteAudio: () => void;
  unmuteAudio: () => void;
  muteVideo: () => void;
  unmuteVideo: () => void;
  endCall: () => void;
}

const CallControls: React.FC<CallControlsProps> = ({
  callType,
  isAudioMuted,
  isVideoMuted,
  muteAudio,
  unmuteAudio,
  muteVideo,
  unmuteVideo,
  endCall,
}) => {
  return (
    <div className="flex justify-center space-x-4 p-4 bg-background border-t border-border">
      <motion.button
        onClick={isAudioMuted ? unmuteAudio : muteAudio}
        className="p-3 rounded-full bg-input-bg text-text-primary hover:bg-primary hover:text-[var(--color-button-text)] transition-colors duration-200"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title={isAudioMuted ? 'Unmute Audio' : 'Mute Audio'}
      >
        {isAudioMuted ? <FiMicOff size={24} /> : <FiMic size={24} />}
      </motion.button>
      {callType === 'video' && (
        <motion.button
          onClick={isVideoMuted ? unmuteVideo : muteVideo}
          className="p-3 rounded-full bg-input-bg text-text-primary hover:bg-primary hover:text-[var(--color-button-text)] transition-colors duration-200"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title={isVideoMuted ? 'Unmute Video' : 'Mute Video'}
        >
          {isVideoMuted ? <FiVideoOff size={24} /> : <FiVideo size={24} />}
        </motion.button>
      )}
      <motion.button
        onClick={endCall}
        className="p-3 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors duration-200"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title="End Call"
      >
        <FiPhoneOff size={24} />
      </motion.button>
    </div>
  );
};

export default CallControls;