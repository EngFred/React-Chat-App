import React from 'react';
import Button from '../../../shared/components/Button';

/**
 * @interface ProfileActionsProps
 * @description Defines the props for the ProfileActions component.
 * @property {() => void} handleLogoutConfirmation - Callback to open the logout confirmation dialog.
 * @property {boolean} isUpdatingUsername - A boolean indicating if the username update operation is in progress.
 * @property {boolean} isLoggingOut - A boolean indicating if the logout operation is in progress.
 * @property {boolean} isAnyLoading - A general boolean indicating if any significant operation (username update, logout, initial profile load) is in progress, used to disable buttons.
 */
interface ProfileActionsProps {
  handleLogoutConfirmation: () => void;
  isUpdatingUsername: boolean;
  isLoggingOut: boolean;
  isAnyLoading: boolean;
}

/**
 * @function ProfileActions
 * @description A sub-component for the Profile page that renders the action buttons:
 * "Save Changes" for updating the username and "Logout".
 * It manages the loading states for these buttons, preventing multiple submissions.
 *
 * @param {ProfileActionsProps} props - The props for the component.
 * @returns {React.FC<ProfileActionsProps>} A React functional component.
 */
const ProfileActions: React.FC<ProfileActionsProps> = ({
  handleLogoutConfirmation,
  isUpdatingUsername,
  isLoggingOut,
  isAnyLoading,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 pt-4">
      {/* Save Changes Button */}
      <Button
        type="submit" // This button triggers form submission
        disabled={isAnyLoading} // Disable if any loading state is active
        className="w-full sm:w-auto flex-1 py-3 px-6 rounded-lg font-semibold text-lg transition-all duration-200 ease-in-out hover:scale-105"
        isLoading={isUpdatingUsername} // Show loading spinner if username is updating
      >
        {isUpdatingUsername ? null : 'Save Changes'} {/* Hide text when loading, spinner takes over */}
      </Button>
      {/* Logout Button */}
      <Button
        variant="danger" // Use the danger variant for logout
        onClick={handleLogoutConfirmation} // Trigger the logout confirmation dialog
        disabled={isAnyLoading} // Disable if any loading state is active
        className="w-full sm:w-auto flex-1 py-3 px-6 rounded-lg font-semibold text-lg transition-all duration-200 ease-in-out hover:scale-105"
        isLoading={isLoggingOut} // Show loading spinner if logout is in progress
      >
        {isLoggingOut ? null : 'Logout'} {/* Hide text when loading, spinner takes over */}
      </Button>
    </div>
  );
};

export default ProfileActions;