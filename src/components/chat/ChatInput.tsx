import React, { useState, useRef, useEffect } from 'react';
import { FiSend, FiPaperclip, FiSmile } from 'react-icons/fi';
import EmojiPicker from 'emoji-picker-react';
import type { EmojiClickData } from 'emoji-picker-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'react-toastify';

interface ChatInputProps {
  onSendMessage: (text: string, type: 'text' | 'image' | 'video' | 'file', file?: File) => void;
  conversationId: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, conversationId }) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  // const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  // const fileInputRef = useRef<HTMLInputElement>(null);
  // const imageInputRef = useRef<HTMLInputElement>(null);
  // const videoInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { userId, setTypingStatus } = useAuthStore();

  useEffect(() => {
    if (!userId || !conversationId) return;

    if (message.trim()) {
      setTypingStatus(conversationId, userId, true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setTypingStatus(conversationId, userId, false);
      }, 3000);
    } else {
      setTypingStatus(conversationId, userId, false);
    }

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (userId && conversationId) setTypingStatus(conversationId, userId, false);
    };
  }, [message, userId, conversationId, setTypingStatus]);

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim(), 'text');
      setMessage('');
      setShowEmojiPicker(false);
      // setShowAttachmentOptions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setMessage((prevMsg) => prevMsg + emojiData.emoji);
  };

  // const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'file') => {
  //   const files = event.target.files;
  //   if (files && files.length > 0) {
  //     const file = files[0];
  //     onSendMessage('', type, file);
  //     event.target.value = '';
  //   }
  //   setShowAttachmentOptions(false);
  // };

  const handleAttachmentClick = () => {
    toast.info('File uploads are disabled.');
  };

  return (
    <div className="relative flex items-center p-2 rounded-lg bg-input-bg border border-border shadow-inner max-w-2xl mx-auto">
      <motion.button
        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        className="p-1.5 rounded-full hover:bg-background text-text-secondary transition-colors duration-200"
        title="Open emoji picker"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <FiSmile size={18} />
      </motion.button>
      <motion.button
        onClick={handleAttachmentClick}
        className="p-1.5 rounded-full hover:bg-background text-text-secondary transition-colors duration-200 ml-1 opacity-50 cursor-not-allowed"
        title="File uploads disabled"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <FiPaperclip size={18} />
      </motion.button>
      {/* <AnimatePresence>
        {showAttachmentOptions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-0 mb-2 p-2 bg-background rounded-lg shadow-lg flex flex-col space-y-1 z-50"
          >
            <input
              type="file"
              ref={imageInputRef}
              onChange={(e) => handleFileChange(e, 'image')}
              className="hidden"
              accept="image/*"
            />
            <motion.button
              onClick={() => imageInputRef.current?.click()}
              className="flex items-center px-3 py-1.5 rounded-md hover:bg-input-bg text-text-primary text-sm"
              whileHover={{ backgroundColor: 'var(--color-input-bg)' }}
            >
              <FiImage size={14} className="mr-2" /> Image
            </motion.button>
            <input
              type="file"
              ref={videoInputRef}
              onChange={(e) => handleFileChange(e, 'video')}
              className="hidden"
              accept="video/*"
            />
            <motion.button
              onClick={() => videoInputRef.current?.click()}
              className="flex items-center px-3 py-1.5 rounded-md hover:bg-input-bg text-text-primary text-sm"
              whileHover={{ backgroundColor: 'var(--color-input-bg)' }}
            >
              <FiVideo size={14} className="mr-2" /> Video
            </motion.button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileChange(e, 'file')}
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
            />
            <motion.button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center px-3 py-1.5 rounded-md hover:bg-input-bg text-text-primary text-sm"
              whileHover={{ backgroundColor: 'var(--color-input-bg)' }}
            >
              <FiPaperclip size={14} className="mr-2" /> File
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence> */}
      <motion.textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        rows={1}
        className="flex-1 mx-2 p-1.5 rounded-lg bg-transparent text-text-primary resize-none outline-none focus:ring-2 focus:ring-primary text-sm"
        style={{ maxHeight: '40px', overflowY: 'auto' }}
        whileFocus={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      />
      <motion.button
        onClick={handleSend}
        className="p-1.5 rounded-full bg-gradient-to-r from-primary to-secondary text-[var(--color-button-text)] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!message.trim()}
        title="Send message"
        whileHover={{ scale: 1.1, boxShadow: '0 0 8px var(--color-accent)' }}
        whileTap={{ scale: 0.9 }}
      >
        <FiSend size={18} />
      </motion.button>
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full right-0 mb-2 z-50 shadow-lg rounded-lg overflow-hidden"
          >
            <EmojiPicker onEmojiClick={onEmojiClick} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatInput;