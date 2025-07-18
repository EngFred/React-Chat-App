import React, { useRef} from 'react'; // Removed useState from import
import type { User } from '../../../shared/types/user';
import { motion } from 'framer-motion';
import { FiCameraOff, FiMicOff, FiUser } from 'react-icons/fi';
import ProfilePicture from '../../../shared/components/ProfilePicture';
import { capitalizeFirstLetter } from '../../../shared/utils/helpers';

interface VideoFeedDisplayProps {
  isVideoCall: boolean;
  localVideoRef: React.RefObject<HTMLDivElement | null>;
  remoteVideoRef: React.RefObject<HTMLDivElement | null>;
  videoOff: boolean; // Local user's video state
  otherUser: User;
  micMuted: boolean; // Local user's mic state
  otherUserVideoOff: boolean; // Remote user's video state
  otherUserMicMuted: boolean; // Remote user's mic state
}

const VideoFeedDisplay: React.FC<VideoFeedDisplayProps> = ({
  isVideoCall,
  localVideoRef,
  remoteVideoRef,
  videoOff,
  otherUser,
  micMuted,
  otherUserVideoOff,
  otherUserMicMuted,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // Removed containerSize state and its useEffect logic entirely

  const localVideoDimensions = { width: 180, height: 135 };
  const padding = 24;

  const remoteUserDisplayName = capitalizeFirstLetter(otherUser.username);

  return (
    // Main container for video feeds, flexible to fill space
    <div ref={containerRef} className="relative flex-grow w-full h-full flex items-center justify-center p-4 md:p-8">

      {/* Remote User's Video / Placeholder (Main View) */}
      <motion.div
        className={`relative w-full h-full rounded-xl overflow-hidden bg-gray-900 flex items-center justify-center
          ${isVideoCall ? 'aspect-video md:aspect-auto' : 'aspect-square max-w-sm mx-auto'}
          lg:rounded-2xl shadow-2xl transition-all duration-300 ease-in-out
        `}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Remote Video Stream */}
        <div
          ref={remoteVideoRef}
          className={`absolute inset-0 bg-black ${otherUserVideoOff || !isVideoCall ? 'hidden' : ''}`}
          style={{ objectFit: 'cover' }} // Ensures video fills and crops if aspect ratio mismatch
        ></div>

        {/* Remote User Placeholder (when video is off or during audio call) */}
        {(otherUserVideoOff || !isVideoCall) && (
          <motion.div
            className="flex flex-col items-center justify-center text-gray-300 p-4 w-full h-full text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <ProfilePicture
              src={otherUser.profile_picture}
              alt={otherUser.username}
              size={72} // Larger, more prominent profile picture
              className="mb-8 border-4 border-white/40 shadow-xl ring-2 ring-[var(--color-primary)] ring-offset-2 ring-offset-gray-900"
            />
            <h2 className="text-4xl font-extrabold text-white mb-3 break-words max-w-full px-4">
              {remoteUserDisplayName}
            </h2>
            <div className="flex flex-col items-center gap-2 text-md text-gray-400">
              {otherUserMicMuted && (
                <span className="flex items-center gap-2">
                  <FiMicOff size={24} /> Microphone Muted
                </span>
              )}
              {isVideoCall && otherUserVideoOff && (
                 <span className="flex items-center gap-2">
                   <FiCameraOff size={24} /> Camera Off
                 </span>
              )}
              {!isVideoCall && (
                <span className="flex items-center gap-2">
                   <FiUser size={24} /> Audio Call
                 </span>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Local User's Video (Picture-in-Picture) - only for video calls */}
      {isVideoCall && (
        <motion.div
          ref={localVideoRef}
          className="absolute top-6 right-6 w-[180px] h-[135px] md:w-[220px] md:h-[165px] lg:w-[260px] lg:h-[195px]
                     bg-gray-800 rounded-xl border-2 border-white/20 shadow-2xl z-20 overflow-hidden cursor-grab active:cursor-grabbing"
          drag
          dragConstraints={containerRef} // Constrain dragging to the parent video display area
          dragElastic={0.1}
          initial={{ x: 'calc(100% + 50px)', y: 'calc(100% + 50px)', opacity: 0, scale: 0.8 }} // Initial position off-screen (bottom-right) for entry
          animate={{ x: 0, y: 0, opacity: 1, scale: 1 }} // Animate to default top-right
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.3 }} // Delayed entry
          // Use inline style for absolute positioning and to correctly apply drag offset relative to top/right
          style={{ x: `calc(-100% + ${localVideoDimensions.width + padding}px - var(--framer-x, 0px))`, y: `calc(${padding}px + var(--framer-y, 0px))` }}
        >
          {/* Local Video Stream */}
          <div
            className={`absolute inset-0 bg-black ${videoOff ? 'hidden' : ''}`}
            style={{ objectFit: 'cover' }}
          ></div>

          {/* Local User Placeholder (when video is off) */}
          {videoOff && (
            <div className="flex flex-col items-center justify-center w-full h-full text-gray-400 text-sm">
              <FiCameraOff size={30} className="mb-1" />
              <p>Video Off</p>
            </div>
          )}
          {/* Local Mic Muted Indicator */}
          {micMuted && (
            <span className="absolute top-2 right-2 bg-red-600 rounded-full p-1 text-white z-10">
              <FiMicOff size={16} />
            </span>
          )}
          <div className="absolute bottom-2 left-2 text-white text-xs bg-black/70 px-2 py-1 rounded z-10">You</div>
        </motion.div>
      )}
    </div>
  );
};

export default VideoFeedDisplay;