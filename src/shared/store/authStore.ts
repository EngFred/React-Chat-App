import { create } from 'zustand';
import { toast } from 'react-toastify';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../libs/firebase';
import type { User } from '../types/user';
import { getDefaultAvatar } from '../utils/helpers';

/**
 * Defines the shape of the authentication state and actions within the Zustand store.
 */
interface AuthState {
  currentUser: User | null;
  loadingAuth: boolean;
  setCurrentUser: (user: User | null) => void;
  setLoadingAuth: (isLoading: boolean) => void;
  setOnlineStatus: (isOnline: boolean) => Promise<void>;
  initializeAuthListener: () => void;
  logoutUser: () => Promise<void>;
}

let onlineStatusTimeout: NodeJS.Timeout | null = null;
let authUnsubscribe: (() => void) | null = null;

/**
 * `useAuthStore` is a Zustand store managing the global authentication state.
 * It integrates with Firebase Authentication to listen for auth state changes,
 * syncs user profiles with Firestore, and handles user online/offline presence.
 */
export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  loadingAuth: true,

  /**
   * Manually sets the current authenticated user in the store's state.
   * This is typically used internally by the auth listener or other auth-related processes.
   * @param user The User object or null if no user is authenticated.
   */
  setCurrentUser: (user: User | null) => {
    console.log('[AuthStore] setCurrentUser: Manually setting currentUser:', user?.id || 'null');
    set({ currentUser: user });
  },

  /**
   * Manually sets the authentication loading state in the store.
   * This indicates whether the app is currently checking the user's authentication status.
   * @param isLoading True if authentication state is loading, false otherwise.
   */
  setLoadingAuth: (isLoading: boolean) => {
    console.log('[AuthStore] setLoadingAuth: Manually setting loadingAuth to', isLoading);
    set({ loadingAuth: isLoading });
  },

  /**
   * Initializes the Firebase Authentication state listener (`onAuthStateChanged`).
   * This function sets up a persistent listener that tracks changes in the user's
   * authentication status (login, logout). When a user logs in, it fetches or creates
   * their profile in Firestore and updates their `is_online` status. When a user logs out,
   * it sets their previous status to `offline` in Firestore.
   */
  initializeAuthListener: () => {
    if (authUnsubscribe) {
      authUnsubscribe();
      console.log('[AuthStore] initializeAuthListener: Previous auth listener unsubscribed.');
    }

    console.log('[AuthStore] initializeAuthListener: Setting up Firebase Auth listener.');
    authUnsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('[AuthStore] onAuthStateChanged triggered. User:', user?.uid || 'null');

      set({ loadingAuth: true });

      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);

          let userData: User;

          if (userDocSnap.exists()) {
            const firestoreProfile = userDocSnap.data() as User;
            userData = {
              id: user.uid,
              email: user.email || firestoreProfile.email,
              username: user.displayName || firestoreProfile.username,
              profile_picture: user.photoURL || firestoreProfile.profile_picture || getDefaultAvatar(firestoreProfile.username || 'User'),
              is_online: true,
              last_seen: null,
              created_at: firestoreProfile.created_at || user.metadata.creationTime || new Date().toISOString(),
            };

            if (!firestoreProfile.is_online) {
              console.log('[AuthStore] Auth listener: User was offline, setting to online in Firestore.');
              await updateDoc(userDocRef, {
                is_online: true,
                last_seen: null,
              });
            } else {
              console.log('[AuthStore] Auth listener: User already online in Firestore.');
            }

            console.log('[AuthStore] Auth listener: User profile found in Firestore. Setting currentUser.');
            set({ currentUser: userData });

          } else {
            console.warn('[AuthStore] Auth listener: Firebase Auth user found, but no profile in Firestore. Creating one.');

            const defaultUsername = user.displayName || user.email?.split('@')[0] || 'New User';
            const defaultProfilePicture = user.photoURL || getDefaultAvatar(defaultUsername);

            userData = {
              id: user.uid,
              email: user.email || '',
              username: defaultUsername,
              profile_picture: defaultProfilePicture,
              is_online: true,
              last_seen: null,
              created_at: user.metadata.creationTime || new Date().toISOString(),
            };
            await setDoc(userDocRef, userData);
            set({ currentUser: userData });
            toast.info('Your user profile has been created.');
          }
        } catch (error: any) {
          console.error('[AuthStore] Auth listener: Error fetching or syncing user profile from Firestore:', error);
          toast.error('Failed to load user profile data.');
          set({ currentUser: null });
        } finally {
          set({ loadingAuth: false });
        }
      } else {
        if (get().currentUser) {
          console.log('[AuthStore] Auth listener: User logged out, setting previous user offline in DB.');
          const prevUserId = get().currentUser?.id;
          if (prevUserId) {
            try {
              const userDocRef = doc(db, 'users', prevUserId);
              await updateDoc(userDocRef, {
                is_online: false,
                last_seen: new Date().toISOString()
              });
              console.log(`[AuthStore] Previous user ${prevUserId} set offline in Firestore.`);
            } catch (error) {
              console.error(`[AuthStore] Error setting previous user ${prevUserId} offline:`, error);
            }
          }
        }
        set({ currentUser: null, loadingAuth: false });
      }
    });
  },

  /**
   * Updates the online status of the current user in Firestore.
   * This function includes a debounce mechanism to prevent excessive writes to the database,
   * ensuring status updates are efficient.
   * @param isOnline True to set user online, false to set offline.
   * @returns A Promise that resolves when the status update is complete.
   */
  setOnlineStatus: async (isOnline: boolean): Promise<void> => {
    const currentUserId = get().currentUser?.id;

    if (!currentUserId) {
      console.warn('[AuthStore] setOnlineStatus: Cannot set online status: No authenticated user in store.');
      return;
    }

    if (onlineStatusTimeout) {
      clearTimeout(onlineStatusTimeout);
      onlineStatusTimeout = null;
    }

    onlineStatusTimeout = setTimeout(async () => {
      if (get().currentUser?.id !== currentUserId) {
          console.log('[AuthStore] setOnlineStatus: User changed during debounce, aborting status update for old user.');
          return;
      }

      console.log(`[AuthStore] setOnlineStatus: Attempting to set user ${currentUserId} online status to ${isOnline}.`);
      try {
        const userDocRef = doc(db, 'users', currentUserId);
        await updateDoc(userDocRef, {
          is_online: isOnline,
          last_seen: isOnline ? null : new Date().toISOString()
        });

        set((state) => {
          if (state.currentUser?.id === currentUserId) {
            console.log('[AuthStore] setOnlineStatus: Updating currentUser state in store.');
            return {
              currentUser: {
                ...state.currentUser,
                is_online: isOnline,
                last_seen: isOnline ? null : new Date().toISOString()
              }
            };
          }
          console.log('[AuthStore] setOnlineStatus: User changed in store, not updating old currentUser state.');
          return {};
        });
        console.log('[AuthStore] setOnlineStatus: Online status set to', isOnline);
      } catch (error: any) {
        console.error('[AuthStore] setOnlineStatus: Caught error updating online status:', error);
        toast.error(error.message || 'An unexpected error occurred while updating online status.');
      } finally {
        onlineStatusTimeout = null;
      }
    }, 300);
  },

  /**
   * Logs out the current user from Firebase Authentication.
   * This action also triggers the `onAuthStateChanged` listener, which will then
   * update the store state and set the user's status to `offline` in Firestore.
   * @returns A Promise that resolves when the user is successfully signed out.
   */
  logoutUser: async (): Promise<void> => {
    console.log('[AuthStore] logoutUser: Attempting to log out user.');
    try {
      await signOut(auth);
      toast.success('You have been logged out.');
      console.log('[AuthStore] logoutUser: Firebase signOut successful.');
    } catch (error: any) {
      console.error('[AuthStore] logoutUser: Error during Firebase signOut:', error);
      toast.error(error.message || 'Failed to log out.');
    }
  }
}));