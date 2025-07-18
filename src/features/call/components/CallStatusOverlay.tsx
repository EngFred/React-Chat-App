import React from 'react';
import { motion } from 'framer-motion';
import { FiWifi, FiPhoneOff, FiLoader} from 'react-icons/fi';
import type { User } from '../../../shared/types/user';
import { capitalizeFirstLetter } from '../../../shared/utils/helpers';

interface CallStatusOverlayProps {
  connectionState: string;
  callDuration: number;
  formatDuration: (seconds: number) => string;
  otherUser: User;
}

const CallStatusOverlay: React.FC<CallStatusOverlayProps> = ({
  connectionState,
  callDuration,
  formatDuration,
  otherUser,
}) => {
  const displayStatus = connectionState.charAt(0).toUpperCase() + connectionState.slice(1).toLowerCase();

  let statusIcon;
  let statusColorClass;

  switch (connectionState) {
    case 'CONNECTED':
      statusIcon = <FiWifi size={20} className="text-green-400" />;
      statusColorClass = 'text-green-400';
      break;
    case 'DISCONNECTED':
      statusIcon = <FiPhoneOff size={20} className="text-red-500" />;
      statusColorClass = 'text-red-500';
      break;
    case 'CONNECTING':
      statusIcon = <FiLoader size={20} className="text-yellow-400 animate-spin" />;
      statusColorClass = 'text-yellow-400';
      break;
    default: // For 'DISCONNECTING' or any other state
      statusIcon = <FiLoader size={20} className="text-gray-400 animate-spin" />;
      statusColorClass = 'text-gray-400';
      break;
  }

  return (
    <motion.div
      className="absolute top-6 md:top-8 lg:top-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 bg-black/60 backdrop-blur-md px-6 py-3 rounded-lg text-white z-20 shadow-xl"
      initial={{ y: -100, opacity: 0 }} // Start higher for a more noticeable drop-in
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
    >
      <div className="flex items-center gap-2">
        {statusIcon}
        <span className={`text-md font-medium ${statusColorClass}`}>
          {displayStatus}
        </span>
      </div>
      <p className="text-3xl md:text-4xl font-extrabold text-[var(--color-primary)]">
        {formatDuration(callDuration)}
      </p>
      <p className="text-lg md:text-xl text-gray-300">
        Calling {capitalizeFirstLetter(otherUser.username)}
      </p>
    </motion.div>
  );
};

export default CallStatusOverlay;