/**
 * Validates if a file's size is within the specified limit.
 * @param file The File object to validate.
 * @param maxSizeMB The maximum allowed size in megabytes.
 * @returns true if the file size is within the limit, false otherwise.
 */
export const validateFileSize = (file: File, maxSizeMB: number): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024; // Convert MB to bytes
  return file.size <= maxSizeBytes;
};

/**
 * Converts bytes to a human-readable format (e.g., KB, MB, GB).
 * @param bytes The number of bytes.
 * @param decimals The number of decimal places to include.
 * @returns A string representing the file size.
 */
export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};