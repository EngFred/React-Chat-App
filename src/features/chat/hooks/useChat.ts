import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { toast } from 'react-toastify';
import type { User } from '../../../shared/types/user';
import type { Conversation } from '../types/conversation';
import type { Message } from '../types/message';
import {
  createOrGetConversation,
  sendMessage as sendChatTextMessage, // Renamed to avoid conflict
  sendMediaMessage as sendChatMediaMessage, // New import
  listenForUsers,
  listenForConversations,
  listenForMessages,
  updateTypingStatus,
} from '../service/ChatService';
import { useAuthStore } from '../../../shared/store/authStore';

export const useChat = () => {
  const { currentUser } = useAuthStore();
  const currentUserId = useMemo(() => currentUser?.id || null, [currentUser?.id]);

  // Global chat data states
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  // Loading states
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true); // For initial users & conversations
  const [isLoadingMessages, setIsLoadingMessages] = useState(false); // For specific chat window messages
  const [isSendingMessage, setIsSendingMessage] = useState(false); // New state for send button loading

  // Refs for unsubscribe functions
  const unsubscribeUsersRef = useRef<(() => void) | null>(null);
  const unsubscribeConversationsRef = useRef<(() => void) | null>(null);
  const unsubscribeMessagesRef = useRef<(() => void) | null>(null);

  // Helper to find the other user in the selected conversation
  const selectedOtherUser = useMemo(() => {
    if (!selectedConversation || !currentUserId) return null;
    const otherUserId = selectedConversation.participants.find(pId => pId !== currentUserId);
    return allUsers.find(user => user.id === otherUserId) || null;
  }, [selectedConversation, allUsers, currentUserId]);

  /**
   * Effect to manage global listeners (users and conversations).
   * This runs once when currentUserId becomes available and cleans up on logout.
   */
  useEffect(() => {
    if (!currentUserId) {
      // Clean up all listeners and reset state on logout
      unsubscribeUsersRef.current?.();
      unsubscribeConversationsRef.current?.();
      unsubscribeMessagesRef.current?.(); // Also clear message listener
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
    setIsLoadingInitialData(true); // Set true while listeners are being established
    unsubscribeUsersRef.current = listenForUsers((updatedUsers, initialLoadComplete) => {
      setAllUsers(updatedUsers);
      if (initialLoadComplete) {
        console.log("[useChat] Initial users data loaded.");
      }
      // setIsLoadingInitialData will be set to false once conversations are also loaded
    }, currentUserId);

    // --- Listen for Conversations ---
    unsubscribeConversationsRef.current = listenForConversations(currentUserId, (updatedConversations, initialLoadComplete) => {
      setConversations(updatedConversations);
      if (initialLoadComplete) {
        console.log("[useChat] Initial conversations data loaded.");
      }
      // If both initial loads are complete, set overall initial loading to false
      if (initialLoadComplete && unsubscribeUsersRef.current) { // Assuming users listener also reports initial load
        setIsLoadingInitialData(false);
        console.log("[useChat] All initial chat data (users & conversations) loaded.");
      }

      // Important: Update selectedConversation with latest data if it's the one currently open
      setSelectedConversation(prevSelected => {
        if (!prevSelected) return null;
        const latestConv = updatedConversations.find(conv => conv.id === prevSelected.id);
        return latestConv || prevSelected; // Return latest or keep previous if not found (e.g., deleted)
      });
    });

    // Cleanup for this effect
    return () => {
      console.log("[useChat] Cleaning up global chat listeners.");
      unsubscribeUsersRef.current?.();
      unsubscribeConversationsRef.current?.();
      unsubscribeUsersRef.current = null;
      unsubscribeConversationsRef.current = null;
    };
  }, [currentUserId]); // Rerun only if currentUser.id changes

  /**
   * Effect to manage the messages listener for the currently selected conversation.
   * This runs when selectedConversation.id changes.
   */
  useEffect(() => {
    // Clean up previous message listener if active
    unsubscribeMessagesRef.current?.();
    unsubscribeMessagesRef.current = null;
    setMessages([]); // Clear messages when conversation changes or unselected

    if (!selectedConversation?.id || !currentUserId) {
      setIsLoadingMessages(false);
      return;
    }

    console.log(`[useChat] Setting up message listener for conversation: ${selectedConversation.id}`);
    setIsLoadingMessages(true); // Start loading messages for new conversation

    unsubscribeMessagesRef.current = listenForMessages(
      selectedConversation.id,
      currentUserId,
      (updatedMessages, initialLoadComplete) => {
        setMessages(updatedMessages);
        if (initialLoadComplete) {
          setIsLoadingMessages(false); // Messages for this conversation are loaded
          console.log(`[useChat] Initial messages for conversation ${selectedConversation.id} loaded.`);
        }
      }
    );

    // Cleanup for this effect
    return () => {
      console.log(`[useChat] Cleaning up message listener for conversation: ${selectedConversation?.id}`);
      unsubscribeMessagesRef.current?.();
      unsubscribeMessagesRef.current = null;
    };
  }, [selectedConversation?.id, currentUserId]);


  /**
   * Handles selecting a user to start/continue a chat.
   * Creates or gets a conversation, then sets it as selected.
   */
  const selectUserForChat = useCallback(async (user: User) => {
    if (!currentUserId) {
      toast.error('Authentication error: Cannot start chat. Please log in.');
      return;
    }
    console.log(`[useChat] Selecting user for chat: ${user.username}`);
    setIsLoadingMessages(true); // Start loading indicator for chat window

    try {
      const conversation = await createOrGetConversation(currentUserId, user.id);
      setSelectedConversation(conversation);
      // Messages will load via the useEffect for selectedConversation.id
    } catch (error: any) {
      console.error('[useChat] Error selecting user for chat:', error);
      toast.error(`Failed to start chat: ${error.message || 'Unknown error'}`);
      setIsLoadingMessages(false); // Turn off loading on error
    }
  }, [currentUserId]);

  /**
   * Sends a text message in the currently selected conversation.
   * Implements optimistic UI update.
   */
  const sendTextMessage = useCallback(async (content: string): Promise<void> => {
    if (!selectedConversation || !currentUserId || !selectedOtherUser) {
      toast.error('No active chat to send message.');
      return;
    }
    setIsSendingMessage(true); // Start sending loading state

    // Optimistic update: Add a temporary message to the UI
    const tempMessage: Message = {
      id: `temp-${Date.now()}-${Math.random()}`, // Unique temporary ID
      conversation_id: selectedConversation.id,
      sender_id: currentUserId,
      receiver_id: selectedOtherUser.id,
      content,
      type: 'text',
      timestamp: new Date().toISOString(), // Use client-side timestamp for display
      created_at: new Date().toISOString(),
      read_by: [currentUserId],
      status: 'sending' // Custom status for optimistic UI
    };

    setMessages(prevMessages => [...prevMessages, tempMessage].sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeA - timeB;
    }));

    try {
      // Call service to send message to Firestore
      const sentMsg = await sendChatTextMessage(
        selectedConversation.id,
        currentUserId,
        selectedOtherUser.id,
        content
      );

      // The message listener will eventually pick up the sent message and update the state
      // For immediate optimistic update correction, if listener is slow, we can do this:
      setMessages(prevMessages => prevMessages.map(msg =>
        msg.id === tempMessage.id ? { ...sentMsg, status: undefined } : msg
      ).sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeA - timeB;
      }));

    } catch (error: any) {
      console.error('[useChat] Error sending text message:', error);
      toast.error(`Failed to send message: ${error.message || 'Unknown error'}`);
      // Revert optimistic update on error
      setMessages(prevMessages => prevMessages.filter(msg => msg.id !== tempMessage.id));
    } finally {
      setIsSendingMessage(false); // End sending loading state
    }
  }, [selectedConversation, currentUserId, selectedOtherUser]);

  /**
   * Sends a media message (image, video, audio) in the currently selected conversation.
   * Implements optimistic UI update.
   */
  const sendMediaMessage = useCallback(async (file: File, type: 'image' | 'video' | 'audio'): Promise<void> => {
    if (!selectedConversation || !currentUserId || !selectedOtherUser) {
      toast.error('No active chat to send media.');
      return;
    }
    setIsSendingMessage(true); // Start sending loading state

    // Optimistic update: Add a temporary media message to the UI
    const tempMessage: Message = {
      id: `temp-${Date.now()}-${Math.random()}`,
      conversation_id: selectedConversation.id,
      sender_id: currentUserId,
      receiver_id: selectedOtherUser.id,
      content: `[${type.charAt(0).toUpperCase() + type.slice(1)}]`, // E.g., "[Image]"
      type: type,
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
      read_by: [currentUserId],
      status: 'sending',
      media_type: type,
      // For optimistic UI, you might want to create a local URL or thumbnail for preview
      media_url: type === 'image' || type === 'video' ? URL.createObjectURL(file) : null,
      thumbnail_url: null, // No client-side thumbnail for now
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
   * Updates the typing status for the current user in the selected conversation.
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
   * Resets the chat window, clearing messages and unselecting the conversation.
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
    isLoadingInitialData, // Overall loading for users and conversations list
    isLoadingMessages, // Loading specific to the selected chat window
    isSendingMessage, // Export new sending state
    selectUserForChat,
    sendMessage: sendTextMessage, // Export text sending as sendMessage
    sendMediaMessage, // Export media sending
    resetChatWindow,
    setTypingStatus: handleSetTypingStatus,
  };
};