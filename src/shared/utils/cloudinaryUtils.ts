import axios from 'axios';
import { validateFileSize, formatBytes } from './fileUtils'; // Import new file utils

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

/**
 * Generic function to upload a file to Cloudinary.
 * @param file The File object to upload.
 * @param uploadPreset The Cloudinary upload preset name.
 * @param folderPath The target folder in Cloudinary.
 * @param resourceType The type of resource ('image', 'video', 'raw', or 'auto'). Defaults to 'auto'.
 * @param maxSizeMB Optional: Maximum allowed file size in MB. If exceeded, throws an error.
 * @returns A Promise that resolves with the secure URL of the uploaded file.
 */
export const uploadFileToCloudinary = async (
  file: File,
  uploadPreset: string,
  folderPath: string,
  resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto',
  maxSizeMB?: number // New optional parameter
): Promise<string> => {
  if (!CLOUDINARY_CLOUD_NAME) {
    throw new Error('Cloudinary Cloud Name is not configured.');
  }
  if (!uploadPreset) {
    throw new Error('Cloudinary Upload Preset is required for upload.');
  }

  // Perform file size validation before proceeding with upload
  if (maxSizeMB !== undefined && !validateFileSize(file, maxSizeMB)) {
    throw new Error(`File size exceeds the limit of ${maxSizeMB} MB. Current size: ${formatBytes(file.size)}`);
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', folderPath);

  try {
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.secure_url;
  } catch (error: any) {
    const errorMessage = error.response?.data?.error?.message || error.message || 'Unknown error during Cloudinary upload.';
    console.error('uploadFileToCloudinary caught error:', errorMessage);
    throw new Error(errorMessage);
  }
};