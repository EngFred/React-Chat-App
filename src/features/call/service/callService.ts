/**
 * @file This file provides a service layer for direct interaction with the AgoraRTC SDK.
 * It encapsulates low-level API calls for managing Agora client, tracks, and real-time events.
 * This service is purely functional and does not manage React state.
 */

import AgoraRTC from 'agora-rtc-sdk-ng';
import type { IAgoraRTCClient, ILocalVideoTrack, ILocalAudioTrack, ILocalTrack, IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';

// Import Firebase (Firestore)
import { db } from '../../../shared/libs/firebase'; // Assuming your Firebase initialized app is exported as 'db' from this path
import { doc, getDoc, onSnapshot } from 'firebase/firestore'; // Specific Firestore functions

import type { User } from '../../../shared/types/user'; // Import User type

/**
 * @constant client
 * @description A singleton AgoraRTC client instance. This client is created once and reused
 * across the application to manage the WebRTC connection.
 */
const client: IAgoraRTCClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

/**
 * @function getAgoraClient
 * @description Returns the singleton AgoraRTC client instance.
 * @returns {IAgoraRTCClient} The AgoraRTC client instance.
 */
export const getAgoraClient = (): IAgoraRTCClient => client;

/**
 * @function createLocalTracks
 * @description Creates local audio and optionally video tracks.
 * @param {boolean} isVideoCall - True if a video track should be created.
 * @returns {Promise<{ audioTrack: ILocalAudioTrack, videoTrack: ILocalVideoTrack | null }>}
 * A promise that resolves with the created local audio and video tracks.
 * @throws {Error} Throws an error if track creation fails.
 */
export const createLocalTracks = async (isVideoCall: boolean): Promise<{ audioTrack: ILocalAudioTrack, videoTrack: ILocalVideoTrack | null }> => {
  console.log('[CallService] Creating local audio track...');
  const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
  console.log('[CallService] Local audio track created.');

  let videoTrack: ILocalVideoTrack | null = null;
  if (isVideoCall) {
    console.log('[CallService] Creating local video track...');
    videoTrack = await AgoraRTC.createCameraVideoTrack();
    console.log('[CallService] Local video track created.');
  }
  return { audioTrack, videoTrack };
};

/**
 * @function joinChannel
 * @description Joins an Agora channel and publishes the provided local tracks.
 * @param {IAgoraRTCClient} agoraClient - The AgoraRTC client instance.
 * @param {string} appId - The Agora App ID.
 * @param {string} channelName - The Agora channel name.
 * @param {string} token - The Agora authentication token.
 * @param {ILocalTrack[]} localTracks - An array of local audio and/or video tracks to publish.
 * @returns {Promise<void>} A promise that resolves when the client successfully joins and publishes.
 * @throws {Error} Throws an error if joining or publishing fails.
 */
export const joinChannel = async (agoraClient: IAgoraRTCClient, appId: string, channelName: string, token: string, localTracks: ILocalTrack[]): Promise<void> => {
  console.log(`[CallService] Joining channel ${channelName}...`);
  await agoraClient.join(appId, channelName, token, null);
  console.log(`[CallService] Joined channel ${channelName}. Publishing tracks...`);
  await agoraClient.publish(localTracks);
  console.log('[CallService] Local tracks published.');
};

/**
 * @function leaveChannel
 * @description Leaves the Agora channel and closes all local tracks.
 * @param {IAgoraRTCClient} agoraClient - The AgoraRTC client instance.
 * @param {ILocalAudioTrack | null} localAudioTrack - The local audio track to close.
 * @param {ILocalVideoTrack | null} localVideoTrack - The local video track to close.
 * @returns {Promise<void>} A promise that resolves when the client successfully leaves and tracks are closed.
 */
export const leaveChannel = async (agoraClient: IAgoraRTCClient, localAudioTrack: ILocalAudioTrack | null, localVideoTrack: ILocalVideoTrack | null): Promise<void> => {
  console.log('[CallService] Leaving channel...');
  if (localAudioTrack) {
    localAudioTrack.close();
    console.log('[CallService] Local audio track closed.');
  }
  if (localVideoTrack) {
    localVideoTrack.close();
    console.log('[CallService] Local video track closed.');
  }
  if (agoraClient.connectionState === 'CONNECTED') {
    await agoraClient.leave();
    console.log('[CallService] Left channel successfully.');
  }
};

/**
 * @function setupRemoteUserListeners
 * @description Sets up event listeners for remote users publishing/unpublishing tracks and leaving the channel.
 * @param {IAgoraRTCClient} agoraClient - The AgoraRTC client instance.
 * @param {(user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => Promise<void>} onUserPublished - Callback for when a remote user publishes tracks.
 * @param {(user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => void} onUserUnpublished - Callback for when a remote user unpublishes tracks.
 * @param {(user: IAgoraRTCRemoteUser) => void} onUserLeft - Callback for when a remote user leaves.
 */
export const setupRemoteUserListeners = (
  agoraClient: IAgoraRTCClient,
  onUserPublished: (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => Promise<void>,
  onUserUnpublished: (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => void,
  onUserLeft: (user: IAgoraRTCRemoteUser) => void
): void => {
  agoraClient.on('user-published', onUserPublished);
  agoraClient.on('user-unpublished', onUserUnpublished);
  agoraClient.on('user-left', onUserLeft);
  console.log('[CallService] Remote user listeners set up.');
};

/**
 * @function removeRemoteUserListeners
 * @description Removes event listeners for remote users.
 * @param {IAgoraRTCClient} agoraClient - The AgoraRTC client instance.
 * @param {(user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => Promise<void>} onUserPublished - Callback to remove.
 * @param {(user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => void} onUserUnpublished - Callback to remove.
 * @param {(user: IAgoraRTCRemoteUser) => void} onUserLeft - Callback to remove.
 */
export const removeRemoteUserListeners = (
  agoraClient: IAgoraRTCClient,
  onUserPublished: (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => Promise<void>,
  onUserUnpublished: (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => void,
  onUserLeft: (user: IAgoraRTCRemoteUser) => void
): void => {
  agoraClient.off('user-published', onUserPublished);
  agoraClient.off('user-unpublished', onUserUnpublished);
  agoraClient.off('user-left', onUserLeft);
  console.log('[CallService] Remote user listeners removed.');
};

/**
 * @function setupConnectionStateListener
 * @description Sets up an event listener for changes in the AgoraRTC client's connection state.
 * @param {IAgoraRTCClient} agoraClient - The AgoraRTC client instance.
 * @param {(state: string) => void} onConnectionStateChange - Callback for connection state changes.
 */
export const setupConnectionStateListener = (agoraClient: IAgoraRTCClient, onConnectionStateChange: (state: string) => void): void => {
  agoraClient.on('connection-state-change', onConnectionStateChange);
  console.log('[CallService] Connection state listener set up.');
};

/**
 * @function removeConnectionStateListener
 * @description Removes the event listener for connection state changes.
 * @param {IAgoraRTCClient} agoraClient - The AgoraRTC client instance.
 * @param {(state: string) => void} onConnectionStateChange - Callback to remove.
 */
export const removeConnectionStateListener = (agoraClient: IAgoraRTCClient, onConnectionStateChange: (state: string) => void): void => {
  agoraClient.off('connection-state-change', onConnectionStateChange);
  console.log('[CallService] Connection state listener removed.');
};

/**
 * @function toggleLocalAudio
 * @description Toggles the enabled state of a local audio track.
 * @param {ILocalAudioTrack | null} track - The local audio track.
 * @param {boolean} enabled - The desired enabled state.
 * @returns {Promise<void>} A promise that resolves when the track state is toggled.
 */
export const toggleLocalAudio = async (track: ILocalAudioTrack | null, enabled: boolean): Promise<void> => {
  if (track) {
    await track.setEnabled(enabled);
    console.log(`[CallService] Local audio track set to enabled: ${enabled}.`);
  }
};

/**
 * @function toggleLocalVideo
 * @description Toggles the enabled state of a local video track.
 * @param {ILocalVideoTrack | null} track - The local video track.
 * @param {boolean} enabled - The desired enabled state.
 * @returns {Promise<void>} A promise that resolves when the track state is toggled.
 */
export const toggleLocalVideo = async (track: ILocalVideoTrack | null, enabled: boolean): Promise<void> => {
  if (track) {
    await track.setEnabled(enabled);
    console.log(`[CallService] Local video track set to enabled: ${enabled}.`);
  }
};

/**
 * @function fetchUserById
 * @description Fetches a single user's data from the 'users' collection in Firestore by their ID.
 * @param {string} userId - The ID of the user to fetch.
 * @returns {Promise<User | null>} A promise that resolves with the user object or null if not found.
 * @throws {Error} Throws an error if fetching the user fails.
 */
export const fetchUserById = async (userId: string): Promise<User | null> => {
  console.log(`[CallService] fetchUserById: Fetching user with ID: ${userId}.`);
  try {
    const userDocRef = doc(db, 'users', userId); // Reference to the user document
    const userDocSnap = await getDoc(userDocRef); // Get the document snapshot

    if (userDocSnap.exists()) {
      // The user ID from Firebase authentication is usually used as the document ID in Firestore.
      // So, we add the id back to the data as it's part of the User type.
      return { id: userDocSnap.id, ...userDocSnap.data() } as User;
    } else {
      console.log(`[CallService] fetchUserById: User with ID ${userId} not found.`);
      return null;
    }
  } catch (error: any) {
    console.error('[CallService] fetchUserById error:', error.message);
    throw error;
  }
};

/**
 * @function listenForUserUpdates
 * @description Sets up a real-time listener for updates to a specific user's profile in Firestore.
 * @param {string} userId - The ID of the user to listen for updates.
 * @param {(payload: { new: User }) => void} callback - Callback function to handle user updates.
 * @returns {() => void} An unsubscribe function to stop listening to updates.
 */
export const listenForUserUpdates = (userId: string, callback: (payload: { new: User }) => void): (() => void) => {
  console.log(`[CallService] listenForUserUpdates: Setting up listener for user ${userId} profile changes.`);

  // Create a document reference for the specific user
  const userDocRef = doc(db, 'users', userId);

  // Set up the real-time listener
  const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
    if (docSnap.exists()) {
      // Data exists, create the User object
      callback({ new: { id: docSnap.id, ...docSnap.data() } as User });
    } else {
      // Document does not exist (e.g., user deleted)
      console.warn(`[CallService] User document with ID ${userId} no longer exists.`);
      // You might want to handle this case in your useCall hook (e.g., end the call)
    }
  }, (error) => {
    console.error(`[CallService] Error listening to user updates for ${userId}:`, error);
    // Handle error (e.g., log, show toast)
  });

  return () => {
    console.log(`[CallService] listenForUserUpdates: Unsubscribing from user ${userId} profile changes.`);
    unsubscribe(); // Call the unsubscribe function returned by onSnapshot
  };
};