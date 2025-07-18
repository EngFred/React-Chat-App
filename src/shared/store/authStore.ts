import { create } from 'zustand';
import { toast } from 'react-toastify';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../libs/firebase';
import type { User } from '../types/user';
import { getDefaultAvatar } from '../utils/helpers';

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

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  loadingAuth: true,

  setCurrentUser: (user: User | null) => {
    console.log('[AuthStore] setCurrentUser: Manually setting currentUser:', user?.id || 'null');
    set({ currentUser: user });
  },

  setLoadingAuth: (isLoading: boolean) => {
    console.log('[AuthStore] setLoadingAuth: Manually setting loadingAuth to', isLoading);
    set({ loadingAuth: isLoading });
  },

  initializeAuthListener: () => {
    if (authUnsubscribe) {
      authUnsubscribe();
      console.log('[AuthStore] initializeAuthListener: Previous auth listener unsubscribed.');
    }

    console.log('[AuthStore] initializeAuthListener: Setting up Firebase Auth listener.');
    authUnsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('[AuthStore] onAuthStateChanged triggered. User:', user?.uid || 'null');
      
      set({ loadingAuth: true }); // Start loading when auth state changes

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
              is_online: true, // ASSUME ONLINE ON INITIAL LOAD
              last_seen: null, // ASSUME ONLINE ON INITIAL LOAD
              created_at: firestoreProfile.created_at || user.metadata.creationTime || new Date().toISOString(),
            };

            // Only update Firestore if the user was previously offline
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
              is_online: true, // New user is online
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
          set({ loadingAuth: false }); // Always set loadingAuth to false after auth state is determined
        }
      } else { // User is null (logged out or not authenticated)
        if (get().currentUser) { // Only attempt to set offline if a user was previously logged in
          console.log('[AuthStore] Auth listener: User logged out, setting previous user offline in DB.');
          // Directly call the update for the *previous* user's status, not the current one in store
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
        // Always reset currentUser to null and loadingAuth to false when no user
        set({ currentUser: null, loadingAuth: false });
      }
    });
  },

  // This setOnlineStatus is now primarily for explicit actions or visibility changes,
  // NOT for the initial load from onAuthStateChanged.
  setOnlineStatus: async (isOnline: boolean): Promise<void> => {
    const currentUserId = get().currentUser?.id;

    if (!currentUserId) {
      console.warn('[AuthStore] setOnlineStatus: Cannot set online status: No authenticated user in store.');
      return;
    }

    // Clear previous timeout to ensure only the latest call is processed
    if (onlineStatusTimeout) {
      clearTimeout(onlineStatusTimeout);
      onlineStatusTimeout = null;
    }

    onlineStatusTimeout = setTimeout(async () => {
      // Check if current user is still the same as when timeout was set
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

        // Update Zustand store only if the user hasn't changed in the meantime
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
          return {}; // No change to state
        });
        console.log('[AuthStore] setOnlineStatus: Online status set to', isOnline);
      } catch (error: any) {
        console.error('[AuthStore] setOnlineStatus: Caught error updating online status:', error);
        toast.error(error.message || 'An unexpected error occurred while updating online status.');
      } finally {
        onlineStatusTimeout = null; // Clear timeout reference
      }
    }, 300); // Debounce
  },

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