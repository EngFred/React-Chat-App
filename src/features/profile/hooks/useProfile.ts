import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useAuthStore } from '../../../shared/store/authStore'; 
import type { User } from '../../../shared/types/user';

import {
  uploadAndSetProfilePicture,
  updateUsernameInFirestoreAndAuth,
} from '../service/profileService';

/**
 * @interface ProfileState
 * @description Defines the shape of the object returned by the `useProfile` hook,
 * including data, loading states, and functions to interact with profile services.
 * @property {User | null} profileData - The current user's profile data, derived from `currentUser` in `useAuthStore`.
 * @property {boolean} isLoadingProfile - True if initial authentication data is still loading.
 * @property {boolean} isUpdatingUsername - True if a username update operation is in progress.
 * @property {boolean} isUploadingPicture - True if a profile picture upload operation is in progress.
 * @property {boolean} isLoggingOut - True if a logout operation is in progress.
 * @property {string | null} currentProfilePicture - The URL of the current profile picture, or null.
 * @property {(file: File) => Promise<void>} uploadProfilePicture - Function to initiate profile picture upload.
 * @property {(username: string) => Promise<void>} updateUsername - Function to initiate username update.
 * @property {() => Promise<void>} logout - Function to initiate user logout.
 */
interface ProfileState {
  profileData: User | null;
  isLoadingProfile: boolean;
  isUpdatingUsername: boolean;
  isUploadingPicture: boolean;
  isLoggingOut: boolean;
  currentProfilePicture: string | null;
  uploadProfilePicture: (file: File) => Promise<void>;
  updateUsername: (username: string) => Promise<void>;
  logout: () => Promise<void>;
}

/**
 * @function useProfile
 * @description A custom React hook for managing all profile-related operations,
 * including uploading profile pictures, updating usernames, and logging out.
 * It integrates with `useAuthStore` to access and update the current user's state,
 * and with `react-toastify` for user feedback.
 *
 * @returns {ProfileState} An object containing profile data, loading states, and action functions.
 */
export const useProfile = (): ProfileState => {
  // Destructure relevant state and functions from the authentication store.
  // `setCurrentUser` is crucial for updating the local user state after profile changes.
  const { currentUser, loadingAuth, logoutUser: authStoreLogout, setCurrentUser } = useAuthStore();

  // State variables to manage loading indicators for different operations.
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Derive profile data directly from `currentUser` in the auth store.
  const profileData = currentUser;
  // Use `loadingAuth` from the auth store to indicate initial profile loading.
  const isLoadingProfile = loadingAuth;

  // Determine the current profile picture URL for display.
  const currentProfilePicture = profileData?.profile_picture || null;

  /**
   * @function uploadProfilePicture
   * @description A memoized callback function to handle the upload of a new profile picture.
   * It calls the `uploadAndSetProfilePicture` service, updates loading state,
   * shows toasts for success/error, and updates the `currentUser` in the auth store.
   *
   * @param {File} file - The image file to upload.
   * @returns {Promise<void>} A promise that resolves when the upload and update are complete.
   * @throws {Error} If no authenticated user is found or if the upload/update fails.
   */
  const uploadProfilePicture = useCallback(async (file: File): Promise<void> => {
    if (!currentUser) {
      toast.error('No authenticated user found to upload profile picture.');
      throw new Error('No authenticated user found.');
    }

    setIsUploadingPicture(true); 
    try {
      // Call the service to upload and update the picture in Firebase Auth and Firestore.
      const newPictureUrl = await uploadAndSetProfilePicture(currentUser.id, file);
      toast.success('Profile picture updated successfully!');

      // IMPORTANT: Manually update the `currentUser` in the `authStore` with the new URL.
      // This ensures the UI reflects the change immediately without a full page reload or re-authentication.
      setCurrentUser({ ...currentUser, profile_picture: newPictureUrl });

    } catch (error: any) {
      console.error('Profile picture upload error:', error.message);
      toast.error(`Failed to upload profile picture: ${error.message}`);
      throw error;
    } finally {
      setIsUploadingPicture(false);
    }
  }, [currentUser, setCurrentUser]);

  /**
   * @function updateUsername
   * @description A memoized callback function to handle the update of the user's username.
   * It calls the `updateUsernameInFirestoreAndAuth` service, updates loading state,
   * shows toasts for success/error, and updates the `currentUser` in the auth store.
   *
   * @param {string} username - The new username.
   * @returns {Promise<void>} A promise that resolves when the username update is complete.
   * @throws {Error} If no authenticated user is found or if the update fails.
   */
  const updateUsername = useCallback(async (username: string): Promise<void> => {
    if (!currentUser) {
      toast.error('No authenticated user found for username update.');
      throw new Error('No authenticated user found.');
    }

    setIsUpdatingUsername(true);
    try {
      // Call the service to update the username in Firebase Auth and Firestore.
      await updateUsernameInFirestoreAndAuth(currentUser.id, username);
      toast.success('Username updated successfully!');

      //Manually update the `currentUser` in the `authStore` with the new username.
      // This ensures the UI reflects the change immediately.
      setCurrentUser({ ...currentUser, username: username });

    } catch (error: any) {
      console.error('Error updating username:', error.message);
      toast.error(`Username update failed: ${error.message || 'Unknown error'}`);
      throw error; // Re-throw for upstream error handling.
    } finally {
      setIsUpdatingUsername(false);
    }
  }, [currentUser, setCurrentUser]);

  /**
   * @function logout
   * @description A memoized callback function to handle user logout.
   * It calls the `logoutUser` function from the auth store, updates loading state,
   * and shows toasts for success/error.
   *
   * @returns {Promise<void>} A promise that resolves when the logout is complete.
   * @throws {Error} If the logout operation fails.
   */
  const logout = useCallback(async (): Promise<void> => {
    setIsLoggingOut(true);
    try {
      await authStoreLogout();
      toast.info('You have been signed out.');
    } catch (error: any) {
      console.error('Logout failed:', error);
      toast.error(error.message || 'Failed to log out. Please try again.');
      throw error; 
    } finally {
      setIsLoggingOut(false);
    }
  }, [authStoreLogout]);
  
  // Return the state and action functions for components to consume.
  return {
    profileData,
    isLoadingProfile,
    isUpdatingUsername,
    isUploadingPicture,
    isLoggingOut,
    currentProfilePicture,
    uploadProfilePicture,
    updateUsername,
    logout,
  };
};