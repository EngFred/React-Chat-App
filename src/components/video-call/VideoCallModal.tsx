import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAgoraClient } from '../../hooks/useAgoraClient';
import type { User } from '../../types/user';
import { toast } from 'react-toastify';
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiPhoneOff } from 'react-icons/fi';
import VideoPlayer from './VideoPlayer';

interface VideoCallModalProps {
  channelName: string;
  callType: 'video' | 'audio';
  currentUser: User;
  otherUser: User;
  onClose: () => void;
  callStartTime: number | null;
}

const VideoCallModal: React.FC<VideoCallModalProps> = ({
  channelName,
  callType,
  currentUser,
  otherUser,
  onClose,
  callStartTime,
}) => {
  const {
    isConnected,
    localCameraTrack,
    remoteUsers,
    isAudioLoading,
    isVideoLoading,
    muteAudio,
    unmuteAudio,
    muteVideo,
    unmuteVideo,
    leaveCall,
  } = useAgoraClient(channelName, callType, currentUser.id);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(callType === 'audio');
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    if (!callStartTime || !isConnected) return;

    const interval = setInterval(() => {
      setCallDuration(Math.floor((Date.now() - callStartTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [callStartTime, isConnected]);

  useEffect(() => {
    if (!isConnected && !isAudioLoading && !isVideoLoading) {
      const timeout = setTimeout(() => {
        if (!isConnected) {
          toast.error('Failed to connect to call.');
          handleEndCall();
        }
      }, 15000);
      return () => clearTimeout(timeout);
    }
  }, [isConnected, isAudioLoading, isVideoLoading]);

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    leaveCall();
    onClose();
  };

  const toggleAudio = () => {
    if (isAudioMuted) {
      unmuteAudio();
      setIsAudioMuted(false);
    } else {
      muteAudio();
      setIsAudioMuted(true);
    }
  };

  const toggleVideo = () => {
    if (isVideoMuted) {
      unmuteVideo();
      setIsVideoMuted(false);
    } else {
      muteVideo();
      setIsVideoMuted(true);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="bg-background rounded-lg p-6 shadow-lg border border-border max-w-lg w-full"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          {callType === 'video' ? 'Video' : 'Audio'} Call with {otherUser.username}
        </h2>
        <p className="text-text-secondary mb-4">Duration: {formatDuration(callDuration)}</p>
        {isAudioLoading || isVideoLoading || !isConnected ? (
          <p className="text-text-secondary">Connecting to call...</p>
        ) : (
          <>
            {callType === 'video' && (
              <div className="relative w-full h-64 bg-gray-800 rounded-lg overflow-hidden mb-4">
                {remoteUsers.length === 0 && (
                  <div className="flex items-center justify-center w-full h-full text-text-secondary">
                    Waiting for {otherUser.username} to join...
                  </div>
                )}
                {remoteUsers.map((user) => (
                  <VideoPlayer
                    key={user.uid}
                    videoTrack={user.videoTrack}
                    username={otherUser.username}
                  />
                ))}
                {localCameraTrack && !isVideoMuted && (
                  <div className="absolute bottom-4 right-4 w-32 h-24 bg-gray-900 rounded">
                    <VideoPlayer
                      videoTrack={localCameraTrack}
                      isLocal={true}
                      username={currentUser.username}
                    />
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-center space-x-4">
              <motion.button
                onClick={toggleAudio}
                className="p-2 rounded-full bg-input-bg hover:bg-gray-300 transition-colors duration-200"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title={isAudioMuted ? 'Unmute Audio' : 'Mute Audio'}
              >
                {isAudioMuted ? (
                  <FiMicOff size={24} className="text-text-primary" />
                ) : (
                  <FiMic size={24} className="text-text-primary" />
                )}
              </motion.button>
              {callType === 'video' && (
                <motion.button
                  onClick={toggleVideo}
                  className="p-2 rounded-full bg-input-bg hover:bg-gray-300 transition-colors duration-200"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title={isVideoMuted ? 'Unmute Video' : 'Mute Video'}
                >
                  {isVideoMuted ? (
                    <FiVideoOff size={24} className="text-text-primary" />
                  ) : (
                    <FiVideo size={24} className="text-text-primary" />
                  )}
                </motion.button>
              )}
              <motion.button
                onClick={handleEndCall}
                className="p-2 rounded-full bg-red-500 hover:bg-red-600 transition-colors duration-200"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="End Call"
              >
                <FiPhoneOff size={24} className="text-white" />
              </motion.button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default VideoCallModal;