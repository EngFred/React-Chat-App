import React from 'react';
import ProfilePicture from '../../../shared/components/ProfilePicture';
import type { User } from '../../../shared/types/user';

/**
 * @interface ProfilePictureSectionProps
 * @description Defines the props for the ProfilePictureSection component.
 * @property {User | null} profileData - The user's profile data, or null if not yet loaded.
 * @property {string | null} currentProfilePicture - The URL of the current profile picture.
 * @property {(file: File) => Promise<void>} handleProfilePictureChange - Function to call when a new profile picture is selected.
 * @property {boolean} isUploadingPicture - A boolean indicating if a profile picture is currently being uploaded.
 */
interface ProfilePictureSectionProps {
  profileData: User | null;
  currentProfilePicture: string | null;
  handleProfilePictureChange: (file: File) => Promise<void>;
  isUploadingPicture: boolean;
}

/**
 * @function ProfilePictureSection
 * @description A sub-component for the Profile page responsible for rendering the
 * user's profile picture and handling its selection/upload.
 * It uses the `ProfilePicture` shared component and passes relevant props for
 * editability and loading states.
 *
 * @param {ProfilePictureSectionProps} props - The props for the component.
 * @returns {React.FC<ProfilePictureSectionProps>} A React functional component.
 */
const ProfilePictureSection: React.FC<ProfilePictureSectionProps> = ({
  profileData,
  currentProfilePicture,
  handleProfilePictureChange,
  isUploadingPicture,
}) => {
  return (
    <div className="flex flex-col items-center mb-7">
      <ProfilePicture
        src={currentProfilePicture || undefined} 
        alt={profileData?.username || 'User'}
        size={32}
        editable
        onImageChange={handleProfilePictureChange}
        isLoading={isUploadingPicture}
      />
      <p className="text-sm text-text-secondary mt-3 font-light">Click to change profile picture</p>
    </div>
  );
};

export default ProfilePictureSection;