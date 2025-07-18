import React from 'react';
import ProfilePicture from '../../../shared/components/ProfilePicture';
import type { User } from '../../../shared/types/user';

interface ProfilePictureSectionProps {
  profileData: User | null;
  currentProfilePicture: string | null;
  handleProfilePictureChange: (file: File) => Promise<void>;
  isUploadingPicture: boolean;
}

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
        size={32} // Large size for profile page
        editable
        onImageChange={handleProfilePictureChange}
        isLoading={isUploadingPicture}
      />
      <p className="text-sm text-text-secondary mt-3 font-light">Click to change profile picture</p>
    </div>
  );
};

export default ProfilePictureSection;