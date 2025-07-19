/**
 * AuthService provides core functionalities for user authentication
 * by interacting directly with Firebase Authentication and Firestore.
 */
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

import { auth, db } from '../../../shared/libs/firebase';
import type { User } from '../../../shared/types/user';
import { getDefaultAvatar } from '../../../shared/utils/helpers';

/**
 * Authenticates a user with Firebase using their email and password.
 * @param email The user's email address.
 * @param password The user's password.
 * @returns A Promise that resolves if sign-in is successful.
 * @throws An error if Firebase authentication fails.
 */
export const signInUser = async (email: string, password: string): Promise<void> => {
  console.log('[AuthService] signInUser: Attempting Firebase sign-in.');
  try {
    await signInWithEmailAndPassword(auth, email, password);
    console.log('[AuthService] signInUser: Firebase sign-in request sent successfully.');
  } catch (error: any) {
    console.error('[AuthService] signInUser: Firebase sign-in error:', error.message);
    throw error;
  }
};

/**
 * Registers a new user with Firebase Authentication and creates their profile in Firestore.
 * This involves creating the user in Firebase Auth, updating their profile (displayName, photoURL),
 * and then persisting their initial user data to a 'users' collection in Firestore.
 * @param username The desired username for the new user.
 * @param email The user's email address.
 * @param password The user's password.
 * @returns A Promise that resolves if registration and profile creation are successful.
 * @throws An error if Firebase authentication or Firestore operation fails.
 */
export const signUpUser = async (username: string, email: string, password: string): Promise<void> => {
  console.log('[AuthService] signUpUser: Attempting Firebase sign-up.');
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (!user) {
      console.error('[AuthService] signUpUser: User creation failed: No user object returned from Firebase Auth.');
      throw new Error('User creation failed: No user object returned from Firebase.');
    }

    const profilePicture = getDefaultAvatar(username);
    await updateProfile(user, {
      displayName: username,
      photoURL: profilePicture,
    });
    console.log('[AuthService] signUpUser: Firebase Auth user created and profile updated.');

    console.log('[AuthService] signUpUser: Attempting to insert user profile into Firestore.');
    const userDocRef = doc(db, 'users', user.uid);

    const userProfileData: User = {
      id: user.uid,
      email: user.email || '',
      username: username,
      profile_picture: profilePicture,
      is_online: true,
      created_at: new Date().toISOString(),
      last_seen: null
    };

    await setDoc(userDocRef, userProfileData);

    console.log('[AuthService] signUpUser: User successfully registered in Auth and profile created in Firestore.');
  } catch (error: any) {
    console.error('[AuthService] signUpUser: Firebase sign-up or profile creation error:', error.message);
    throw error;
  }
};