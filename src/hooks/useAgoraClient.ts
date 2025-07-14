import { useState, useEffect, useRef } from 'react';
import {
  useRTCClient,
  useLocalMicrophoneTrack,
  useLocalCameraTrack,
  useRemoteUsers,
  useRemoteAudioTracks,
  useJoin,
  usePublish,
} from 'agora-rtc-react';
import { agoraConfig } from '../config/agora';
import { toast } from 'react-toastify';
import axios from 'axios';

interface AgoraClientState {
  isConnected: boolean;
  localMicrophoneTrack: ReturnType<typeof useLocalMicrophoneTrack>['localMicrophoneTrack'];
  localCameraTrack: ReturnType<typeof useLocalCameraTrack>['localCameraTrack'];
  remoteUsers: ReturnType<typeof useRemoteUsers>;
  isAudioLoading: boolean;
  isVideoLoading: boolean;
  muteAudio: () => void;
  unmuteAudio: () => void;
  muteVideo: () => void;
  unmuteVideo: () => void;
  leaveCall: () => void;
}

export const useAgoraClient = (
  channelName: string,
  callType: 'video' | 'audio',
  userId: string
): AgoraClientState => {
  const client = useRTCClient();
  const { localMicrophoneTrack, isLoading: isAudioLoading, error: audioError } = useLocalMicrophoneTrack();
  const { localCameraTrack, isLoading: isVideoLoading, error: videoError } = useLocalCameraTrack();
  const remoteUsers = useRemoteUsers();
  const { audioTracks } = useRemoteAudioTracks(remoteUsers);
  const [isConnected, setIsConnected] = useState(false);
  const isLeaving = useRef(false);
  const [token, setToken] = useState<string | null>(null);
  const connectionAttempted = useRef(false);
  const retryCount = useRef(0);
  const maxRetries = 3;

  // Fetch Agora token with retry logic
  useEffect(() => {
    if (!channelName || !userId || connectionAttempted.current) return;

    const fetchToken = async () => {
      try {
        console.debug(`Fetching token for channel: ${channelName}, user: ${userId}, attempt: ${retryCount.current + 1}`);
        const functionUrl = 'https://agora-token-server-g8dv.onrender.com/generate-token';
        const response = await axios.post(functionUrl, {
          channelName,
          userId,
          role: callType === 'video' ? 'publisher' : 'subscriber',
        }, { timeout: 10000 });

        setToken(response.data.token);
        console.debug('Successfully fetched Agora token:', response.data.token);
        connectionAttempted.current = true;
      } catch (error) {
        console.error(`Token fetch failed for channel: ${channelName}, user: ${userId}`, error);
        if (retryCount.current < maxRetries - 1) {
          retryCount.current += 1;
          setTimeout(fetchToken, 2000 * retryCount.current);
        } else {
          if (axios.isAxiosError(error)) {
            toast.error(`Unable to join call: ${error.response?.data?.error || 'Server error.'}`);
          } else {
            toast.error('Unable to join call: An unexpected error occurred.');
          }
          connectionAttempted.current = true;
        }
      }
    };

    fetchToken();
  }, [channelName, userId, callType]);

  // Join Agora channel
  useJoin(
    {
      appid: agoraConfig.appId,
      channel: channelName,
      token: token,
      uid: userId,
    },
    !!channelName && !!token && !isConnected
  );

  // Publish tracks
  usePublish([localMicrophoneTrack, callType === 'video' ? localCameraTrack : null]);

  // Handle connection state changes and errors
  useEffect(() => {
    if (!channelName || isLeaving.current || !token) return;

    const handleConnectionStateChange = (state: string) => {
      console.debug('Agora connection state:', state);
      setIsConnected(state === 'CONNECTED');
      if (state === 'DISCONNECTED' || state === 'DISCONNECTING') {
        toast.error('Call connection lost. Please try again.');
        leaveCall();
      }
    };

    const handleException = (event: { code: number; msg: string; uid: string }) => {
      console.error('Agora exception:', event);
      toast.error(`Failed to join call: ${event.msg} (Code: ${event.code})`);
      leaveCall();
    };

    client.on('connection-state-change', handleConnectionStateChange);
    client.on('exception', handleException);
    setIsConnected(client.connectionState === 'CONNECTED');

    return () => {
      client.off('connection-state-change', handleConnectionStateChange);
      client.off('exception', handleException);
    };
  }, [channelName, token, client]);

  // Handle media errors
  useEffect(() => {
    if (audioError) {
      console.error('Audio track error:', audioError);
      toast.error('Microphone access denied or unavailable.');
      leaveCall();
    }
    if (videoError && callType === 'video') {
      console.error('Video track error:', videoError);
      toast.error('Camera access denied or unavailable.');
      leaveCall();
    }
  }, [audioError, videoError, callType]);

  // Play remote audio tracks
  useEffect(() => {
    audioTracks.forEach((track) => {
      try {
        track.play();
      } catch (error) {
        console.error('Error playing remote audio track:', error);
      }
    });
  }, [audioTracks]);

  // Handle page visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.debug('Page hidden, pausing tracks');
        localMicrophoneTrack?.setEnabled(false);
        localCameraTrack?.setEnabled(false);
      } else {
        console.debug('Page visible, resuming tracks');
        localMicrophoneTrack?.setEnabled(true);
        if (callType === 'video') localCameraTrack?.setEnabled(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [localMicrophoneTrack, localCameraTrack, callType]);

  const muteAudio = () => {
    if (localMicrophoneTrack) {
      localMicrophoneTrack.setEnabled(false);
      toast.info('Microphone muted');
    }
  };

  const unmuteAudio = () => {
    if (localMicrophoneTrack) {
      localMicrophoneTrack.setEnabled(true);
      toast.info('Microphone unmuted');
    }
  };

  const muteVideo = () => {
    if (localCameraTrack) {
      localCameraTrack.setEnabled(false);
      toast.info('Video muted');
    }
  };

  const unmuteVideo = () => {
    if (localCameraTrack) {
      localCameraTrack.setEnabled(true);
      toast.info('Video unmuted');
    }
  };

  const leaveCall = () => {
    if (isLeaving.current) return;
    isLeaving.current = true;

    try {
      localMicrophoneTrack?.close();
      localCameraTrack?.close();
      client.leave().then(() => {
        setIsConnected(false);
        setToken(null);
        connectionAttempted.current = false;
        retryCount.current = 0;
        toast.info('Call ended');
      }).catch((err) => {
        console.error('Leave channel failed:', err);
        toast.error('Failed to end call.');
      }).finally(() => {
        isLeaving.current = false;
      });
    } catch (error) {
      console.error('Error leaving call:', error);
      isLeaving.current = false;
    }
  };

  return {
    isConnected,
    localMicrophoneTrack,
    localCameraTrack,
    remoteUsers,
    isAudioLoading,
    isVideoLoading,
    muteAudio,
    unmuteAudio,
    muteVideo,
    unmuteVideo,
    leaveCall,
  };
};