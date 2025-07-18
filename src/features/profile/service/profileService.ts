import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile as updateFirebaseAuthProfile, signOut } from 'firebase/auth';
import { auth, db } from '../../../shared/libs/firebase';
import { resizeImageFile } from '../../../shared/utils/imageUtils';
import { uploadFileToCloudinary } from '../../../shared/utils/cloudinaryUtils';
import { FILE_UPLOAD_LIMITS } from '../../../shared/constants/appConstants';

const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const uploadAndSetProfilePicture = async (userId: string, file: File): Promise<string> => {
  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.uid !== userId) {
    throw new Error('Authenticated user mismatch or no user found for profile picture update.');
  }

  const folderPath = `profile_pictures/${userId}`;

  try {
    const resizedFile = await resizeImageFile(file, 400, 400, 0.8);

    // For profile pictures (which are images), we pass IMAGE_MAX_SIZE_MB (2 MB)
    const publicUrl = await uploadFileToCloudinary(
      resizedFile,
      CLOUDINARY_UPLOAD_PRESET,
      folderPath,
      'image',
      FILE_UPLOAD_LIMITS.IMAGE_MAX_SIZE_MB
    );

    await updateFirebaseAuthProfile(currentUser, {
      photoURL: publicUrl,
    });

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

export const updateUsernameInFirestoreAndAuth = async (userId: string, username: string): Promise<void> => {
  const currentUser = auth.currentUser;

  if (!currentUser || currentUser.uid !== userId) {
    throw new Error('Authenticated user mismatch or no user found for username update.');
  }

  try {
    await updateFirebaseAuthProfile(currentUser, {
      displayName: username,
    });

    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      username,
    });
  } catch (error: any) {
    console.error('updateUsernameInFirestoreAndAuth caught error:', error.message);
    throw error;
  }
};

export const logoutUser = async (userId: string | undefined, setOnlineStatusFn: (isOnline: boolean) => Promise<void>): Promise<void> => {
  try {
    if (userId) {
      await setOnlineStatusFn(false);
    }
    await signOut(auth);
  } catch (error: any) {
    console.error('logoutUser caught error:', error.message);
    throw error;
  }
};