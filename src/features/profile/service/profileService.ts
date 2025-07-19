import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile as updateFirebaseAuthProfile, signOut } from 'firebase/auth';
import { auth, db } from '../../../shared/libs/firebase'; 
import { resizeImageFile } from '../../../shared/utils/imageUtils';
import { uploadFileToCloudinary } from '../../../shared/utils/cloudinaryUtils';
import { FILE_UPLOAD_LIMITS } from '../../../shared/constants/appConstants';

// Cloudinary upload preset from environment variables
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

/**
 * @function uploadAndSetProfilePicture
 * @description Uploads a given image file to Cloudinary, resizes it,
 * then updates the user's profile picture URL in both Firebase Authentication
 * and Firestore.
 *
 * @param {string} userId - The ID of the user whose profile picture is being updated.
 * @param {File} file - The image file to be uploaded.
 * @returns {Promise<string>} A promise that resolves with the public URL of the uploaded image.
 * @throws {Error} If the current authenticated user does not match the provided userId,
 * or if any step of the upload/update process fails.
 */
export const uploadAndSetProfilePicture = async (userId: string, file: File): Promise<string> => {
  const currentUser = auth.currentUser;

  // Validate that an authenticated user exists and matches the target userId.
  if (!currentUser || currentUser.uid !== userId) {
    throw new Error('Authenticated user mismatch or no user found for profile picture update.');
  }

  // Define the Cloudinary folder path for profile pictures.
  const folderPath = `profile_pictures/${userId}`;

  try {
    // 1. Resize the image file to optimal dimensions (400x400) and quality (0.8 compression).
    const resizedFile = await resizeImageFile(file, 400, 400, 0.8);

    // 2. Upload the resized file to Cloudinary.
    const publicUrl = await uploadFileToCloudinary(
      resizedFile,
      CLOUDINARY_UPLOAD_PRESET,
      folderPath,
      'image', // Specify file type as 'image'
      FILE_UPLOAD_LIMITS.IMAGE_MAX_SIZE_MB 
    );

    // 3. Update the `photoURL` in Firebase Authentication.
    await updateFirebaseAuthProfile(currentUser, {
      photoURL: publicUrl,
    });

    // 4. Update the `profile_picture` field in the user's Firestore document.
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      profile_picture: publicUrl,
    });

    return publicUrl;
  } catch (error: any) {
    console.error('uploadAndSetProfilePicture caught error:', error.message);
    throw error;
  }
};

/**
 * @function updateUsernameInFirestoreAndAuth
 * @description Updates the user's display name in Firebase Authentication
 * and their username in their corresponding Firestore document.
 *
 * @param {string} userId - The ID of the user whose username is being updated.
 * @param {string} username - The new username.
 * @returns {Promise<void>} A promise that resolves when both updates are complete.
 * @throws {Error} If the current authenticated user does not match the provided userId,
 * or if either the Firebase Auth or Firestore update fails.
 */
export const updateUsernameInFirestoreAndAuth = async (userId: string, username: string): Promise<void> => {
  const currentUser = auth.currentUser;

  // Validate that an authenticated user exists and matches the target userId.
  if (!currentUser || currentUser.uid !== userId) {
    throw new Error('Authenticated user mismatch or no user found for username update.');
  }

  try {
    // 1. Update the `displayName` in Firebase Authentication.
    await updateFirebaseAuthProfile(currentUser, {
      displayName: username,
    });

    // 2. Update the `username` field in the user's Firestore document.
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      username,
    });
  } catch (error: any) {
    // Log and re-throw any errors.
    console.error('updateUsernameInFirestoreAndAuth caught error:', error.message);
    throw error;
  }
};

/**
 * @function logoutUser
 * @description Logs out the current user from Firebase Authentication
 * and optionally updates their online status to false in Firestore.
 *
 * @param {string | undefined} userId - The ID of the user to log out. Optional, as Firebase `signOut` doesn't require it, but needed for status update.
 * @param {(isOnline: boolean) => Promise<void>} setOnlineStatusFn - A function provided to update the user's online status (e.g., from a shared service or hook).
 * @returns {Promise<void>} A promise that resolves when the user is successfully logged out and status updated (if userId provided).
 * @throws {Error} If the logout or status update operation fails.
 */
export const logoutUser = async (userId: string | undefined, setOnlineStatusFn: (isOnline: boolean) => Promise<void>): Promise<void> => {
  try {
    // If a userId is provided, attempt to set the user's online status to false.
    if (userId) {
      await setOnlineStatusFn(false);
    }
    // Perform Firebase authentication sign out.
    await signOut(auth);
  } catch (error: any) {
    console.error('logoutUser caught error:', error.message);
    throw error;
  }
};