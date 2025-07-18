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

const profileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
});

type ProfileFormInputs = z.infer<typeof profileSchema>;

const ProfilePage: React.FC = () => {
  const { currentUser } = useAuthStore();

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

  const [showConfirmSaveDialog, setShowConfirmSaveDialog] = useState(false);
  const [showConfirmLogoutDialog, setShowConfirmLogoutDialog] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    getValues,
  } = useForm<ProfileFormInputs>({
    resolver: zodResolver(profileSchema),
  });

  // This useEffect re-populates the username field when profileData changes
  // or after a username update is complete.
  useEffect(() => {
    if (profileData && !isUpdatingUsername) {
      setValue('username', profileData.username);
    }
  }, [profileData, isUpdatingUsername, setValue]);

  // Handler for immediate profile picture upload
  const handleProfilePictureChange = async (file: File) => {
    try {
      await uploadProfilePicture(file); // Trigger the upload and profile update
    } catch (error) {
      // Error toast is handled in useProfile hook
    }
  };

  // This function now only handles username save confirmation
  const handleSaveConfirmation: SubmitHandler<ProfileFormInputs> = async () => {
    const currentUsername = getValues('username');
    const hasUsernameChanged = profileData?.username !== currentUsername;

    if (hasUsernameChanged) {
      setShowConfirmSaveDialog(true);
    } else {
      toast.info('No changes detected to save.', { theme: 'colored' });
    }
  };

  // This function now only confirms and triggers username update
  const confirmSave = async () => {
    setShowConfirmSaveDialog(false);

    if (!currentUser) {
      toast.error('No authenticated user found.');
      return;
    }

    const data = getValues();
    try {
      await updateUsername(data.username);
    } catch (error: any) {
      console.error('Username update submission error:', error.message);
    }
  };

  const handleLogoutConfirmation = () => {
    setShowConfirmLogoutDialog(true);
  };

  const confirmLogout = async () => {
    setShowConfirmLogoutDialog(false);
    try {
      await logout();
    } catch (error: any) {
      console.error('Error logging out:', error.message);
    }
  };

  const isAnyLoading = isLoadingProfile || isUpdatingUsername || isUploadingPicture || isLoggingOut;

  // Define motion props based on screen size
  const isMobile = window.innerWidth < 768;
  const containerMotionProps = isMobile
    ? {} // No animations on mobile
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.5 },
      };
  const contentMotionProps = isMobile
    ? {} // No animations on mobile
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
          <div className={`absolute inset-0 z-0 opacity-10 ${isMobile ? '' : 'animate-blob'}`}>
            <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary-light rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
            <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-accent rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
          </div>

          {isLoadingProfile ? (
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

      <Dialog
        isOpen={showConfirmSaveDialog}
        onClose={() => setShowConfirmSaveDialog(false)}
        onConfirm={confirmSave}
        title="Confirm Save Changes"
        message="Are you sure you want to save these changes to your username?"
        confirmText="Save Username"
        isConfirming={isUpdatingUsername}
      />

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