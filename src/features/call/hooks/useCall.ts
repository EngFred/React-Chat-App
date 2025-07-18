import { useState, useEffect, useRef, useCallback } from 'react';
import type { ILocalVideoTrack, ILocalAudioTrack, IRemoteVideoTrack, IRemoteAudioTrack, IAgoraRTCRemoteUser, ILocalTrack } from 'agora-rtc-sdk-ng';
import { toast } from 'react-toastify';
import type { User } from '../../../shared/types/user';
import {
  getAgoraClient,
  createLocalTracks,
  joinChannel,
  leaveChannel,
  setupRemoteUserListeners,
  removeRemoteUserListeners,
  setupConnectionStateListener,
  removeConnectionStateListener,
  toggleLocalAudio,
  toggleLocalVideo,
  fetchUserById,
  listenForUserUpdates,
} from '../service/callService';

const client = getAgoraClient();

interface CallHookResult {
  localVideoRef: React.RefObject<HTMLDivElement | null>;
  remoteVideoRef: React.RefObject<HTMLDivElement | null>;
  micMuted: boolean;
  videoOff: boolean;
  callDuration: number;
  connectionState: string;
  otherUser: User | null;
  isLoadingOtherUser: boolean;
  otherUserVideoOff: boolean;
  otherUserMicMuted: boolean;
  toggleMic: () => void;
  toggleVideo: () => void;
  endCall: () => void;
  formatDuration: (seconds: number) => string;
}

export const useCall = (
  isVideoCall: boolean,
  appId: string,
  channelName: string,
  token: string,
  otherUserId: string,
  onCallEnded: (userIdToOpenChatWith: string) => void // MODIFIED: onCallEnded now accepts userId
): CallHookResult => {
  // State variables
  const [micMuted, setMicMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(isVideoCall ? false : true);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionState, setConnectionState] = useState<string>('DISCONNECTED');
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [isLoadingOtherUser, setIsLoadingOtherUser] = useState(true);
  const [otherUserVideoOff, setOtherUserVideoOff] = useState(true);
  const [otherUserMicMuted, setOtherUserMicMuted] = useState(true);

  // Refs for AgoraRTC tracks
  const localAudioTrackRef = useRef<ILocalAudioTrack | null>(null);
  const localVideoTrackRef = useRef<ILocalVideoTrack | null>(null);
  const remoteAudioTrackRef = useRef<IRemoteAudioTrack | null>(null);
  const remoteVideoTrackRef = useRef<IRemoteVideoTrack | null>(null);

  // Refs for video player elements in the UI
  const localVideoRef = useRef<HTMLDivElement | null>(null);
  const remoteVideoRef = useRef<HTMLDivElement | null>(null);

  const isJoining = useRef(false);

  const handleUserPublished = useCallback(async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
    if (user.uid === otherUserId) {
      await client.subscribe(user, mediaType);
      console.log('[useCall] Subscribed to user:', user.uid, mediaType);

      if (mediaType === 'video' && user.videoTrack) {
        remoteVideoTrackRef.current = user.videoTrack;
        if (remoteVideoRef.current) {
          user.videoTrack.play(remoteVideoRef.current);
        }
        setOtherUserVideoOff(false);
      }
      if (mediaType === 'audio' && user.audioTrack) {
        remoteAudioTrackRef.current = user.audioTrack;
        user.audioTrack.play();
        setOtherUserMicMuted(false);
      }
    }
  }, [otherUserId]);

  const handleUserUnpublished = useCallback((user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
    if (user.uid === otherUserId) {
      console.log('[useCall] User unpublished:', user.uid, mediaType);
      if (mediaType === 'video') {
        remoteVideoTrackRef.current?.stop();
        remoteVideoTrackRef.current = null;
        setOtherUserVideoOff(true);
      }
      if (mediaType === 'audio') {
        remoteAudioTrackRef.current?.stop();
        remoteAudioTrackRef.current = null;
        setOtherUserMicMuted(true);
      }
    }
  }, [otherUserId]);

  const handleUserLeft = useCallback((user: IAgoraRTCRemoteUser) => {
    if (user.uid === otherUserId) {
      console.log('[useCall] Other user left:', user.uid);
      remoteAudioTrackRef.current?.stop();
      remoteVideoTrackRef.current?.stop();
      remoteAudioTrackRef.current = null;
      remoteVideoTrackRef.current = null;
      setOtherUserVideoOff(true);
      setOtherUserMicMuted(true);
      toast.info(`Other user left the call.`); // REMOVED theme: 'colored'
      onCallEnded(otherUserId); // MODIFIED: Pass otherUserId
    }
  }, [otherUserId, onCallEnded]);

  const handleConnectionStateChange = useCallback((state: string) => {
    setConnectionState(state);
    console.log('[useCall] Connection state:', state);
    if (state === 'CONNECTED') {
      toast.success(`Connected to call!`); // REMOVED theme: 'colored'
    } else if (state === 'DISCONNECTED') {
      toast.error('Call disconnected unexpectedly.'); // REMOVED theme: 'colored'
      onCallEnded(otherUserId); // MODIFIED: Pass otherUserId
    }
  }, [onCallEnded, otherUserId]); // Added otherUserId to dependencies

  useEffect(() => {
    if (!otherUserId) {
      setIsLoadingOtherUser(false);
      return;
    }

    const fetchAndListenToUser = async () => {
      setIsLoadingOtherUser(true);
      try {
        const user = await fetchUserById(otherUserId);
        if (!user) {
          toast.error('Calling user not found.'); // REMOVED theme: 'colored'
          onCallEnded(otherUserId); // MODIFIED: Pass otherUserId
          return;
        }
        setOtherUser(user);
      } catch (error: any) {
        console.error('[useCall] Error fetching other user:', error.message);
        toast.error('Failed to load calling user data.'); // REMOVED theme: 'colored'
        onCallEnded(otherUserId); // MODIFIED: Pass otherUserId
        return;
      } finally {
        setIsLoadingOtherUser(false);
      }

      const unsubscribe = listenForUserUpdates(otherUserId, (payload) => {
        setOtherUser(payload.new as User);
      });

      return () => {
        unsubscribe();
      };
    };

    fetchAndListenToUser();
  }, [otherUserId, onCallEnded]);

  useEffect(() => {
    if (isJoining.current || client.connectionState === 'CONNECTED' || client.connectionState === 'CONNECTING') {
      console.log('[useCall] Client already connecting/connected, skipping initial join attempt.');
      return;
    }

    isJoining.current = true;
    setConnectionState('CONNECTING');

    const setupCall = async () => {
      try {
        const { audioTrack, videoTrack } = await createLocalTracks(isVideoCall);
        localAudioTrackRef.current = audioTrack;
        localVideoTrackRef.current = videoTrack;

        const tracksToPublish: ILocalTrack[] = [audioTrack];
        if (videoTrack) {
          tracksToPublish.push(videoTrack);
        }

        await joinChannel(client, appId, channelName, token, tracksToPublish);

        if (isVideoCall && localVideoTrackRef.current && localVideoRef.current) {
          localVideoTrackRef.current.play(localVideoRef.current);
        }

        setupRemoteUserListeners(client, handleUserPublished, handleUserUnpublished, handleUserLeft);
        setupConnectionStateListener(client, handleConnectionStateChange);

      } catch (error: any) {
        console.error('[useCall] Error during call setup:', error);
        toast.error(`Failed to start call: ${error.message || 'Check permissions and try again.'}`); // REMOVED theme: 'colored'
        onCallEnded(otherUserId); // MODIFIED: Pass otherUserId
      } finally {
        isJoining.current = false;
      }
    };

    setupCall();

    return () => {
      console.log('[useCall] Running cleanup for AgoraRTC hook.');
      removeRemoteUserListeners(client, handleUserPublished, handleUserUnpublished, handleUserLeft);
      removeConnectionStateListener(client, handleConnectionStateChange);

      leaveChannel(client, localAudioTrackRef.current, localVideoTrackRef.current)
        .catch((err) => console.error('[useCall] Error during cleanup leave:', err));

      localAudioTrackRef.current = null;
      localVideoTrackRef.current = null;
      remoteAudioTrackRef.current = null;
      remoteVideoTrackRef.current = null;
    };
  }, [isVideoCall, appId, channelName, token, onCallEnded, handleUserPublished, handleUserUnpublished, handleUserLeft, handleConnectionStateChange, otherUserId]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (connectionState === 'CONNECTED') {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [connectionState]);

  const toggleMic = useCallback((): void => {
    const newMicMutedState = !micMuted;
    toggleLocalAudio(localAudioTrackRef.current, !newMicMutedState)
      .then(() => {
        setMicMuted(newMicMutedState);
        toast.info(`Microphone ${newMicMutedState ? 'muted' : 'unmuted'}.`); // REMOVED theme: 'colored'
      })
      .catch((error) => {
        console.error('[useCall] Error toggling mic:', error);
        toast.error('Failed to toggle microphone.'); // REMOVED theme: 'colored'
      });
  }, [micMuted]);

  const toggleVideo = useCallback((): void => {
    if (!isVideoCall) return;

    const newVideoOffState = !videoOff;
    toggleLocalVideo(localVideoTrackRef.current, !newVideoOffState)
      .then(() => {
        setVideoOff(newVideoOffState);
        toast.info(`Video ${newVideoOffState ? 'off' : 'on'}.`); // REMOVED theme: 'colored'
      })
      .catch((error) => {
        console.error('[useCall] Error toggling video:', error);
        toast.error('Failed to toggle video.'); // REMOVED theme: 'colored'
      });
  }, [videoOff, isVideoCall]);

  const endCall = useCallback((): void => {
    console.log('[useCall] End call requested.');
    if (otherUser) { // Ensure otherUser is available before passing its ID
      onCallEnded(otherUser.id); // MODIFIED: Pass otherUser.id
    } else {
      // Fallback if otherUser somehow not loaded, though unlikely here
      onCallEnded(otherUserId);
    }
  }, [onCallEnded, otherUser, otherUserId]); // Added otherUser to dependencies

  const formatDuration = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  return {
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
  };
};