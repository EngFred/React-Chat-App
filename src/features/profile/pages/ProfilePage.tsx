import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'react-toastify';
import { useAuthStore } from '../../../shared/store/authStore';
import { motion } from 'framer-motion';
import Header from '../../../shared/components/Header';
import Dialog from '../../../shared/components/Dialog';
import { useProfile } from '../hooks/useProfile';
import ProfilePictureSection from '../components/ProfilePictureSection';
import ProfileFormFields from '../components/ProfileFormFields';
import ProfileActions from '../components/ProfileActions';

// Zod schema for validating the profile form inputs.
const profileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
});

// Infer the TypeScript type from the Zod schema for type safety.
type ProfileFormInputs = z.infer<typeof profileSchema>;

/**
 * @function ProfilePage
 * @description This component renders the user's profile editing page.
 * It allows users to update their profile picture and username, and also provides a logout option.
 * It integrates with `react-hook-form` for form management, `zod` for validation,
 * `react-toastify` for notifications, and `framer-motion` for animations.
 * It fetches and manages profile data using the `useProfile` custom hook.
 *
 * @returns {React.FC} A React functional component for the Profile page.
 */
const ProfilePage: React.FC = () => {
  // Get the current authenticated user from the authentication store.
  const { currentUser } = useAuthStore();

  // Custom hook for all profile-related logic (fetching, updating, uploading, logging out).
  const {
    profileData,
    isLoadingProfile,
    isUpdatingUsername,
    isUploadingPicture,
    isLoggingOut,
    currentProfilePicture,
    uploadProfilePicture,
    updateUsername,
    logout,
  } = useProfile();

  // State for controlling the visibility of confirmation dialogs.
  const [showConfirmSaveDialog, setShowConfirmSaveDialog] = useState(false);
  const [showConfirmLogoutDialog, setShowConfirmLogoutDialog] = useState(false);

  // `react-hook-form` setup for form handling.
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    getValues, // Used to get current form values without re-rendering.
  } = useForm<ProfileFormInputs>({
    resolver: zodResolver(profileSchema), // Integrate Zod for schema validation.
  });

  /**
   * Effect hook to populate the form fields with `profileData` once it's loaded.
   * Ensures that the form is pre-filled with the user's current username.
   * It also prevents resetting the form while an update is in progress.
   */
  useEffect(() => {
    if (profileData && !isUpdatingUsername) {
      setValue('username', profileData.username);
    }
  }, [profileData, isUpdatingUsername, setValue]); // Dependencies for the effect.

  /**
   * Handles the change event for the profile picture input.
   * It calls the `uploadProfilePicture` function from `useProfile` to upload the new file.
   * Error handling for the upload is managed within the `useProfile` hook.
   *
   * @param {File} file - The selected image file.
   */
  const handleProfilePictureChange = async (file: File) => {
    try {
      await uploadProfilePicture(file);
    } catch (error) {
      // Error toast is handled in useProfile hook, so no additional toast here.
    }
  };

  /**
   * Callback for form submission. It first checks if the username has actually changed.
   * If changes are detected, it opens a confirmation dialog before proceeding with the save.
   * If no changes, it shows an info toast.
   *
   * @param {ProfileFormInputs} data - The validated form data (username).
   */
  const handleSaveConfirmation: SubmitHandler<ProfileFormInputs> = async () => {
    const currentUsername = getValues('username');
    const hasUsernameChanged = profileData?.username !== currentUsername;

    if (hasUsernameChanged) {
      setShowConfirmSaveDialog(true);
    } else {
      toast.info('No changes detected to save.', { theme: 'colored' });
    }
  };

  /**
   * Confirms the save action after user confirmation in the dialog.
   * It calls the `updateUsername` function from `useProfile`.
   */
  const confirmSave = async () => {
    setShowConfirmSaveDialog(false); // Close the dialog.

    if (!currentUser) {
      toast.error('No authenticated user found.');
      return;
    }

    const data = getValues(); // Get the latest form values.
    try {
      await updateUsername(data.username);
    } catch (error: any) {
      console.error('Username update submission error:', error.message);
      // Toast for error is handled in useProfile.
    }
  };

  /**
   * Opens the logout confirmation dialog.
   */
  const handleLogoutConfirmation = () => {
    setShowConfirmLogoutDialog(true);
  };

  /**
   * Confirms the logout action after user confirmation in the dialog.
   * It calls the `logout` function from `useProfile`.
   */
  const confirmLogout = async () => {
    setShowConfirmLogoutDialog(false);
    try {
      await logout();
    } catch (error: any) {
      console.error('Error logging out:', error.message);
      // Toast for error is handled in useProfile.
    }
  };

  // Determine if any asynchronous operation is currently in progress to manage button states.
  const isAnyLoading = isLoadingProfile || isUpdatingUsername || isUploadingPicture || isLoggingOut;

  // Define Framer Motion props based on screen size for responsive animations.
  const isMobile = window.innerWidth < 768;
  const containerMotionProps = isMobile
    ? {} // No animations on mobile for container
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.5 },
      };
  const contentMotionProps = isMobile
    ? {} // No animations on mobile for content card
    : {
        initial: { opacity: 0, y: 50, scale: 0.95 },
        animate: { opacity: 1, y: 0, scale: 1 },
        transition: { duration: 0.6, ease: "easeOut" as const },
      };

  return (
    <motion.div
      className="flex flex-col min-h-screen bg-gradient-to-br from-background to-gray-900 text-text-primary font-sans"
      {...containerMotionProps}
    >
      <Header title="Edit Profile" backRoute="/settings" />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto flex justify-center items-center">
        <motion.div
          className="bg-card rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-lg border border-border-light
                     transform transition-all duration-300 hover:shadow-primary-glow backdrop-blur-sm bg-opacity-80
                     relative overflow-hidden"
          {...contentMotionProps}
        >
          {/* Animated background blobs for visual flair (desktop only) */}
          <div className={`absolute inset-0 z-0 opacity-10 ${isMobile ? '' : 'animate-blob'}`}>
            <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary-light rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
            <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-accent rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
          </div>

          {isLoadingProfile ? (
            // Loading state for initial profile data fetch.
            <div className="relative z-10 flex flex-col items-center justify-center py-12 text-text-secondary">
              <svg
                className="animate-spin h-10 w-10 text-primary mb-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <p className="text-lg font-medium">Loading profile data...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(handleSaveConfirmation)} className="relative z-10 space-y-7">
              <ProfilePictureSection
                profileData={profileData}
                currentProfilePicture={currentProfilePicture}
                handleProfilePictureChange={handleProfilePictureChange}
                isUploadingPicture={isUploadingPicture}
              />

              <ProfileFormFields
                register={register}
                errors={errors}
                currentUser={currentUser}
                isUpdatingUsername={isUpdatingUsername}
              />

              <ProfileActions
                handleLogoutConfirmation={handleLogoutConfirmation}
                isUpdatingUsername={isUpdatingUsername}
                isLoggingOut={isLoggingOut}
                isAnyLoading={isAnyLoading}
              />
            </form>
          )}
        </motion.div>
      </div>

      {/* Confirmation Dialog for Save Changes */}
      <Dialog
        isOpen={showConfirmSaveDialog}
        onClose={() => setShowConfirmSaveDialog(false)}
        onConfirm={confirmSave}
        title="Confirm Save Changes"
        message="Are you sure you want to save these changes to your username?"
        confirmText="Save Username"
        isConfirming={isUpdatingUsername}
      />

      {/* Confirmation Dialog for Logout */}
      <Dialog
        isOpen={showConfirmLogoutDialog}
        onClose={() => setShowConfirmLogoutDialog(false)}
        onConfirm={confirmLogout}
        title="Confirm Logout"
        message="Are you sure you want to log out?"
        confirmText="Logout"
        cancelText="Stay"
        variant="danger"
        isConfirming={isLoggingOut}
      />
    </motion.div>
  );
};

export default ProfilePage;