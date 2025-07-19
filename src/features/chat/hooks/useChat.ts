import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { toast } from 'react-toastify';
import type { User } from '../../../shared/types/user';
import type { Conversation } from '../types/conversation';
import type { Message } from '../types/message';
import {
  createOrGetConversation,
  sendMessage as sendChatTextMessage,
  sendMediaMessage as sendChatMediaMessage,
  listenForUsers,
  listenForConversations,
  listenForMessages,
  updateTypingStatus,
} from '../service/ChatService';
import { useAuthStore } from '../../../shared/store/authStore';

/**
 * Custom React hook for managing chat functionality.
 * It handles fetching and updating users, conversations, and messages in real-time,
 * as well as sending messages and managing chat states.
 */
export const useChat = () => {
  const { currentUser } = useAuthStore();
  const currentUserId = useMemo(() => currentUser?.id || null, [currentUser?.id]);

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const unsubscribeUsersRef = useRef<(() => void) | null>(null);
  const unsubscribeConversationsRef = useRef<(() => void) | null>(null);
  const unsubscribeMessagesRef = useRef<(() => void) | null>(null);

  const selectedOtherUser = useMemo(() => {
    if (!selectedConversation || !currentUserId) return null;
    const otherUserId = selectedConversation.participants.find(pId => pId !== currentUserId);
    return allUsers.find(user => user.id === otherUserId) || null;
  }, [selectedConversation, allUsers, currentUserId]);

  /**
   * Effect hook to set up real-time listeners for all users and conversations
   * when the current user's ID is available. It also handles cleanup of these listeners.
   * If currentUser.id changes or becomes null, it resets all chat-related states.
   */
  useEffect(() => {
    if (!currentUserId) {
      // Clear all subscriptions and reset state if no user is logged in
      unsubscribeUsersRef.current?.();
      unsubscribeConversationsRef.current?.();
      unsubscribeMessagesRef.current?.();
      unsubscribeUsersRef.current = null;
      unsubscribeConversationsRef.current = null;
      unsubscribeMessagesRef.current = null;

      setAllUsers([]);
      setConversations([]);
      setMessages([]);
      setSelectedConversation(null);
      setIsLoadingInitialData(true);
      setIsLoadingMessages(false);
      return;
    }

    // --- Listen for All Users ---
    setIsLoadingInitialData(true); // Indicate that we are loading data
    unsubscribeUsersRef.current = listenForUsers((updatedUsers, initialLoadComplete) => {
      setAllUsers(updatedUsers);
      if (initialLoadComplete) {
        console.log("[useChat] Initial users data loaded.");
      }
    }, currentUserId);

    // --- Listen for Conversations ---
    unsubscribeConversationsRef.current = listenForConversations(currentUserId, (updatedConversations, initialLoadComplete) => {
      setConversations(updatedConversations);
      if (initialLoadComplete) {
        console.log("[useChat] Initial conversations data loaded.");
      }
      // If both users and conversations initial loads are complete, set overall loading to false
      if (initialLoadComplete && unsubscribeUsersRef.current) { // Check if users listener was active
        setIsLoadingInitialData(false);
        console.log("[useChat] All initial chat data (users & conversations) loaded.");
      }

      // Important: Update selectedConversation with latest data if it's the one currently open
      setSelectedConversation(prevSelected => {
        if (!prevSelected) return null;
        const latestConv = updatedConversations.find(conv => conv.id === prevSelected.id);
        // If the selected conversation is found in the latest updates, use that; otherwise, stick to prev
        return latestConv || prevSelected;
      });
    });

    // Cleanup function for this effect
    return () => {
      console.log("[useChat] Cleaning up global chat listeners.");
      unsubscribeUsersRef.current?.();
      unsubscribeConversationsRef.current?.();
      unsubscribeUsersRef.current = null;
      unsubscribeConversationsRef.current = null;
    };
  }, [currentUserId]); // Rerun only if currentUser.id changes

  /**
   * Effect hook to set up a real-time listener for messages within the currently selected conversation.
   * This listener is re-initialized whenever the `selectedConversation.id` changes.
   * It also handles cleanup of the message listener.
   */
  useEffect(() => {
    // Clean up previous message listener and reset messages
    unsubscribeMessagesRef.current?.();
    unsubscribeMessagesRef.current = null;
    setMessages([]);

    if (!selectedConversation?.id || !currentUserId) {
      setIsLoadingMessages(false);
      return;
    }

    console.log(`[useChat] Setting up message listener for conversation: ${selectedConversation.id}`);
    setIsLoadingMessages(true); // Indicate that messages for the new conversation are loading

    unsubscribeMessagesRef.current = listenForMessages(
      selectedConversation.id,
      currentUserId,
      (updatedMessages, initialLoadComplete) => {
        setMessages(updatedMessages);
        if (initialLoadComplete) {
          setIsLoadingMessages(false); // Messages are loaded after initial snapshot
          console.log(`[useChat] Initial messages for conversation ${selectedConversation.id} loaded.`);
        }
      }
    );

    // Cleanup function for this effect
    return () => {
      console.log(`[useChat] Cleaning up message listener for conversation: ${selectedConversation?.id}`);
      unsubscribeMessagesRef.current?.();
      unsubscribeMessagesRef.current = null;
    };
  }, [selectedConversation?.id, currentUserId]); // Re-run when selected conversation or current user changes

  /**
   * Callback function to select a user to chat with.
   * It attempts to create or retrieve a private conversation with the selected user
   * and sets it as the `selectedConversation` in the state.
   * @param user The User object to start a chat with.
   */
  const selectUserForChat = useCallback(async (user: User) => {
    if (!currentUserId) {
      toast.error('Authentication error: Cannot start chat. Please log in.');
      return;
    }
    console.log(`[useChat] Selecting user for chat: ${user.username}`);
    setIsLoadingMessages(true); // Start loading state for messages

    try {
      const conversation = await createOrGetConversation(currentUserId, user.id);
      setSelectedConversation(conversation);
    } catch (error: any) {
      console.error('[useChat] Error selecting user for chat:', error);
      toast.error(`Failed to start chat: ${error.message || 'Unknown error'}`);
      setIsLoadingMessages(false); // End loading state on error
    }
  }, [currentUserId]);

  /**
   * Callback function to send a text message in the currently selected conversation.
   * Implements an optimistic UI update by adding a temporary message immediately,
   * then updates it with the actual message upon successful delivery or removes it on failure.
   * @param content The text content of the message.
   */
  const sendTextMessage = useCallback(async (content: string): Promise<void> => {
    if (!selectedConversation || !currentUserId || !selectedOtherUser) {
      toast.error('No active chat to send message.');
      return;
    }
    setIsSendingMessage(true);

    // Optimistic update: Add a temporary message to the UI
    const tempMessage: Message = {
      id: `temp-${Date.now()}-${Math.random()}`, // Unique temporary ID
      conversation_id: selectedConversation.id,
      sender_id: currentUserId,
      receiver_id: selectedOtherUser.id,
      content,
      type: 'text',
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
      read_by: [currentUserId],
      status: 'sending' // Custom status for optimistic updates
    };

    setMessages(prevMessages => [...prevMessages, tempMessage].sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeA - timeB;
    }));

    try {
      const sentMsg = await sendChatTextMessage(
        selectedConversation.id,
        currentUserId,
        selectedOtherUser.id,
        content
      );

      // Update the temporary message with the actual sent message data
      setMessages(prevMessages => prevMessages.map(msg =>
        msg.id === tempMessage.id ? { ...sentMsg, status: undefined } : msg
      ).sort((a, b) => { // Re-sort to ensure correct order after update
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeA - timeB;
      }));

    } catch (error: any) {
      console.error('[useChat] Error sending text message:', error);
      toast.error(`Failed to send message: ${error.message || 'Unknown error'}`);
      // Remove the temporary message on failure
      setMessages(prevMessages => prevMessages.filter(msg => msg.id !== tempMessage.id));
    } finally {
      setIsSendingMessage(false);
    }
  }, [selectedConversation, currentUserId, selectedOtherUser]);

  /**
   * Callback function to send a media message (image, video, or audio) in the current chat.
   * Implements optimistic UI update, similar to `sendTextMessage`, for media content.
   * @param file The media file to be sent.
   * @param type The type of media ('image', 'video', or 'audio').
   */
  const sendMediaMessage = useCallback(async (file: File, type: 'image' | 'video' | 'audio'): Promise<void> => {
    if (!selectedConversation || !currentUserId || !selectedOtherUser) {
      toast.error('No active chat to send media.');
      return;
    }
    setIsSendingMessage(true);

    const tempMessage: Message = {
      id: `temp-${Date.now()}-${Math.random()}`,
      conversation_id: selectedConversation.id,
      sender_id: currentUserId,
      receiver_id: selectedOtherUser.id,
      content: `[${type.charAt(0).toUpperCase() + type.slice(1)}]`, // Placeholder content
      type: type,
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
      read_by: [currentUserId],
      status: 'sending',
      media_type: type,
      media_url: type === 'image' || type === 'video' ? URL.createObjectURL(file) : null, // Create temp URL for preview
      thumbnail_url: null,
      dimensions: null,
      duration: null,
    };

    setMessages(prevMessages => [...prevMessages, tempMessage].sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeA - timeB;
    }));

    try {
      const sentMsg = await sendChatMediaMessage(
        selectedConversation.id,
        currentUserId,
        selectedOtherUser.id,
        file,
        type
      );

      setMessages(prevMessages => prevMessages.map(msg =>
        msg.id === tempMessage.id ? { ...sentMsg, status: undefined } : msg
      ).sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeA - timeB;
      }));

    } catch (error: any) {
      console.error('[useChat] Error sending media message:', error);
      toast.error(`Failed to send media: ${error.message || 'Unknown error'}`);
      setMessages(prevMessages => prevMessages.filter(msg => msg.id !== tempMessage.id));
    } finally {
      setIsSendingMessage(false);
    }
  }, [selectedConversation, currentUserId, selectedOtherUser]);

  /**
   * Callback function to update the user's typing status in the database.
   * It debounces the 'isTyping: true' update to avoid excessive writes.
   * @param isTyping A boolean indicating if the user is currently typing.
   */
  const handleSetTypingStatus = useCallback(async (isTyping: boolean) => {
    if (!selectedConversation?.id || !currentUserId) return;
    try {
      await updateTypingStatus(selectedConversation.id, currentUserId, isTyping);
    } catch (error) {
      console.error('[useChat] Error setting typing status:', error);
    }
  }, [selectedConversation?.id, currentUserId]);


  /**
   * Callback function to reset the chat window state.
   * This typically means deselecting the current conversation and clearing messages.
   * It also attempts to clear the user's typing status if a conversation was active.
   */
  const resetChatWindow = useCallback(() => {
    console.log("[useChat] Resetting chat window.");
    if (selectedConversation?.id && currentUserId) {
      // Attempt to clear typing status when leaving the chat window
      updateTypingStatus(selectedConversation.id, currentUserId, false)
        .catch(err => console.error("Failed to clear typing status on chat window reset:", err));
    }
    setSelectedConversation(null);
    setMessages([]);
    setIsLoadingMessages(false);
  }, [currentUserId, selectedConversation?.id]);


  return {
    allUsers,
    conversations,
    messages,
    selectedConversation,
    selectedOtherUser,
    isLoadingInitialData,
    isLoadingMessages,
    isSendingMessage,
    selectUserForChat,
    sendMessage: sendTextMessage, // Renamed for clarity in return
    sendMediaMessage,
    resetChatWindow,
    setTypingStatus: handleSetTypingStatus, // Renamed for clarity in return
  };
};