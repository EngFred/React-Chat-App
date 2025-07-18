import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useAuthStore } from '../../../shared/store/authStore';
import type { User } from '../../../shared/types/user';

import {
  uploadAndSetProfilePicture,
  updateUsernameInFirestoreAndAuth,
} from '../service/profileService';

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

export const useProfile = (): ProfileState => {
  const { currentUser, loadingAuth, logoutUser: authStoreLogout, setCurrentUser } = useAuthStore(); // Destructure setCurrentUser

  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const profileData = currentUser;
  const isLoadingProfile = loadingAuth;

  const currentProfilePicture = profileData?.profile_picture || null;

  const uploadProfilePicture = useCallback(async (file: File): Promise<void> => {
    if (!currentUser) {
      toast.error('No authenticated user found to upload profile picture.');
      throw new Error('No authenticated user found.');
    }

    setIsUploadingPicture(true);
    try {
      const newPictureUrl = await uploadAndSetProfilePicture(currentUser.id, file);
      toast.success('Profile picture updated successfully!');

      // Manually update currentUser in authStore with the new picture URL
      setCurrentUser({ ...currentUser, profile_picture: newPictureUrl });

    } catch (error: any) {
      console.error('Profile picture upload error:', error.message);
      toast.error(`Failed to upload profile picture: ${error.message}`);
      throw error;
    } finally {
      setIsUploadingPicture(false);
    }
  }, [currentUser, setCurrentUser]); // Add setCurrentUser to dependencies

  const updateUsername = useCallback(async (username: string): Promise<void> => {
    if (!currentUser) {
      toast.error('No authenticated user found for username update.');
      throw new Error('No authenticated user found.');
    }

    setIsUpdatingUsername(true);
    try {
      await updateUsernameInFirestoreAndAuth(currentUser.id, username);
      toast.success('Username updated successfully!');

      // Manually update currentUser in authStore with the new username
      setCurrentUser({ ...currentUser, username: username });

    } catch (error: any) {
      console.error('Error updating username:', error.message);
      toast.error(`Username update failed: ${error.message || 'Unknown error'}`);
      throw error;
    } finally {
      setIsUpdatingUsername(false);
    }
  }, [currentUser, setCurrentUser]); // Add setCurrentUser to dependencies

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