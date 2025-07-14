import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface VideoPlayerProps {
  videoTrack: any; // Agora video track
  isLocal?: boolean;
  username?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoTrack, isLocal = false, username = 'User' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoTrack && videoRef.current) {
      videoTrack.play(videoRef.current);
      return () => {
        videoTrack.stop();
      };
    }
  }, [videoTrack]);

  return (
    <motion.div
      className={`relative w-full h-full max-w-[400px] max-h-[300px] rounded-xl overflow-hidden shadow-lg bg-background border border-border ${
        isLocal ? 'border-primary' : ''
      }`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {videoTrack ? (
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          style={{ width: '100%', height: '100%' }}
          autoPlay
          playsInline
        />
      ) : (
        <div className="flex items-center justify-center w-full h-full bg-input-bg text-text-secondary">
          {isLocal ? 'Your Video' : `${username}'s Video`}
        </div>
      )}
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
        {isLocal ? 'You' : username}
      </div>
    </motion.div>
  );
};

export default VideoPlayer;