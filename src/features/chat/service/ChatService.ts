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
import { resizeImageFile } from '../../../shared/utils/imageUtils';
import { uploadFileToCloudinary } from '../../../shared/utils/cloudinaryUtils';
import { FILE_UPLOAD_LIMITS } from '../../../shared/constants/appConstants';

const CHAT_IMAGE_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_CHAT_IMAGE_PRESET;
const CHAT_VIDEO_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_CHAT_VIDEO_PRESET;
const CHAT_AUDIO_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_CHAT_AUDIO_PRESET;

/**
 * Provides functions for interacting with chat data in Firebase Firestore,
 * including sending messages, managing conversations, and real-time listeners.
 */

/**
 * Sends a text message to a specific conversation.
 * Updates both the `messages` collection and the `conversations` collection
 * with the new message's details and increments the receiver's unread count.
 * @param conversationId The ID of the conversation.
 * @param senderId The ID of the user sending the message.
 * @param receiverId The ID of the user receiving the message (for private chats).
 * @param content The text content of the message.
 * @param type The type of message, defaults to 'text'.
 * @returns A Promise that resolves with the sent Message object.
 * @throws An error if sending the message fails.
 */
export const sendMessage = async (
  conversationId: string,
  senderId: string,
  receiverId: string,
  content: string,
  type: 'text' = 'text'
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
      last_message_type: sentMessage.type,
      [`unread_counts.${receiverId}`]: increment(1),
      typing_users: arrayRemove(senderId),
    });

    return sentMessage;
  } catch (error: any) {
    throw new Error(`Failed to send message: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Sends a media message (image, video, or audio) to a specific conversation.
 * Uploads the media file to Cloudinary, then stores message metadata in Firestore,
 * updating the conversation's last message details and receiver's unread count.
 * Handles resizing for images and uses appropriate Cloudinary presets.
 * @param conversationId The ID of the conversation.
 * @param senderId The ID of the user sending the message.
 * @param receiverId The ID of the user receiving the message.
 * @param file The media file to be sent.
 * @param mediaType The type of media ('image', 'video', or 'audio').
 * @returns A Promise that resolves with the sent Message object.
 * @throws An error if sending the media message fails (e.g., upload error, unsupported type).
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

    switch (mediaType) {
      case 'image':
        uploadPreset = CHAT_IMAGE_UPLOAD_PRESET;
        folderPath = `chat_media/images/${conversationId}`;
        maxFileSizeMB = FILE_UPLOAD_LIMITS.IMAGE_MAX_SIZE_MB;
        const resizedImage = await resizeImageFile(file, 1200, 1200, 0.9);
        uploadedUrl = await uploadFileToCloudinary(resizedImage, uploadPreset, folderPath, 'image', maxFileSizeMB);
        break;
      case 'video':
        uploadPreset = CHAT_VIDEO_UPLOAD_PRESET;
        folderPath = `chat_media/videos/${conversationId}`;
        maxFileSizeMB = FILE_UPLOAD_LIMITS.VIDEO_MAX_SIZE_MB;
        uploadedUrl = await uploadFileToCloudinary(file, uploadPreset, folderPath, 'video', maxFileSizeMB);
        break;
      case 'audio':
        uploadPreset = CHAT_AUDIO_UPLOAD_PRESET;
        folderPath = `chat_media/audio/${conversationId}`;
        maxFileSizeMB = FILE_UPLOAD_LIMITS.AUDIO_MAX_SIZE_MB;
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
      content: `[${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}]`,
      type: mediaType,
      timestamp: now.toDate().toISOString(),
      created_at: now.toDate().toISOString(),
      read_by: [senderId],
      media_url: uploadedUrl,
      thumbnail_url: thumbnail_url,
      media_type: mediaType,
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
      last_message_type: sentMessage.type,
      [`unread_counts.${receiverId}`]: increment(1),
      typing_users: arrayRemove(senderId),
    });

    return sentMessage;
  } catch (error: any) {
    throw new Error(`Failed to send ${mediaType}: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Creates a new private conversation between two users or retrieves an existing one.
 * It ensures that conversation participants are always stored in a sorted order
 * to facilitate consistent lookup. Initializes unread counts for both participants.
 * @param currentUserId The ID of the currently logged-in user.
 * @param otherUserId The ID of the other user in the conversation.
 * @returns A Promise that resolves with the Conversation object.
 * @throws An error if the operation fails.
 */
export const createOrGetConversation = async (currentUserId: string, otherUserId: string): Promise<Conversation> => {
  try {
    const conversationsRef = collection(db, 'conversations');
    const participantsSorted = [currentUserId, otherUserId].sort();

    const q = query(
      conversationsRef,
      where('participants', '==', participantsSorted),
      where('type', '==', 'private')
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const existingConvDoc = querySnapshot.docs[0];
      const existingConvData = existingConvDoc.data();

      // Ensure unread_counts exist for both participants upon retrieval
      const currentUnreadCounts = existingConvData.unread_counts || {};
      const updatedUnreadCounts = {
        [currentUserId]: currentUnreadCounts[currentUserId] ?? 0,
        [otherUserId]: currentUnreadCounts[otherUserId] ?? 0,
      };

      // Only update if there's a change in unread_counts structure
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
      created_at: new Date().toISOString(),
      typing_users: [],
      last_message_content: null,
      last_message_timestamp: null,
      last_message_sender_id: null,
      last_message_type: null,
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
 * Sets up a real-time listener for user data, excluding the current user.
 * Sorts users by online status and then by username.
 * @param callback A function to be called with the updated list of users and a boolean indicating initial load.
 * @param currentUserId The ID of the currently logged-in user to exclude from the list.
 * @returns A cleanup function to unsubscribe from the listener.
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
      if (user.id !== currentUserId) {
        updatedUsers.push(user);
      }
    });

    updatedUsers.sort((a, b) => {
      if (a.is_online && !b.is_online) return -1;
      if (!a.is_online && b.is_online) return 1;
      return a.username.localeCompare(b.username);
    });

    callback(updatedUsers, isInitialLoad);
    isInitialLoad = false;
  }, () => {
    callback([], false);
  });

  return () => {
    unsubscribe();
  };
};

/**
 * Sets up a real-time listener for conversations involving a specific user.
 * Orders conversations by the timestamp of their last message in descending order.
 * Denormalizes `last_message` and calculates `unread_count` for the current user.
 * @param userId The ID of the user whose conversations to listen for.
 * @param callback A function to be called with the updated list of conversations and a boolean indicating initial load.
 * @returns A cleanup function to unsubscribe from the listener.
 */
export const listenForConversations = (
  userId: string,
  callback: (conversations: Conversation[], initialLoadComplete: boolean) => void
): (() => void) => {
  const conversationsRef = collection(db, 'conversations');
  const q = query(
    conversationsRef,
    where('participants', 'array-contains', userId),
    orderBy('last_message_timestamp', 'desc', )
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
        last_message_type: convData.last_message_type || 'text',
        unread_counts: convData.unread_counts || {},
      };

      let lastMessage: Message | null = null;
      if (conversation.last_message_content && conversation.last_message_timestamp && conversation.last_message_sender_id) {
          lastMessage = {
              id: 'denormalized-' + conversation.id, // Placeholder ID as it's denormalized
              sender_id: conversation.last_message_sender_id,
              // Attempt to find receiver_id; for private chats, it's the other participant
              receiver_id: conversation.participants.find(p => p !== conversation.last_message_sender_id) || '',
              content: conversation.last_message_content,
              timestamp: conversation.last_message_timestamp,
              created_at: conversation.last_message_timestamp,
              type: conversation.last_message_type || 'text',
              read_by: null // Read by information is not denormalized for the last message object
          };
      }
      conversation.last_message = lastMessage;

      // Calculate the unread count specific to the current user
      conversation.unread_count = conversation.unread_counts?.[userId] ?? 0;

      updatedConversations.push(conversation);
    });

    callback(updatedConversations, isInitialLoad);
    isInitialLoad = false;
  }, (error) => {
    // Handle errors in the listener, e.g., permission denied
    console.error("Error listening for conversations:", error);
    callback([], false); // Provide empty array on error
  });

  return () => {
    unsubscribe();
  };
};

/**
 * Sets up a real-time listener for messages within a specific conversation.
 * Messages are ordered chronologically. It also automatically marks messages
 * sent by other users as read after they are loaded.
 * @param conversationId The ID of the conversation to listen for messages.
 * @param currentUserId The ID of the currently logged-in user.
 * @param callback A function to be called with the updated list of messages and a boolean indicating initial load.
 * @returns A cleanup function to unsubscribe from the listener.
 */
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
    limit(50) // Limit to the most recent 50 messages
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
      media_url: doc.data().media_url || null,
      thumbnail_url: doc.data().thumbnail_url || null,
      media_type: doc.data().media_type || null,
      dimensions: doc.data().dimensions || null,
      duration: doc.data().duration || null,
    })) as Message[];

    callback(updatedMessages, isInitialLoad);

    // Mark messages as read if they are from the other user and not already marked
    if (!isInitialLoad || updatedMessages.length > 0) {
      const messagesToMarkRead = updatedMessages.filter(
        (msg) => msg.sender_id !== currentUserId && (!msg.read_by || !msg.read_by.includes(currentUserId))
      );

      if (messagesToMarkRead.length > 0) {
        // Debounce marking messages as read to avoid excessive writes
        setTimeout(async () => {
          await markMessagesAsRead(conversationId, currentUserId);
        }, 300); // Small delay to ensure messages are rendered before marking as read
      }
    }

    isInitialLoad = false;
  }, (error) => {
    // Handle errors in the listener
    console.error("Error listening for messages:", error);
    callback([], false); // Provide empty array on error
  });

  return () => {
    unsubscribe();
  };
};

/**
 * Marks all unread messages in a given conversation as read for a specific user.
 * This involves setting the user's unread count for the conversation to zero
 * and adding the user's ID to the `read_by` array of relevant messages.
 * @param conversationId The ID of the conversation.
 * @param userId The ID of the user for whom to mark messages as read.
 * @returns A Promise that resolves when all messages are marked as read.
 * @throws An error if the update fails.
 */
export const markMessagesAsRead = async (conversationId: string, userId: string): Promise<void> => {
  try {
    const conversationDocRef = doc(db, 'conversations', conversationId);
    // Reset the user's unread count in the conversation document
    await updateDoc(conversationDocRef, {
      [`unread_counts.${userId}`]: 0
    });

    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('conversation_id', '==', conversationId),
      where('sender_id', '!=', userId), // Only messages sent by others
      limit(50) // Limit to prevent reading too many docs
    );
    const querySnapshot = await getDocs(q);
    const batchUpdates: Promise<void>[] = [];

    // Filter messages that are unread by the current user
    const unreadMessages = querySnapshot.docs.filter(docSnap => {
        const messageData = docSnap.data();
        return !messageData.read_by || !(messageData.read_by as string[]).includes(userId);
    });

    if (unreadMessages.length === 0) {
        return; // No unread messages to mark
    }

    // Add current user to the `read_by` array for each unread message
    unreadMessages.forEach((docSnap) => {
      const messageDocRef = doc(db, 'messages', docSnap.id);
      batchUpdates.push(updateDoc(messageDocRef, {
        read_by: arrayUnion(userId) // Atomically add userId to the array
      }));
    });

    await Promise.all(batchUpdates); // Execute all updates concurrently
  } catch (error: any) {
    throw new Error(`Failed to update message read status: ${error.message || 'Unknown error'}`);
  }
};

let typingStatusTimeout: NodeJS.Timeout | null = null;

/**
 * Updates the typing status of a user within a specific conversation.
 * This function debounces the 'isTyping: true' status update to reduce Firestore writes.
 * When a user stops typing, their ID is immediately removed from `typing_users`.
 * @param conversationId The ID of the conversation.
 * @param userId The ID of the user whose typing status is being updated.
 * @param isTyping A boolean indicating whether the user is currently typing.
 * @returns A Promise that resolves when the typing status is updated.
 */
export const updateTypingStatus = async (conversationId: string, userId: string, isTyping: boolean): Promise<void> => {
  const conversationDocRef = doc(db, 'conversations', conversationId);
  if (typingStatusTimeout) {
    clearTimeout(typingStatusTimeout);
    typingStatusTimeout = null;
  }

  if (isTyping) {
    // Set a timeout to add the user to typing_users after a short delay
    typingStatusTimeout = setTimeout(async () => {
      try {
        await updateDoc(conversationDocRef, {
          typing_users: arrayUnion(userId) // Add user to typing_users array
        });
      } catch (error: any) {
        // Log or handle the error, but don't re-throw to avoid breaking the UI
        console.error("Error setting typing status:", error);
      } finally {
        typingStatusTimeout = null;
      }
    }, 500); // Debounce for 500ms
  } else {
    // Immediately remove user from typing_users when they stop typing
    try {
      await updateDoc(conversationDocRef, {
        typing_users: arrayRemove(userId) // Remove user from typing_users array
      });
    } catch (error: any) {
      // Log or handle the error
      console.error("Error removing typing status:", error);
    }
  }
};