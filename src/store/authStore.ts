import { create } from 'zustand';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { auth, db, appId } from '../config/firebase';
import { toast } from 'react-toastify';
import type { User } from '../types/user';
import type { Message } from '../types/message';

interface AuthState {
  currentUser: User | null;
  loadingAuth: boolean;
  userId: string | null;
  initializeAuth: () => () => void;
  login: (email: string, password: string) => Promise<void>;
  registerUser: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (username: string, profilePictureUrl: string | null) => Promise<void>;
  fetchAndUpdateUserStatus: (uid: string) => Promise<void>;
  setTypingStatus: (conversationId: string, userId: string, isTyping: boolean) => Promise<void>;
  markMessagesAsRead: (conversationId: string, userId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  loadingAuth: true,
  userId: null,

  initializeAuth: () => {
    console.log('Initializing auth listener');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('onAuthStateChanged fired, Firebase user:', user ? user.uid : 'null');
      if (user) {
        set({
          currentUser: {
            id: user.uid,
            username: user.displayName || 'Anonymous User',
            profilePicture: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'Anonymous')}&background=random&color=fff&size=128`,
            isOnline: true,
            email: user.email || 'anonymous@example.com',
            lastSeen: null,
            createdAt: new Date().toISOString(),
          },
          userId: user.uid,
          loadingAuth: false,
        });

        const userDocRef = doc(db, `artifacts/${appId}/users`, user.uid);
        try {
          const userDocSnap = await getDoc(userDocRef);
          console.log('Firestore userDocSnap exists for current user:', userDocSnap.exists());

          if (userDocSnap.exists()) {
            let userData: User = { id: userDocSnap.id, ...userDocSnap.data() as Omit<User, 'id'> };
            console.log('Fetched Firestore user data:', userData);

            await updateDoc(userDocRef, { isOnline: true, lastSeen: null });
            userData = { ...userData, isOnline: true, lastSeen: null };
            set({ currentUser: userData });
            console.log('Updated currentUser in Zustand with Firestore data and online status:', userData);
          } else {
            console.log('Creating new Firestore user document for:', user.uid);
            const newUserDocData: Omit<User, 'id'> = {
              email: user.email || 'anonymous@example.com',
              username: user.displayName || 'Anonymous User',
              profilePicture: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'Anonymous')}&background=random&color=fff&size=128`,
              isOnline: true,
              createdAt: new Date().toISOString(),
              lastSeen: null,
            };
            await setDoc(userDocRef, newUserDocData, { merge: true });
            set({ currentUser: { id: user.uid, ...newUserDocData } });
            console.log('Created new Firestore user document and updated currentUser in Zustand:', { id: user.uid, ...newUserDocData });
          }
        } catch (firestoreError) {
          console.error("Error during Firestore operations in initializeAuth:", firestoreError);
          toast.error("Failed to sync user data with Firestore.");
        }
      } else {
        console.log('No Firebase user, clearing currentUser state.');
        set({ currentUser: null, userId: null, loadingAuth: false });
      }
    });
    return unsubscribe;
  },

  login: async (email, password) => {
    set({ loadingAuth: true });
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userRef = doc(db, `artifacts/${appId}/users`, user.uid);
      await updateDoc(userRef, {
        isOnline: true,
        lastSeen: null,
      });
      toast.success('Logged in successfully!');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Failed to log in. Please check your credentials.');
      throw error;
    } finally {
      set({ loadingAuth: false });
    }
  },

  registerUser: async (username, email, password) => {
    set({ loadingAuth: true });
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: username,
        photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random&color=fff&size=128`,
      });

      const userDocRef = doc(db, `artifacts/${appId}/users`, user.uid);
      await setDoc(userDocRef, {
        email: user.email || '',
        username: username,
        profilePicture: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random&color=fff&size=128`,
        isOnline: true,
        createdAt: new Date().toISOString(),
        lastSeen: null,
      });

      toast.success('Registration successful! Please log in.');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Failed to register. Please try again.');
      throw error;
    } finally {
      set({ loadingAuth: false });
    }
  },

  logout: async () => {
    set({ loadingAuth: true });
    try {
      const currentFirebaseUser = auth.currentUser;
      if (currentFirebaseUser) {
        const userRef = doc(db, `artifacts/${appId}/users`, currentFirebaseUser.uid);
        await updateDoc(userRef, {
          isOnline: false,
          lastSeen: new Date().toISOString(),
        });
      }
      await signOut(auth);
      set({ currentUser: null, userId: null });
      toast.success('Logged out successfully!');
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error(error.message || 'Failed to log out.');
      throw error;
    } finally {
      set({ loadingAuth: false });
    }
  },

  updateUserProfile: async (username, profilePictureUrl) => {
    const currentFirebaseUser = auth.currentUser;
    if (!currentFirebaseUser) {
      toast.error('No authenticated user found.');
      return;
    }

    set({ loadingAuth: true });
    try {
      await updateProfile(currentFirebaseUser, {
        displayName: username,
        photoURL: profilePictureUrl,
      });

      const userDocRef = doc(db, `artifacts/${appId}/users`, currentFirebaseUser.uid);
      await updateDoc(userDocRef, {
        username: username,
        profilePicture: profilePictureUrl,
      });

      set((state) => ({
        currentUser: state.currentUser ? { ...state.currentUser, username, profilePicture: profilePictureUrl || null } : null,
      }));

      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error(error.message || 'Failed to update profile.');
      throw error;
    } finally {
      set({ loadingAuth: false });
    }
  },

  fetchAndUpdateUserStatus: async (uid: string) => {
    try {
      const userDocRef = doc(db, `artifacts/${appId}/users`, uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data() as User;
        if (get().userId === uid && !userData.isOnline) {
          await updateDoc(userDocRef, { isOnline: true, lastSeen: null });
        }
      }
    } catch (error) {
      console.error("Error fetching user data or updating status:", error);
    }
  },

  setTypingStatus: async (conversationId: string, userId: string, isTyping: boolean) => {
    try {
      const conversationRef = doc(db, `artifacts/${appId}/conversations`, conversationId);
      const conversationDoc = await getDoc(conversationRef);
      if (!conversationDoc.exists()) throw new Error('Conversation not found');
      const currentTypingUsers = (conversationDoc.data().typingUsers || []) as string[];
      let updatedTypingUsers: string[];
      if (isTyping) {
        updatedTypingUsers = [...new Set([...currentTypingUsers, userId])];
      } else {
        updatedTypingUsers = currentTypingUsers.filter((id) => id !== userId);
      }
      await updateDoc(conversationRef, { typingUsers: updatedTypingUsers });
    } catch (error) {
      console.error('Error updating typing status:', error);
      toast.error('Failed to update typing status.');
    }
  },

  markMessagesAsRead: async (conversationId: string, userId: string) => {
    try {
      const messagesRef = collection(db, `artifacts/${appId}/conversations/${conversationId}/messages`);
      const messagesSnapshot = await getDocs(messagesRef);
      const batch = messagesSnapshot.docs
        .filter((doc) => {
          const message = doc.data() as Message;
          return !message.readBy?.includes(userId) && message.senderId !== userId;
        })
        .map((doc) =>
          updateDoc(doc.ref, {
            readBy: [...(doc.data().readBy || []), userId],
          })
        );
      await Promise.all(batch);
    } catch (error) {
      console.error('Error marking messages as read:', error);
      toast.error('Failed to update message read status.');
    }
  },
}));