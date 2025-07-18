import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  orderBy,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  increment,
  Timestamp,
  limit,
} from 'firebase/firestore';
import { db } from '../../../shared/libs/firebase';
import type { User } from '../../../shared/types/user';
import type { Conversation } from '../types/conversation';
import type { Message } from '../types/message';

// Import shared utilities for file handling
import { resizeImageFile } from '../../../shared/utils/imageUtils';
import { uploadFileToCloudinary } from '../../../shared/utils/cloudinaryUtils';
import { FILE_UPLOAD_LIMITS } from '../../../shared/constants/appConstants'; // Assuming this is where limits are now

// Define Cloudinary presets for chat media (YOU MUST ADD THESE TO YOUR .env FILE)
const CHAT_IMAGE_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_CHAT_IMAGE_PRESET;
const CHAT_VIDEO_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_CHAT_VIDEO_PRESET;
const CHAT_AUDIO_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_CHAT_AUDIO_PRESET;

/**
 * Sends a plain text message.
 */
export const sendMessage = async (
  conversationId: string,
  senderId: string,
  receiverId: string,
  content: string,
  type: 'text' = 'text' // Explicitly type as 'text'
): Promise<Message> => {
  try {
    const messagesRef = collection(db, 'messages');
    const now = Timestamp.now();

    const newMessageData: Omit<Message, 'id' | 'status'> = {
      conversation_id: conversationId,
      sender_id: senderId,
      receiver_id: receiverId,
      content,
      type, // This will always be 'text'
      timestamp: now.toDate().toISOString(),
      created_at: now.toDate().toISOString(),
      read_by: [senderId],
    };

    const docRef = await addDoc(messagesRef, newMessageData);
    const sentMessage = { id: docRef.id, ...newMessageData } as Message;

    const conversationDocRef = doc(db, 'conversations', conversationId);
    await updateDoc(conversationDocRef, {
      last_message_content: sentMessage.content,
      last_message_timestamp: sentMessage.created_at,
      last_message_sender_id: sentMessage.sender_id,
      last_message_type: sentMessage.type, // Update last message type for text
      [`unread_counts.${receiverId}`]: increment(1),
      typing_users: arrayRemove(senderId),
    });

    return sentMessage;
  } catch (error: any) {
    throw new Error(`Failed to send message: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Handles uploading and sending media messages (image, video, audio).
 */
export const sendMediaMessage = async (
  conversationId: string,
  senderId: string,
  receiverId: string,
  file: File,
  mediaType: 'image' | 'video' | 'audio'
): Promise<Message> => {
  try {
    let uploadedUrl: string;
    let thumbnail_url: string | null = null;
    let dimensions: { width: number; height: number; } | null = null;
    let duration: number | null = null;
    let uploadPreset: string;
    let folderPath: string;
    let maxFileSizeMB: number;

    // Determine Cloudinary parameters and file size limits based on media type
    switch (mediaType) {
      case 'image':
        uploadPreset = CHAT_IMAGE_UPLOAD_PRESET;
        folderPath = `chat_media/images/${conversationId}`;
        maxFileSizeMB = FILE_UPLOAD_LIMITS.IMAGE_MAX_SIZE_MB;
        // Resize image before upload for chat
        const resizedImage = await resizeImageFile(file, 1200, 1200, 0.9); // Adjust max dimensions for chat images
        uploadedUrl = await uploadFileToCloudinary(resizedImage, uploadPreset, folderPath, 'image', maxFileSizeMB);
        // Note: For actual dimensions from Cloudinary, you'd typically parse the response metadata
        // or rely on Cloudinary's default optimization which stores metadata.
        break;
      case 'video':
        uploadPreset = CHAT_VIDEO_UPLOAD_PRESET;
        folderPath = `chat_media/videos/${conversationId}`;
        maxFileSizeMB = FILE_UPLOAD_LIMITS.VIDEO_MAX_SIZE_MB;
        uploadedUrl = await uploadFileToCloudinary(file, uploadPreset, folderPath, 'video', maxFileSizeMB);
        // Cloudinary upload presets can auto-generate thumbnails and get duration/dimensions.
        // For example, if your video preset generates thumbnails, you might set `thumbnail_url` here.
        // E.g., `thumbnail_url = uploadedUrl.replace(/\.(mp4|mov|webm)$/, '.jpg');` (requires Cloudinary config)
        break;
      case 'audio':
        uploadPreset = CHAT_AUDIO_UPLOAD_PRESET;
        folderPath = `chat_media/audio/${conversationId}`;
        maxFileSizeMB = FILE_UPLOAD_LIMITS.AUDIO_MAX_SIZE_MB;
        // 'raw' resource type is commonly used for audio files on Cloudinary
        uploadedUrl = await uploadFileToCloudinary(file, uploadPreset, folderPath, 'raw', maxFileSizeMB);
        break;
      default:
        throw new Error('Unsupported media type.');
    }

    const messagesRef = collection(db, 'messages');
    const now = Timestamp.now();

    const newMessageData: Omit<Message, 'id' | 'status'> = {
      conversation_id: conversationId,
      sender_id: senderId,
      receiver_id: receiverId,
      content: `[${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}]`, // E.g., "[Image]", "[Video]"
      type: mediaType, // Store the actual media type
      timestamp: now.toDate().toISOString(),
      created_at: now.toDate().toISOString(),
      read_by: [senderId],
      media_url: uploadedUrl,
      thumbnail_url: thumbnail_url,
      media_type: mediaType, // Explicitly store media type for easy access
      dimensions: dimensions,
      duration: duration,
    };

    const docRef = await addDoc(messagesRef, newMessageData);
    const sentMessage = { id: docRef.id, ...newMessageData } as Message;

    const conversationDocRef = doc(db, 'conversations', conversationId);
    await updateDoc(conversationDocRef, {
      last_message_content: sentMessage.content,
      last_message_timestamp: sentMessage.created_at,
      last_message_sender_id: sentMessage.sender_id,
      last_message_type: sentMessage.type, // Update last message type
      [`unread_counts.${receiverId}`]: increment(1),
      typing_users: arrayRemove(senderId),
    });

    return sentMessage;
  } catch (error: any) {
    throw new Error(`Failed to send ${mediaType}: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Creates a new private conversation or retrieves an existing one between two users.
 */
export const createOrGetConversation = async (currentUserId: string, otherUserId: string): Promise<Conversation> => {
  try {
    const conversationsRef = collection(db, 'conversations');
    const participantsSorted = [currentUserId, otherUserId].sort(); // Ensure consistent participant order for query

    const q = query(
      conversationsRef,
      where('participants', '==', participantsSorted),
      where('type', '==', 'private')
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const existingConvDoc = querySnapshot.docs[0];
      const existingConvData = existingConvDoc.data();

      // Ensure unread_counts are properly initialized for both participants
      const currentUnreadCounts = existingConvData.unread_counts || {};
      const updatedUnreadCounts = {
        [currentUserId]: currentUnreadCounts[currentUserId] ?? 0,
        [otherUserId]: currentUnreadCounts[otherUserId] ?? 0,
      };

      // Only update Firestore if unread_counts needs normalization
      if (JSON.stringify(currentUnreadCounts) !== JSON.stringify(updatedUnreadCounts)) {
        await updateDoc(doc(db, 'conversations', existingConvDoc.id), {
          unread_counts: updatedUnreadCounts
        });
      }

      return { id: existingConvDoc.id, ...existingConvData, unread_counts: updatedUnreadCounts } as Conversation;
    }

    const newConversationData: Omit<Conversation, 'id' | 'last_message' | 'unread_count'> = {
      type: 'private',
      participants: participantsSorted,
      created_at: new Date().toISOString(), // Use ISO string
      typing_users: [],
      last_message_content: null,
      last_message_timestamp: null,
      last_message_sender_id: null,
      last_message_type: null, // Initialize new field
      unread_counts: {
        [currentUserId]: 0,
        [otherUserId]: 0,
      },
    };

    const docRef = await addDoc(conversationsRef, newConversationData);
    const createdConversation = { ...newConversationData, id: docRef.id, unread_count: 0 } as Conversation; // unread_count is hydrated on client

    return createdConversation;
  } catch (error: any) {
    throw new Error(`Failed to create or get conversation: ${error.message || 'Unknown error'}`);
  }
};


/**
 * Sets up a real-time listener for all users (excluding the current user).
 * This handles 'added', 'modified', 'removed' events for user profiles.
 */
export const listenForUsers = (
  callback: (users: User[], initialLoadComplete: boolean) => void,
  currentUserId: string
): (() => void) => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef);

  let isInitialLoad = true;

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const updatedUsers: User[] = [];
    snapshot.forEach(doc => {
      const user = { id: doc.id, ...doc.data() } as User;
      if (user.id !== currentUserId) { // Exclude current user from the list
        updatedUsers.push(user);
      }
    });

    // Sort users, e.g., online users first, then alphabetically
    updatedUsers.sort((a, b) => {
      if (a.is_online && !b.is_online) return -1;
      if (!a.is_online && b.is_online) return 1;
      return a.username.localeCompare(b.username);
    });

    callback(updatedUsers, isInitialLoad);
    isInitialLoad = false; // After the first snapshot, subsequent calls are not initial loads
  }, () => {
    // Potentially call callback with empty array and false for initialLoadComplete on error
    callback([], false);
  });

  return () => {
    unsubscribe();
  };
};

export const listenForConversations = (
  userId: string,
  callback: (conversations: Conversation[], initialLoadComplete: boolean) => void
): (() => void) => {
  const conversationsRef = collection(db, 'conversations');
  const q = query(
    conversationsRef,
    where('participants', 'array-contains', userId),
    orderBy('last_message_timestamp', 'desc', ) // Order by most recent messages
  );

  let isInitialLoad = true;

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const updatedConversations: Conversation[] = [];
    snapshot.forEach((docSnap) => {
      const convData = docSnap.data();
      const conversation: Conversation = {
        id: docSnap.id,
        type: convData.type,
        participants: convData.participants,
        typing_users: convData.typing_users || [],
        created_at: convData.created_at,
        last_message_content: convData.last_message_content,
        last_message_timestamp: convData.last_message_timestamp,
        last_message_sender_id: convData.last_message_sender_id,
        last_message_type: convData.last_message_type || 'text', // Hydrate new field
        unread_counts: convData.unread_counts || {},
      };

      // Hydrate last_message object for display in conversation list
      let lastMessage: Message | null = null;
      if (conversation.last_message_content && conversation.last_message_timestamp && conversation.last_message_sender_id) {
          lastMessage = {
              id: 'denormalized-' + conversation.id, // Placeholder ID for denormalized message
              sender_id: conversation.last_message_sender_id,
              receiver_id: conversation.participants.find(p => p !== conversation.last_message_sender_id) || '',
              content: conversation.last_message_content,
              timestamp: conversation.last_message_timestamp,
              created_at: conversation.last_message_timestamp,
              type: conversation.last_message_type || 'text', // Use actual type
              // If you denormalize media_url or other media fields to Conversation, hydrate them here
              // Example: media_url: convData.last_message_media_url || null,
              read_by: null
          };
      }
      conversation.last_message = lastMessage;

      // Calculate unread_count specific to the current user
      conversation.unread_count = conversation.unread_counts?.[userId] ?? 0;

      updatedConversations.push(conversation);
    });

    callback(updatedConversations, isInitialLoad);
    isInitialLoad = false;
  }, (error) => {
    callback([], false);
  });

  return () => {
    unsubscribe();
  };
};

export const listenForMessages = (
  conversationId: string,
  currentUserId: string,
  callback: (messages: Message[], initialLoadComplete: boolean) => void
): (() => void) => {
  const messagesRef = collection(db, 'messages');
  const q = query(
    messagesRef,
    where('conversation_id', '==', conversationId),
    orderBy('created_at', 'asc'),
    limit(50) // Limit to recent messages for performance
  );

  let isInitialLoad = true;

  const unsubscribe = onSnapshot(q, async (snapshot) => {
    const updatedMessages: Message[] = snapshot.docs.map(doc => ({
      id: doc.id,
      sender_id: doc.data().sender_id,
      receiver_id: doc.data().receiver_id,
      content: doc.data().content,
      timestamp: doc.data().timestamp,
      type: doc.data().type,
      read_by: doc.data().read_by || [],
      conversation_id: doc.data().conversation_id,
      created_at: doc.data().created_at,
      media_url: doc.data().media_url || null, // Hydrate new field
      thumbnail_url: doc.data().thumbnail_url || null,
      media_type: doc.data().media_type || null,
      dimensions: doc.data().dimensions || null,
      duration: doc.data().duration || null,
    })) as Message[];

    callback(updatedMessages, isInitialLoad);

    // After initial load and on subsequent updates, mark unread messages as read
    if (!isInitialLoad || updatedMessages.length > 0) {
      const messagesToMarkRead = updatedMessages.filter(
        (msg) => msg.sender_id !== currentUserId && (!msg.read_by || !msg.read_by.includes(currentUserId))
      );

      if (messagesToMarkRead.length > 0) {
        // Debounce or slight delay to avoid rapid updates to Firestore and allow UI to render
        setTimeout(async () => {
          await markMessagesAsRead(conversationId, currentUserId);
        }, 300);
      }
    }

    isInitialLoad = false;
  }, (error) => {
    callback([], false);
  });

  return () => {
    unsubscribe();
  };
};

export const markMessagesAsRead = async (conversationId: string, userId: string): Promise<void> => {
  try {
    const conversationDocRef = doc(db, 'conversations', conversationId);
    await updateDoc(conversationDocRef, {
      [`unread_counts.${userId}`]: 0 // Reset user's unread count
    });

    // Find and update messages where current user is the receiver and has not read it yet
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('conversation_id', '==', conversationId),
      where('sender_id', '!=', userId), // Messages sent by the other person
      limit(50) // Limit the number of messages to fetch to mark read
    );
    const querySnapshot = await getDocs(q);
    const batchUpdates: Promise<void>[] = [];

    const unreadMessages = querySnapshot.docs.filter(docSnap => {
        const messageData = docSnap.data();
        // Only mark if it's not already read by the current user
        return !messageData.read_by || !(messageData.read_by as string[]).includes(userId);
    });

    if (unreadMessages.length === 0) {
        return;
    }

    unreadMessages.forEach((docSnap) => {
      const messageDocRef = doc(db, 'messages', docSnap.id);
      batchUpdates.push(updateDoc(messageDocRef, {
        read_by: arrayUnion(userId)
      }));
    });

    await Promise.all(batchUpdates);
  } catch (error: any) {
    throw new Error(`Failed to update message read status: ${error.message || 'Unknown error'}`);
  }
};

let typingStatusTimeout: NodeJS.Timeout | null = null; // Debounce timer

export const updateTypingStatus = async (conversationId: string, userId: string, isTyping: boolean): Promise<void> => {
  const conversationDocRef = doc(db, 'conversations', conversationId);

  // Clear any existing timeout to prevent old status updates
  if (typingStatusTimeout) {
    clearTimeout(typingStatusTimeout);
    typingStatusTimeout = null;
  }

  if (isTyping) {
    // If typing, set status immediately but debounce subsequent 'typing' updates
    typingStatusTimeout = setTimeout(async () => {
      try {
        await updateDoc(conversationDocRef, {
          typing_users: arrayUnion(userId)
        });
      } catch (error: any) {
      } finally {
        typingStatusTimeout = null;
      }
    }, 500); // Debounce typing updates by 500ms
  } else {
    // If not typing, remove status immediately
    try {
      await updateDoc(conversationDocRef, {
        typing_users: arrayRemove(userId)
      });
    } catch (error: any) {
    }
  }
};