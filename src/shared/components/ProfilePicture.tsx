import React, { useState, useEffect } from 'react';
import { FiCamera } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { getDefaultAvatar } from '../utils/helpers';

/**
 * @interface ProfilePictureProps
 * @description Defines the props for the ProfilePicture component.
 * @property {string | null | undefined} src - The URL of the profile picture to display. If null/undefined, a default avatar is shown.
 * @property {string} alt - The alt text for the image, important for accessibility.
 * @property {number} [size=32] - The size of the profile picture in Tailwind's `w-` and `h-` units (e.g., `size=32` translates to `w-32 h-32`).
 * @property {boolean} [editable=false] - If true, displays an overlay with a camera icon on hover, allowing the user to upload a new picture.
 * @property {(file: File) => void} [onImageChange] - Callback function triggered when a new image file is selected (only when `editable` is true).
 * @property {string} [className=''] - Additional Tailwind CSS classes to apply to the main container div.
 * @property {boolean} [isLoading=false] - If true, displays a loading spinner overlay on the profile picture.
 */
interface ProfilePictureProps {
  src?: string | null;
  alt: string;
  size?: number;
  editable?: boolean;
  onImageChange?: (file: File) => void;
  className?: string;
  isLoading?: boolean;
}

/**
 * @function ProfilePicture
 * @description A versatile React component for displaying user profile pictures.
 * It supports displaying a default avatar, an editable mode for uploading new pictures,
 * and a loading state. Uses Framer Motion for subtle hover animations.
 *
 * @param {ProfilePictureProps} props - The props for the component.
 * @returns {React.FC<ProfilePictureProps>} A React functional component.
 */
const ProfilePicture: React.FC<ProfilePictureProps> = ({
  src,
  alt,
  size = 32,
  editable = false,
  onImageChange,
  className = '',
  isLoading = false,
}) => {
  // State to hold the URL of a newly selected image file for immediate preview before upload.
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  /**
   * Effect hook to manage `localPreviewUrl`.
   * - Resets `localPreviewUrl` if the external `src` prop changes to ensure `src` takes precedence.
   * - Clears `localPreviewUrl` if `src` becomes null or undefined, indicating no external image.
   * This ensures the component correctly displays either an uploaded preview, the provided src, or the default avatar.
   */
  useEffect(() => {
    // If a new src is provided and it's different from the current local preview, clear local preview.
    if (src && src !== localPreviewUrl) {
      setLocalPreviewUrl(null);
    }

    // If src is removed (e.g., user deletes their picture) and there's a local preview, clear it.
    if (!src && localPreviewUrl) {
      setLocalPreviewUrl(null);
    }
  }, [src, localPreviewUrl]); // Depend on src and localPreviewUrl to react to changes.

  /**
   * Handles the file input change event when a new profile picture is selected.
   * It reads the selected file as a Data URL for immediate local preview and
   * then calls the `onImageChange` prop with the File object.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e - The change event from the file input.
   */
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();

      reader.onload = (event) => {
        // Set local preview URL to display the newly selected image instantly.
        const result = event.target?.result as string;
        setLocalPreviewUrl(result);
        // Call the parent's handler with the actual File object.
        if (onImageChange) {
          onImageChange(file);
        }
      };
      reader.readAsDataURL(file); // Read the file as a Data URL.
    }
  };

  // Determine the default avatar to show if no `src` is provided.
  // Assumes `getDefaultAvatar` returns a URL based on the first letter of the `alt` text.
  const defaultAvatar = getDefaultAvatar(alt.charAt(0));
  // Decide which image to display: local preview (if active), then `src`, then `defaultAvatar`.
  const imageToDisplay = localPreviewUrl || src || defaultAvatar;

  // Calculate the size of the camera icon relative to the profile picture size.
  const cameraIconSize = size / 2;

  return (
    <div className={`relative flex-shrink-0 rounded-full overflow-hidden
                    w-${size} h-${size}
                    ${editable ? 'border-2 border-primary-light shadow-lg' : ''}
                    ${className}`}>
      <motion.img
        src={imageToDisplay}
        alt={alt}
        className="w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.src = defaultAvatar;
        }}
        // Framer Motion hover animations.
        whileHover={editable ? { scale: 1.08, opacity: 0.9 } : { scale: 1.05 }}
        transition={{ duration: 0.2 }}
      />
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 rounded-full">
          <svg
            className="animate-spin h-8 w-8 text-white"
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
        </div>
      )}
      {/* Editable overlay with camera icon and file input */}
      {editable && !isLoading && (
        <>
          <label
            htmlFor="profilePictureUpload"
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 text-white cursor-pointer
                       opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-full"
            aria-label="Change profile picture" 
          >
            <FiCamera size={cameraIconSize} className="text-white" />
          </label>
          <input
            type="file"
            id="profilePictureUpload"
            className="hidden"
            accept="image/*"
            onChange={handleImageChange}
            aria-label="Upload new profile picture"
          />
        </>
      )}
    </div>
  );
};

export default ProfilePicture;