import React, { useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { agoraConfig } from '../service/agora'; // Assuming this path is correct
import { useCall } from '../hooks/useCall'; // Assuming this path is correct

// Rebuilt Components
import CallControls from '../components/CallControls';
import VideoFeedDisplay from '../components/VideoFeedDisplay';
import CallStatusOverlay from '../components/CallStatusOverlay';
import CallInitiatorLoader from '../components/CallInitiatorLoader';

const CallPage: React.FC = () => {
  const { callType, userId } = useParams<{ callType: string; userId: string }>();
  const navigate = useNavigate();

  const isVideoCall = callType === 'video';

  // Callback to handle call end, navigating back to chat with the specific user's window open
  const handleCallEnd = useCallback((userIdToOpenChatWith: string) => {
    navigate('/chat', { state: { openChatWithUserId: userIdToOpenChatWith } });
  }, [navigate]);

  const {
    localVideoRef,
    remoteVideoRef,
    micMuted,
    videoOff,
    callDuration,
    connectionState,
    otherUser,
    isLoadingOtherUser,
    otherUserVideoOff,
    otherUserMicMuted,
    toggleMic,
    toggleVideo,
    endCall,
    formatDuration,
  } = useCall(isVideoCall, agoraConfig.appId, agoraConfig.channelName, agoraConfig.token, userId!, handleCallEnd);

  // Effect to handle invalid call parameters
  useEffect(() => {
    if (!userId || (callType !== 'audio' && callType !== 'video')) {
      toast.error('Invalid call parameters provided.');
      navigate('/chat', { state: { openChatWithUserId: userId || undefined } });
      return;
    }
  }, [userId, callType, navigate]);

  // Show a loading screen while user data is being fetched or call is initializing
  if (isLoadingOtherUser || !otherUser) {
    return (
      <CallInitiatorLoader
        callType={callType || 'audio'}
        message={isLoadingOtherUser ? `Fetching ${callType} user...` : 'Initializing call...'}
      />
    );
  }

  return (
    <motion.div
      className="relative w-screen h-screen bg-gradient-to-br from-gray-950 to-gray-800 text-white font-sans flex flex-col justify-between items-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Main Video/User Display Area */}
      <VideoFeedDisplay
        isVideoCall={isVideoCall}
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
        videoOff={videoOff}
        otherUser={otherUser}
        micMuted={micMuted}
        otherUserVideoOff={otherUserVideoOff}
        otherUserMicMuted={otherUserMicMuted}
      />

      {/* Connection Status & Duration Overlay */}
      <CallStatusOverlay
        connectionState={connectionState}
        callDuration={callDuration}
        formatDuration={formatDuration}
        otherUser={otherUser}
      />

      {/* Call Control Buttons */}
      <CallControls
        isVideoCall={isVideoCall}
        micMuted={micMuted}
        videoOff={videoOff}
        toggleMic={toggleMic}
        toggleVideo={toggleVideo}
        endCall={endCall}
      />
    </motion.div>
  );
};

export default CallPage;