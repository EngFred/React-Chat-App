import React from 'react';
import Button from '../../../shared/components/Button';

interface ProfileActionsProps {
  handleLogoutConfirmation: () => void;
  isUpdatingUsername: boolean;
  isLoggingOut: boolean;
  isAnyLoading: boolean; // General loading state to disable all actions
}

const ProfileActions: React.FC<ProfileActionsProps> = ({
  handleLogoutConfirmation,
  isUpdatingUsername,
  isLoggingOut,
  isAnyLoading,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 pt-4">
      <Button
        type="submit" // This button will trigger the parent form's onSubmit
        disabled={isAnyLoading}
        className="w-full sm:w-auto flex-1 py-3 px-6 rounded-lg font-semibold text-lg transition-all duration-200 ease-in-out hover:scale-105"
        isLoading={isUpdatingUsername}
        // No loadingText needed, as children will be null when loading
      >
        {isUpdatingUsername ? null : 'Save Changes'} {/* Conditionally render text */}
      </Button>
      <Button
        variant="danger"
        onClick={handleLogoutConfirmation}
        disabled={isAnyLoading}
        className="w-full sm:w-auto flex-1 py-3 px-6 rounded-lg font-semibold text-lg transition-all duration-200 ease-in-out hover:scale-105"
        isLoading={isLoggingOut}
        // No loadingText needed, as children will be null when loading
      >
        {isLoggingOut ? null : 'Logout'} {/* Conditionally render text */}
      </Button>
    </div>
  );
};

export default ProfileActions;