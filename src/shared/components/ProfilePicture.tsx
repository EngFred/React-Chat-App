import React, { useState, useEffect } from 'react';
import { FiCamera } from 'react-icons/fi';
import { motion } from 'framer-motion';

interface ProfilePictureProps {
  src?: string | null;
  alt: string;
  size?: number; // Tailwind's size unit (e.g., 32 for w-32 h-32)
  editable?: boolean;
  onImageChange?: (file: File) => void; // Simplified: only pass the File
  className?: string;
  isLoading?: boolean; // New prop for loading state
}

const ProfilePicture: React.FC<ProfilePictureProps> = ({
  src,
  alt,
  size = 32, // Default size for larger display on profile page
  editable = false,
  onImageChange,
  className = '',
  isLoading = false, // Default to false
}) => {
  // Use a local state for preview only if a new file is selected
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  // When the external src changes (e.g., after successful upload), clear local preview
  useEffect(() => {
    // If the external src updates and is different from the current local preview (meaning new image is live),
    // or if the src becomes null (e.g., user deletes profile pic, though not implemented here)
    if (src && src !== localPreviewUrl) {
      setLocalPreviewUrl(null); // Clear local preview if external src updates
    }
    // Also, if src becomes null/undefined but localPreviewUrl is still set, clear it.
    if (!src && localPreviewUrl) {
      setLocalPreviewUrl(null);
    }
  }, [src]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setLocalPreviewUrl(result); // Set local preview
        if (onImageChange) {
          onImageChange(file); // Only pass the File
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Generate a consistent avatar URL with a random background for better aesthetics
  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(alt || 'U')}&background=random&color=fff&size=128`;
  const imageToDisplay = localPreviewUrl || src || defaultAvatar;

  // Calculate icon size relative to image size
  const cameraIconSize = size / 2; // Half the image size for the camera icon

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
        whileHover={editable ? { scale: 1.08, opacity: 0.9 } : { scale: 1.05 }}
        transition={{ duration: 0.2 }}
      />
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
      {editable && !isLoading && (
        <>
          <label
            htmlFor="profilePictureUpload"
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 text-white cursor-pointer
                       opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-full"
          >
            <FiCamera size={cameraIconSize} className="text-white" />
          </label>
          <input
            type="file"
            id="profilePictureUpload"
            className="hidden"
            accept="image/*"
            onChange={handleImageChange}
          />
        </>
      )}
    </div>
  );
};

export default ProfilePicture;