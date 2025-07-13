import React, { useState, useEffect, useCallback } from 'react';
import { useThemeStore } from '../../store/themeStore';
import UserList from '../../components/chat/UserList';
import ChatWindow from '../../components/chat/ChatWindow';
import type { User } from '../../types/user';
import type { Conversation } from '../../types/conversation';
import type { Message } from '../../types/message';
import { FiMenu, FiLogOut, FiSettings } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import type { Theme } from '../../types/theme';
import { useAuthStore } from '../../store/authStore';
import { collection, query, where, onSnapshot, orderBy, addDoc, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db, appId } from '../../config/firebase';
import { v4 as uuidv4 } from 'uuid';
import { cloudinaryConfig } from '../../config/cloudinary';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const ChatPage: React.FC = () => {
  const { currentTheme, setTheme } = useThemeStore();
  const { currentUser, userId, loadingAuth, logout, markMessagesAsRead } = useAuthStore();
  const navigate = useNavigate();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [selectedOtherUser, setSelectedOtherUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!userId || loadingAuth) return;

    const usersRef = collection(db, `artifacts/${appId}/users`);
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const usersData: User[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Omit<User, 'id'>,
      })).filter(user => user.id !== userId);
      setAllUsers(usersData);
    }, (error) => {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users.");
    });

    return () => unsubscribe();
  }, [userId, loadingAuth]);

  useEffect(() => {
    if (!userId || loadingAuth) return;

    const q = query(
      collection(db, `artifacts/${appId}/conversations`),
      where('participants', 'array-contains', userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedConversations: Conversation[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Omit<Conversation, 'id'>,
      }));
      setConversations(fetchedConversations);
    }, (error) => {
      console.error("Error fetching conversations:", error);
      toast.error("Failed to load conversations.");
    });

    return () => unsubscribe();
  }, [userId, loadingAuth]);

  useEffect(() => {
    if (!selectedConversation?.id || !userId || loadingAuth) {
      setMessages([]);
      setIsLoadingMessages(false);
      return;
    }

    setIsLoadingMessages(true);
    const messagesRef = collection(db, `artifacts/${appId}/conversations/${selectedConversation.id}/messages`);
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages: Message[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Omit<Message, 'id'>,
        timestamp: (doc.data().timestamp?.toDate() || new Date()).toISOString(),
      }));
      setMessages(fetchedMessages);
      setIsLoadingMessages(false);

      // Mark messages as read
      markMessagesAsRead(selectedConversation.id, userId);
    }, (error) => {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages.");
      setIsLoadingMessages(false);
    });

    return () => unsubscribe();
  }, [selectedConversation?.id, userId, loadingAuth, markMessagesAsRead]);

  const findOrCreateConversation = useCallback(async (otherUserId: string): Promise<Conversation> => {
    if (!userId) throw new Error("Current user ID is not available.");

    const q = query(
      collection(db, `artifacts/${appId}/conversations`),
      where('participants', 'array-contains', userId),
      where('type', '==', 'private')
    );

    const existingConversations = await getDocs(q);

    const foundConversation = existingConversations.docs.find(docSnap => {
      const data = docSnap.data();
      const participants = data.participants as string[];
      return participants.length === 2 && participants.includes(otherUserId);
    });

    if (foundConversation) {
      return { id: foundConversation.id, ...foundConversation.data() } as Conversation;
    } else {
      const newConversation: Omit<Conversation, 'id'> = {
        type: 'private',
        participants: [userId, otherUserId],
        lastMessage: null,
        unreadCount: 0,
        typingUsers: [],
      };
      const docRef = await addDoc(collection(db, `artifacts/${appId}/conversations`), newConversation);
      toast.success("New conversation created!");
      return { id: docRef.id, ...newConversation };
    }
  }, [userId]);

  const resetChatState = useCallback(() => {
    setMessages([]);
    setIsLoadingMessages(true);
  }, []);

  const handleSelectUserForChat = useCallback(async (user: User) => {
    if (!currentUser || !userId) {
      toast.error("You must be logged in to start a conversation.");
      return;
    }
    if (user.id === userId) {
      toast.info("You cannot chat with yourself.");
      return;
    }

    try {
      resetChatState();
      const conv = await findOrCreateConversation(user.id);
      setSelectedConversation(conv);
      setSelectedOtherUser(user);
      setIsSidebarOpen(window.innerWidth < 1024 ? false : true);
    } catch (error) {
      console.error("Error selecting user for chat:", error);
      toast.error("Failed to start conversation.");
    }
  }, [currentUser, userId, findOrCreateConversation, resetChatState]);

  const handleSendMessage = async (text: string, type: 'text' | 'image' | 'video' | 'file', file?: File) => {
    if (!selectedConversation || !currentUser) {
      toast.error("Please select a conversation and ensure you are logged in to send messages.");
      return;
    }

    const messageId = uuidv4();
    const timestamp = new Date();
    let messageContent = text;
    let messageData: Partial<Message> = {
      id: messageId,
      senderId: currentUser.id,
      receiverId: selectedConversation.participants.find(p => p !== currentUser.id) || '',
      content: messageContent,
      timestamp: timestamp.toISOString(),
      type: type,
      readBy: [currentUser.id],
    };

    if (type !== 'text' && file) {
      try {
        const { cloudName, uploadPreset } = cloudinaryConfig;

        if (!cloudName || !uploadPreset) {
          toast.error("Cloudinary configuration missing. Cannot upload files.");
          console.error("Cloudinary upload_preset or cloud_name is not set.");
          return;
        }

        toast.info(`Uploading ${file.name}...`);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);

        const response = await axios.post(
          `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
          formData
        );

        if (response.data && response.data.secure_url) {
          if (type === 'image') {
            messageData.imageUrl = response.data.secure_url;
            messageContent = `[Image: ${file.name}]`;
          } else if (type === 'video') {
            messageData.fileUrl = response.data.secure_url;
            messageData.fileName = file.name;
            messageContent = `[Video: ${file.name}]`;
          } else {
            messageData.fileUrl = response.data.secure_url;
            messageData.fileName = file.name;
            messageContent = `[File: ${file.name}]`;
          }
          messageData.content = messageContent;
          toast.success(`${file.name} uploaded!`);
        } else {
          throw new Error("Cloudinary upload failed: No secure_url in response.");
        }
      } catch (error) {
        console.error('Cloudinary upload error:', error);
        toast.error(`Failed to upload ${file.name}.`);
        return;
      }
    }

    if (!messageData.imageUrl) messageData.imageUrl = null;
    if (!messageData.fileUrl) messageData.fileUrl = null;
    if (!messageData.fileName) messageData.fileName = null;

    try {
      const messagesCollectionRef = collection(db, `artifacts/${appId}/conversations/${selectedConversation.id}/messages`);
      await addDoc(messagesCollectionRef, {
        ...messageData,
        timestamp: timestamp,
      });

      const conversationDocRef = doc(db, `artifacts/${appId}/conversations`, selectedConversation.id);
      await updateDoc(conversationDocRef, {
        lastMessage: {
          content: messageData.content,
          timestamp: timestamp,
          senderId: messageData.senderId,
          type: messageData.type,
          imageUrl: messageData.imageUrl || null,
          fileUrl: messageData.fileUrl || null,
          fileName: messageData.fileName || null,
        },
        typingUsers: [],
      });

      setSelectedConversation(prev => prev ? { ...prev, lastMessage: messageData as Message, typingUsers: [] } : null);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message.");
    }
  };

  const themes: Theme[] = ['crystal-light', 'midnight-glow', 'ocean-breeze', 'sunset-glow', 'slate-elegance'];

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    try {
      await logout();
      navigate('/');
      setShowLogoutModal(false);
    } catch (error) {
      // Error handled by toast in authStore
      setShowLogoutModal(false);
    }
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const handleGoBackToUserList = () => {
    resetChatState();
    setSelectedConversation(null);
    setSelectedOtherUser(null);
    setIsSidebarOpen(true);
  };

  if (loadingAuth || !userId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-text-primary text-lg">
        Loading application...
      </div>
    );
  }

  return (
    <motion.div
      className="flex h-screen overflow-hidden bg-background text-text-primary"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.aside
        className={`fixed inset-y-0 left-0 w-80 md:w-96 bg-background border-r border-border shadow-lg lg:relative lg:translate-x-0 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out z-40 flex flex-col`}
        animate={{ translateX: isSidebarOpen ? 0 : '-100%' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Chat App</h1>
          <div className="flex items-center space-x-2">
            <motion.button
              onClick={() => navigate('/settings')}
              className="p-2 rounded-full hover:bg-input-bg transition-colors duration-200"
              title="Settings"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FiSettings size={20} className="text-text-secondary" />
            </motion.button>
            <motion.button
              onClick={handleLogout}
              className="p-2 rounded-full hover:bg-input-bg transition-colors duration-200"
              title="Logout"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FiLogOut size={20} className="text-text-secondary" />
            </motion.button>
          </div>
        </div>
        <div className="flex-grow overflow-y-auto">
          {currentUser && (
            <UserList
              conversations={conversations}
              onSelectConversation={handleSelectUserForChat}
              selectedConversationId={selectedConversation?.id || null}
              currentUser={currentUser}
              allUsers={allUsers}
            />
          )}
        </div>
        <div className="p-4 border-t border-border mt-auto">
          <h3 className="text-md font-semibold mb-2 text-text-primary">Themes</h3>
          <div className="flex justify-center gap-2 flex-wrap">
            {themes.map((theme) => (
              <motion.button
                key={theme}
                onClick={() => setTheme(theme)}
                className={`p-1 rounded-full border-2 ${currentTheme === theme ? 'border-primary' : 'border-border'} focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200`}
                title={`Set ${theme} theme`}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              >
                <div className={`w-5 h-5 rounded-full theme-${theme} bg-primary`} />
              </motion.button>
            ))}
          </div>
        </div>
      </motion.aside>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <motion.main
        className="flex-1 flex flex-col bg-background"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <header className="p-3 bg-background border-b border-border shadow-sm flex items-center lg:hidden">
          <motion.button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-full hover:bg-input-bg transition-colors duration-200"
            title="Open user list"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FiMenu size={24} className="text-text-primary" />
          </motion.button>
          <h1 className="text-xl font-bold text-primary ml-3">Chats</h1>
        </header>
        {selectedConversation && currentUser && selectedOtherUser ? (
          <ChatWindow
            key={selectedConversation.id}
            conversation={selectedConversation}
            messages={messages}
            currentUser={currentUser}
            allUsers={allUsers}
            onSendMessage={handleSendMessage}
            otherUser={selectedOtherUser}
            onGoBack={handleGoBackToUserList}
            isLoadingMessages={isLoadingMessages}
          />
        ) : (
          <div className="flex items-center justify-center flex-1 text-text-secondary text-lg">
            {loadingAuth ? 'Loading...' : 'Select a user to start chatting.'}
          </div>
        )}
      </motion.main>
      <AnimatePresence>
        {showLogoutModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="bg-background rounded-lg p-6 shadow-lg border border-border max-w-sm w-full"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-lg font-semibold text-text-primary mb-4">Confirm Logout</h2>
              <p className="text-text-secondary mb-6">Are you sure you want to log out?</p>
              <div className="flex justify-end space-x-3">
                <motion.button
                  onClick={cancelLogout}
                  className="px-4 py-2 rounded-lg bg-input-bg text-text-primary hover:bg-gray-300 transition-colors duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={confirmLogout}
                  className="px-4 py-2 rounded-lg bg-primary text-[var(--color-button-text)] hover:bg-secondary transition-colors duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Logout
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ChatPage;