import React, { useEffect, useState, useRef } from 'react';
import ScrollToBottom from 'react-scroll-to-bottom';
import { FiChevronLeft, FiInfo, FiVideo, FiPhone } from 'react-icons/fi';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { motion, AnimatePresence } from 'framer-motion';
import { doc as firestoreDoc, onSnapshot, collection, addDoc, updateDoc, serverTimestamp, getDoc, DocumentReference } from 'firebase/firestore';
import { db, appId } from '../../config/firebase';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-toastify';
import type { User } from '../../types/user';
import type { Conversation } from '../../types/conversation';
import type { Message } from '../../types/message';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import VideoCallModal from '../video-call/VideoCallModal';
import OutgoingCallModal from '../video-call/OutgoingCallModal';

dayjs.extend(relativeTime);

interface ChatWindowProps {
  conversation: Conversation;
  messages: Message[];
  currentUser: User;
  allUsers: User[];
  onSendMessage: (text: string, type: 'text' | 'image' | 'video' | 'file', file?: File) => void;
  otherUser: User;
  onGoBack: () => void;
  isLoadingMessages: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation: initialConversation,
  messages,
  currentUser,
  allUsers,
  onSendMessage,
  otherUser: initialOtherUser,
  onGoBack,
  isLoadingMessages,
}) => {
  const [otherUser, setOtherUser] = useState<User | null>(initialOtherUser);
  const [conversation, setConversation] = useState<Conversation>(initialConversation);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);
  const [callType, setCallType] = useState<'video' | 'audio' | null>(null);
  const [channelName, setChannelName] = useState<string | null>(null);
  const [outgoingCall, setOutgoingCall] = useState<Message | null>(null);
  const [callStartTime, setCallStartTime] = useState<number | null>(null);
  const activeCallId = useRef<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!initialOtherUser?.id) {
      setIsLoadingUser(false);
      return;
    }

    setIsLoadingUser(true);
    const userDocRef: DocumentReference = firestoreDoc(db, `artifacts/${appId}/users/${initialOtherUser.id}`);
    const unsubscribe = onSnapshot(
      userDocRef,
      (doc) => {
        if (doc.exists()) {
          const userData = { id: doc.id, ...doc.data() } as User;
          setOtherUser(userData);
          setIsLoadingUser(false);
        } else {
          setIsLoadingUser(false);
          toast.error('User data not found.');
        }
      },
      (error) => {
        console.error('Error fetching other user status:', error);
        toast.error('Failed to load user status.');
        setIsLoadingUser(false);
      }
    );

    return () => unsubscribe();
  }, [initialOtherUser.id]);

  useEffect(() => {
    // Reset call state on mount to prevent stale calls
    setIsVideoCallOpen(false);
    setCallType(null);
    setChannelName(null);
    setOutgoingCall(null);
    setCallStartTime(null);
    activeCallId.current = null;
  }, []);

  useEffect(() => {
    if (!initialConversation?.id) return;

    const conversationDocRef: DocumentReference = firestoreDoc(db, `artifacts/${appId}/conversations/${initialConversation.id}`);
    const unsubscribe = onSnapshot(
      conversationDocRef,
      async (doc) => {
        if (doc.exists()) {
          const conversationData = { id: doc.id, ...doc.data() } as Conversation;
          setConversation(conversationData);
          const lastMessage = conversationData.lastMessage;

          if (
            lastMessage?.type === 'call' &&
            lastMessage.callData?.channelName &&
            (lastMessage.callData.initiatorId === currentUser.id || lastMessage.callData.receiverId === currentUser.id) &&
            lastMessage.id !== activeCallId.current &&
            dayjs().diff(dayjs(lastMessage.timestamp), 'second') < 300
          ) {
            // Verify message document exists
            if (!lastMessage.id) {
              console.warn('Invalid message ID for call message');
              return;
            }
            const messageDocRef: DocumentReference = firestoreDoc(db, `artifacts/${appId}/conversations/${conversationData.id}/messages/${lastMessage.id}`);
            const messageDoc = await getDoc(messageDocRef);
            if (!messageDoc.exists()) {
              console.warn('Call message does not exist:', lastMessage.id);
              return;
            }

            if (lastMessage.callData.status === 'accepted') {
              console.debug('Opening VideoCallModal for accepted call:', lastMessage.id);
              setCallType(lastMessage.callData.callType);
              setChannelName(lastMessage.callData.channelName);
              setIsVideoCallOpen(true);
              setOutgoingCall(null);
              setCallStartTime(Date.now());
              activeCallId.current = lastMessage.id;
            } else if (lastMessage.callData.status === 'initiated' && lastMessage.senderId === currentUser.id) {
              console.debug('Showing OutgoingCallModal for initiated call:', lastMessage.id);
              setOutgoingCall({ ...lastMessage, id: lastMessage.id, conversationId: conversationData.id });
              setChannelName(lastMessage.callData.channelName);
              setCallType(lastMessage.callData.callType);
              setCallStartTime(Date.now());
              activeCallId.current = lastMessage.id;
            }
          } else if (
            lastMessage?.type === 'call' &&
            ['rejected', 'ended'].includes(lastMessage.callData?.status || '') &&
            lastMessage.id === activeCallId.current
          ) {
            //console.debug('Closing call modals due to status:', lastMessage.callData.status);
            setIsVideoCallOpen(false);
            setCallType(null);
            setChannelName(null);
            setOutgoingCall(null);
            setCallStartTime(null);
            activeCallId.current = null;
            //toast.info(`Call ${lastMessage.callData.status}: ${lastMessage.callData.callType} call`);
          }
        } else {
          console.error('Conversation document does not exist:', initialConversation.id);
          toast.error('Conversation not found.');
        }
      },
      (error) => {
        console.error('Error fetching conversation updates:', error);
        toast.error('Failed to load conversation updates.');
      }
    );

    // Poll for call status updates to mitigate Firestore latency
    pollIntervalRef.current = setInterval(async () => {
      if (!activeCallId.current) return;
      const messageDocRef: DocumentReference = firestoreDoc(db, `artifacts/${appId}/conversations/${initialConversation.id}/messages/${activeCallId.current}`);
      const messageDoc = await getDoc(messageDocRef);
      if (messageDoc.exists()) {
        const messageData = messageDoc.data() as Message;
        if (messageData.callData?.status === 'accepted' && !isVideoCallOpen) {
          console.debug('Polled accepted call, opening VideoCallModal:', activeCallId.current);
          setCallType(messageData.callData.callType);
          setChannelName(messageData.callData.channelName);
          setIsVideoCallOpen(true);
          setOutgoingCall(null);
          setCallStartTime(Date.now());
        } else if (['rejected', 'ended'].includes(messageData.callData?.status || '')) {
          //console.debug('Polled call status:', messageData.callData.status);
          setIsVideoCallOpen(false);
          setCallType(null);
          setChannelName(null);
          setOutgoingCall(null);
          setCallStartTime(null);
          activeCallId.current = null;
          //toast.info(`Call ${messageData.callData.status}: ${messageData.callData.callType} call`);
        }
      }
    }, 2000);

    return () => {
      unsubscribe();
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [initialConversation.id, currentUser.id, isVideoCallOpen]);

  useEffect(() => {
    if (!outgoingCall || !outgoingCall.callData) return;

    const timeout = setTimeout(async () => {
      if (!outgoingCall || !outgoingCall.callData || outgoingCall.callData.status !== 'initiated') return;

      try {
        const messageDocRef: DocumentReference = firestoreDoc(
          db,
          `artifacts/${appId}/conversations/${conversation.id}/messages/${outgoingCall.id}`
        );
        const messageDoc = await getDoc(messageDocRef);
        if (!messageDoc.exists()) {
          console.warn('Message document does not exist:', outgoingCall.id);
          setOutgoingCall(null);
          activeCallId.current = null;
          return;
        }

        // Check if the call was accepted before timing out
        const updatedMessage = (await getDoc(messageDocRef)).data() as Message;
        if (updatedMessage.callData?.status === 'accepted') {
          console.debug('Call was accepted, aborting timeout.');
          return;
        }

        await updateDoc(messageDocRef, {
          callData: { ...outgoingCall.callData, status: 'ended' },
          content: `Missed ${outgoingCall.callData.callType} call`,
          timestamp: serverTimestamp(),
        });

        const conversationDocRef: DocumentReference = firestoreDoc(db, `artifacts/${appId}/conversations/${conversation.id}`);
        await updateDoc(conversationDocRef, {
          lastMessage: {
            ...outgoingCall,
            callData: { ...outgoingCall.callData, status: 'ended' },
            content: `Missed ${outgoingCall.callData.callType} call`,
            timestamp: serverTimestamp(),
          },
        });

        setOutgoingCall(null);
        activeCallId.current = null;
        toast.info('Call timed out: No response from the recipient.');
      } catch (error) {
        console.error('Error timing out call:', error);
        toast.error('Failed to update call status.');
      }
    }, 60000); // Increased timeout to 60 seconds

    return () => clearTimeout(timeout);
  }, [outgoingCall, conversation.id]);

  const getParticipantDetails = (userId: string) => {
    return (
      allUsers.find((user) => user.id === userId) || {
        id: userId,
        username: 'Unknown',
        email: 'unknown@example.com',
        profilePicture: `https://ui-avatars.com/api/?name=${encodeURIComponent('U')}&background=random&color=fff&size=128`,
        isOnline: false,
        createdAt: new Date().toISOString(),
      }
    );
  };

  const getStatusText = () => {
    const isTyping = conversation?.typingUsers?.includes(otherUser?.id ?? '') || false;
    if (isTyping) {
      return { text: 'Typing...', className: 'text-blue-500' };
    }
    if (otherUser?.isOnline) {
      return { text: 'Online', className: 'text-green-500' };
    }
    if (otherUser?.lastSeen) {
      return { text: `Last seen ${dayjs(otherUser.lastSeen).fromNow()}`, className: 'text-gray-500' };
    }
    return { text: 'Offline', className: 'text-gray-500' };
  };

  const initiateCall = async (type: 'video' | 'audio') => {
    if (!conversation?.id || !currentUser?.id || !otherUser) {
      toast.error('Cannot initiate call.');
      return;
    }

    if (!otherUser.isOnline) {
      toast.error('User is offline.');
      return;
    }

    try {
      const permissions = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video',
      });
      permissions.getTracks().forEach((track) => track.stop());
    } catch (error) {
      console.error('Permission denied:', error);
      toast.error('Camera or microphone access denied.');
      return;
    }

    const channelName = `call_${conversation.id}_${Date.now()}`;
    const messageId = uuidv4();
    const timestamp = new Date().toISOString();

    const callMessage: Message = {
      id: messageId,
      senderId: currentUser.id,
      receiverId: otherUser.id,
      content: `Initiated a ${type} call`,
      timestamp,
      type: 'call',
      callData: {
        channelName,
        callType: type,
        initiatorId: currentUser.id,
        receiverId: otherUser.id,
        status: 'initiated',
        timestamp,
      },
      readBy: [currentUser.id],
      conversationId: conversation.id,
    };

    try {
      const messagesCollectionRef = collection(
        db,
        `artifacts/${appId}/conversations/${conversation.id}/messages`
      );
      const docRef = await addDoc(messagesCollectionRef, {
        ...callMessage,
        timestamp: serverTimestamp(),
      });

      const messageDocRef: DocumentReference = firestoreDoc(
        db,
        `artifacts/${appId}/conversations/${conversation.id}/messages/${docRef.id}`
      );
      const messageDoc = await getDoc(messageDocRef);
      if (!messageDoc.exists()) {
        throw new Error('Failed to create call message.');
      }

      const conversationDocRef: DocumentReference = firestoreDoc(db, `artifacts/${appId}/conversations/${conversation.id}`);
      await updateDoc(conversationDocRef, {
        lastMessage: {
          ...callMessage,
          id: docRef.id,
          timestamp,
        },
        typingUsers: [],
      });

      setOutgoingCall({ ...callMessage, id: docRef.id });
      setChannelName(channelName);
      setCallType(type);
      setCallStartTime(Date.now());
      activeCallId.current = docRef.id;
    } catch (error: any) {
      console.error('Error initiating call:', error);
      toast.error('Failed to initiate call.');
    }
  };

  const handleCallCancel = async () => {
    if (!outgoingCall || !outgoingCall.callData) return;

    try {
      const messageDocRef: DocumentReference = firestoreDoc(
        db,
        `artifacts/${appId}/conversations/${conversation.id}/messages/${outgoingCall.id}`
      );
      const messageDoc = await getDoc(messageDocRef);
      if (!messageDoc.exists()) {
        console.warn('Message document does not exist:', outgoingCall.id);
        setOutgoingCall(null);
        activeCallId.current = null;
        return;
      }

      await updateDoc(messageDocRef, {
        callData: { ...outgoingCall.callData, status: 'ended' },
        content: `Cancelled ${outgoingCall.callData.callType} call`,
        timestamp: serverTimestamp(),
      });

      const conversationDocRef: DocumentReference = firestoreDoc(db, `artifacts/${appId}/conversations/${conversation.id}`);
      await updateDoc(conversationDocRef, {
        lastMessage: {
          ...outgoingCall,
          callData: { ...outgoingCall.callData, status: 'ended' },
          content: `Cancelled ${outgoingCall.callData.callType} call`,
          timestamp: serverTimestamp(),
        },
      });

      setOutgoingCall(null);
      setChannelName(null);
      setCallType(null);
      setCallStartTime(null);
      activeCallId.current = null;
    } catch (error: any) {
      console.error('Error cancelling call:', error);
      toast.error('Failed to cancel call.');
    }
  };

  const handleCallEnd = async () => {
    if (!channelName || !callType || !activeCallId.current) {
      setIsVideoCallOpen(false);
      setCallType(null);
      setChannelName(null);
      setOutgoingCall(null);
      setCallStartTime(null);
      activeCallId.current = null;
      return;
    }

    const callDuration = callStartTime ? Math.floor((Date.now() - callStartTime) / 1000) : 0;
    const durationText = formatDuration(callDuration);

    try {
      const message = messages.find((m) => m.type === 'call' && m.callData?.channelName === channelName);
      if (!message) {
        console.error('No matching call message found for channel:', channelName);
        toast.error('Call message not found.');
        setIsVideoCallOpen(false);
        setCallType(null);
        setChannelName(null);
        setOutgoingCall(null);
        setCallStartTime(null);
        activeCallId.current = null;
        return;
      }

      const messageDocRef: DocumentReference = firestoreDoc(
        db,
        `artifacts/${appId}/conversations/${conversation.id}/messages/${message.id}`
      );
      const messageDoc = await getDoc(messageDocRef);
      if (!messageDoc.exists()) {
        console.warn('Message document does not exist:', message.id);
        setIsVideoCallOpen(false);
        setCallType(null);
        setChannelName(null);
        setOutgoingCall(null);
        setCallStartTime(null);
        activeCallId.current = null;
        return;
      }

      await updateDoc(messageDocRef, {
        callData: { ...message.callData, status: 'ended', duration: callDuration },
        content: `Ended ${callType} call (${durationText})`,
        timestamp: serverTimestamp(),
      });

      const conversationDocRef: DocumentReference = firestoreDoc(db, `artifacts/${appId}/conversations/${conversation.id}`);
      await updateDoc(conversationDocRef, {
        lastMessage: {
          id: message.id,
          senderId: message.senderId,
          receiverId: message.receiverId,
          content: `Ended ${callType} call (${durationText})`,
          timestamp: serverTimestamp(),
          type: 'call',
          callData: { ...message.callData, status: 'ended', duration: callDuration },
          readBy: message.readBy,
          conversationId: conversation.id,
        },
      });
    } catch (error: any) {
      console.error('Error ending call:', error);
      toast.error('Failed to end call.');
    } finally {
      setIsVideoCallOpen(false);
      setCallType(null);
      setChannelName(null);
      setOutgoingCall(null);
      setCallStartTime(null);
      activeCallId.current = null;
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isLoadingUser || isLoadingMessages || !otherUser) {
    return (
      <div className="flex items-center justify-center h-full bg-background text-text-secondary text-lg">
        Loading conversation...
      </div>
    );
  }

  const headerInfo = {
    name: otherUser.username,
    image:
      otherUser.profilePicture ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.username || 'U')}&background=random&color=fff&size=128`,
    status: getStatusText(),
  };

  return (
    <motion.div
      className="flex flex-col h-full"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between p-3 bg-background border-b border-border shadow-sm sticky top-0 z-10">
        <div className="flex items-center">
          <motion.button
            className="p-2 mr-2 rounded-full hover:bg-input-bg transition-colors duration-200"
            onClick={onGoBack}
            title="Back to conversations"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FiChevronLeft size={24} className="text-text-primary" />
          </motion.button>
          <div className="relative">
            <img
              src={headerInfo.image}
              alt={headerInfo.name}
              className={`w-10 h-10 rounded-full object-cover mr-3 ${otherUser.isOnline ? 'border-2 border-green-500' : 'border-2 border-transparent'}`}
              onError={(e) => {
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(headerInfo.name || 'U')}&background=random&color=fff&size=128`;
              }}
            />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">{headerInfo.name}</h2>
            <AnimatePresence mode="wait">
              <motion.span
                key={headerInfo.status.text}
                className={`text-sm font-medium ${headerInfo.status.className}`}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
              >
                {headerInfo.status.text}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <motion.button
            onClick={() => initiateCall('video')}
            className="p-2 rounded-full hover:bg-input-bg transition-colors duration-200"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Start Video Call"
          >
            <FiVideo size={24} className="text-text-primary" />
          </motion.button>
          <motion.button
            onClick={() => initiateCall('audio')}
            className="p-2 rounded-full hover:bg-input-bg transition-colors duration-200"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Start Audio Call"
          >
            <FiPhone size={24} className="text-text-primary" />
          </motion.button>
          <motion.button
            className="p-2 rounded-full hover:bg-input-bg transition-colors duration-200"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="User Info"
          >
            <FiInfo size={24} className="text-text-secondary" />
          </motion.button>
        </div>
      </div>
      <ScrollToBottom
        className="flex-1 p-4 overflow-y-auto bg-background pb-16 sm:pb-4"
        scrollViewClassName="messages-container"
        initialScrollBehavior="auto"
        followButtonClassName="hidden"
      >
        <style>
          {`
            .messages-container::-webkit-scrollbar {
              display: none;
            }
            .messages-container {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}
        </style>
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-text-secondary text-lg">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.senderId === currentUser.id;
            const senderDetails = isOwnMessage ? currentUser : getParticipantDetails(message.senderId);

            return (
              <MessageBubble
                key={message.id}
                message={message}
                isOwnMessage={isOwnMessage}
                sender={senderDetails}
              />
            );
          })
        )}
      </ScrollToBottom>
      <div className="p-3 bg-background border-t border-border shadow-md sticky bottom-0 z-10">
        <ChatInput onSendMessage={onSendMessage} conversationId={conversation.id} />
      </div>
      {isVideoCallOpen && callType && channelName && (
        <VideoCallModal
          channelName={channelName}
          callType={callType}
          currentUser={currentUser}
          otherUser={otherUser}
          onClose={handleCallEnd}
          callStartTime={callStartTime}
        />
      )}
      {outgoingCall && outgoingCall.callData && (
        <OutgoingCallModal
          recipient={otherUser}
          callType={outgoingCall.callData.callType}
          onCancel={handleCallCancel}
        />
      )}
    </motion.div>
  );
};

export default ChatWindow;