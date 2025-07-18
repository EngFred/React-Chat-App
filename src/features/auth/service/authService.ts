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
 * Signs in a user with email and password using Firebase Auth.
 * @param email The user's email.
 * @param password The user's password.
 */
export const signInUser = async (email: string, password: string): Promise<void> => {
  console.log('[AuthService] signInUser: Attempting Firebase sign-in.');
  try {
    // Firebase signInWithEmailAndPassword handles authentication
    await signInWithEmailAndPassword(auth, email, password);
    // console.log('[AuthService] signInUser: Firebase sign-in successful. User:', userCredential.user.uid);
    console.log('[AuthService] signInUser: Firebase sign-in request sent successfully.');
  } catch (error: any) {
    console.error('[AuthService] signInUser: Firebase sign-in error:', error.message);
    throw error; // Re-throw the error for higher-level handling (e.g., in hooks)
  }
};

/**
 * Registers a new user with email and password, and creates their profile in Firestore.
 * @param username The desired username.
 * @param email The user's email.
 * @param password The user's password.
 */
export const signUpUser = async (username: string, email: string, password: string): Promise<void> => {
  console.log('[AuthService] signUpUser: Attempting Firebase sign-up.');
  try {
    // Step 1: Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (!user) {
      console.error('[AuthService] signUpUser: User creation failed: No user object returned from Firebase Auth.');
      throw new Error('User creation failed: No user object returned from Firebase.');
    }

    // Step 2: Update Firebase Auth user's profile with username and profile picture
    const profilePicture = getDefaultAvatar(username);
    await updateProfile(user, {
      displayName: username,
      photoURL: profilePicture,
    });
    console.log('[AuthService] signUpUser: Firebase Auth user created and profile updated.');

    // Step 3: Create user profile document in Firestore
    console.log('[AuthService] signUpUser: Attempting to insert user profile into Firestore.');
    const userDocRef = doc(db, 'users', user.uid); // Reference to the user's document in 'users' collection

    const userProfileData: User = {
      id: user.uid,
      email: user.email || '', // Email might be null/undefined during initial auth, but should be there for email/password
      username: username,
      profile_picture: profilePicture,
      is_online: true, // Assume online upon successful registration
      created_at: new Date().toISOString(), // Store as ISO string
      last_seen: null // New users are online, so no last_seen
    };

    // Use setDoc to create or overwrite the document with the user's UID as the document ID
    await setDoc(userDocRef, userProfileData);

    console.log('[AuthService] signUpUser: User successfully registered in Auth and profile created in Firestore.');
  } catch (error: any) {
    console.error('[AuthService] signUpUser: Firebase sign-up or profile creation error:', error.message);
    // Firebase Auth errors have specific codes you might want to handle:
    // e.g., 'auth/email-already-in-use', 'auth/weak-password'
    throw error;
  }
};