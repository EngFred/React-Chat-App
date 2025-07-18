import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FiSend, FiPaperclip, FiSmile, FiXCircle, FiImage, FiVideo, FiMusic } from 'react-icons/fi';
import EmojiPicker from 'emoji-picker-react';
import type { EmojiClickData } from 'emoji-picker-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { getMediaTypeFromFile } from '../utils/chatHelpers';

interface ChatInputProps {
  onSendMessage: (text: string) => Promise<void>;
  onSendMediaMessage: (file: File, type: 'image' | 'video' | 'audio') => Promise<void>;
  conversationId: string;
  onSetTypingStatus: (isTyping: boolean) => void;
  isSendingMessage: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onSendMediaMessage,
  conversationId,
  onSetTypingStatus,
  isSendingMessage,
}) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [selectedMediaFile, setSelectedMediaFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const chatInputContainerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const attachmentButtonRef = useRef<HTMLButtonElement>(null);
  const mediaPickerRef = useRef<HTMLDivElement>(null);

  const [emojiPickerOffset, setEmojiPickerOffset] = useState<{ bottom: number; left: number } | null>(null);
  const [mediaPickerOffset, setMediaPickerOffset] = useState<{ bottom: number; left: number } | null>(null);

  const isTypingRef = useRef(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showEmojiPicker &&
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node) &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
      if (
        showMediaPicker &&
        mediaPickerRef.current &&
        !mediaPickerRef.current.contains(event.target as Node) &&
        attachmentButtonRef.current &&
        !attachmentButtonRef.current.contains(event.target as Node)
      ) {
        setShowMediaPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker, showMediaPicker]);

  const calculatePickerPositions = useCallback(() => {
    if (!chatInputContainerRef.current) return;

    const containerRect = chatInputContainerRef.current.getBoundingClientRect();

    if (emojiButtonRef.current) {
      const buttonRect = emojiButtonRef.current.getBoundingClientRect();
      setEmojiPickerOffset({
        bottom: containerRect.height + 10,
        left: buttonRect.left - containerRect.left,
      });
    }

    if (attachmentButtonRef.current) {
      const buttonRect = attachmentButtonRef.current.getBoundingClientRect();
      setMediaPickerOffset({
        bottom: containerRect.height + 10,
        left: buttonRect.left - containerRect.left,
      });
    }
  }, []);

  useEffect(() => {
    calculatePickerPositions();
    const handleResize = () => calculatePickerPositions();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculatePickerPositions, showEmojiPicker, showMediaPicker]);

  useEffect(() => {
    if (!conversationId) return;

    if (!selectedMediaFile && message.trim().length > 0) {
      if (!isTypingRef.current) {
        onSetTypingStatus(true);
        isTypingRef.current = true;
      }
      const timeoutId = setTimeout(() => {
        onSetTypingStatus(false);
        isTypingRef.current = false;
      }, 1500);
      return () => clearTimeout(timeoutId);
    } else {
      if (isTypingRef.current) {
        onSetTypingStatus(false);
        isTypingRef.current = false;
      }
    }
  }, [message, conversationId, onSetTypingStatus, selectedMediaFile]);

  const handleSend = async (): Promise<void> => {
    if (isSendingMessage) return;

    if (selectedMediaFile) {
      const mediaType = getMediaTypeFromFile(selectedMediaFile);
      if (!mediaType) {
        toast.error('Unsupported file type selected.');
        return;
      }
      try {
        await onSendMediaMessage(selectedMediaFile, mediaType);
      } catch (error: any) {
        console.error('[ChatInput] Error sending media message:', error);
        toast.error(`Failed to send media: ${error.message || 'Unknown error'}`);
      } finally {
        setSelectedMediaFile(null);
        setMediaPreviewUrl(null);
        if (imageInputRef.current) imageInputRef.current.value = '';
        if (videoInputRef.current) videoInputRef.current.value = '';
        if (audioInputRef.current) audioInputRef.current.value = '';
      }
    } else if (message.trim()) {
      try {
        await onSendMessage(message.trim());
        setMessage('');
        setShowEmojiPicker(false);
        onSetTypingStatus(false);
        isTypingRef.current = false;
      } catch (error: any) {
        console.error('[ChatInput] Error sending text message:', error);
        toast.error(`Failed to send message: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const onEmojiClick = useCallback((emojiData: EmojiClickData): void => {
    setMessage((prevMsg) => prevMsg + emojiData.emoji);
  }, []);

  const handleAttachmentClick = useCallback((): void => {
    setShowMediaPicker((prev) => !prev);
    setShowEmojiPicker(false);
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setShowMediaPicker(false);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const mediaType = getMediaTypeFromFile(file);

      if (!mediaType) {
        toast.error('Unsupported file type. Please select an image, video, or audio file.');
        e.target.value = '';
        return;
      }

      setSelectedMediaFile(file);
      if (mediaType === 'image' || mediaType === 'video') {
        setMediaPreviewUrl(URL.createObjectURL(file));
      } else {
        setMediaPreviewUrl(null);
      }
      setMessage('');
      setShowEmojiPicker(false);
    }
  }, []);

  const clearSelectedMedia = useCallback(() => {
    setSelectedMediaFile(null);
    setMediaPreviewUrl(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
    if (audioInputRef.current) audioInputRef.current.value = '';
  }, []);

  const triggerImageInput = useCallback(() => {
    imageInputRef.current?.click();
  }, []);

  const triggerVideoInput = useCallback(() => {
    videoInputRef.current?.click();
  }, []);

  const triggerAudioInput = useCallback(() => {
    audioInputRef.current?.click();
  }, []);

  const isSendButtonDisabled = isSendingMessage || (!message.trim() && !selectedMediaFile);

  return (
    <div
      ref={chatInputContainerRef}
      className="relative flex flex-col p-2 sm:p-3 rounded-2xl bg-input-bg border border-border shadow-md w-full sm:max-w-2xl mx-auto"
    >
      <AnimatePresence>
        {selectedMediaFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative mb-2 p-2 bg-background rounded-lg flex items-center justify-center overflow-hidden min-h-[100px]"
          >
            {mediaPreviewUrl && getMediaTypeFromFile(selectedMediaFile) === 'image' && (
              <img src={mediaPreviewUrl} alt="Preview" className="max-w-full max-h-48 rounded-md object-contain" />
            )}
            {mediaPreviewUrl && getMediaTypeFromFile(selectedMediaFile) === 'video' && (
              <video src={mediaPreviewUrl} controls className="max-w-full max-h-48 rounded-md object-contain" />
            )}
            {getMediaTypeFromFile(selectedMediaFile) === 'audio' && (
              <div className="flex flex-col items-center justify-center p-4 text-text-secondary">
                <span className="text-4xl mb-2">🎵</span>
                <p className="text-sm text-center">{selectedMediaFile.name}</p>
                <audio src={URL.createObjectURL(selectedMediaFile)} controls className="mt-2 w-full max-w-xs" />
              </div>
            )}
            <motion.button
              onClick={clearSelectedMedia}
              className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white z-10"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Remove selected media"
            >
              <FiXCircle size={20} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center w-full">
        <motion.button
          ref={emojiButtonRef}
          onClick={() => {
            setShowEmojiPicker((prev) => !prev);
            setShowMediaPicker(false);
          }}
          className="p-2 rounded-full hover:bg-background text-text-secondary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary"
          title="Open emoji picker"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          disabled={isSendingMessage}
        >
          <FiSmile size={20} />
        </motion.button>

        <motion.button
          ref={attachmentButtonRef}
          onClick={handleAttachmentClick}
          className="p-2 rounded-full hover:bg-background text-text-secondary transition-colors duration-200 ml-1 focus:outline-none focus:ring-2 focus:ring-primary"
          title="Attach file"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          disabled={isSendingMessage}
        >
          <FiPaperclip size={20} />
        </motion.button>

        <AnimatePresence>
          {showMediaPicker && mediaPickerOffset && (
            <motion.div
              ref={mediaPickerRef}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute p-2 bg-card rounded-lg shadow-xl border border-border flex flex-col items-start space-y-2 z-50"
              style={{ bottom: mediaPickerOffset.bottom, left: mediaPickerOffset.left }}
            >
              <button
                onClick={triggerImageInput}
                className="flex items-center px-3 py-2 text-text-primary hover:bg-background rounded-md w-full text-left transition-colors duration-150"
                disabled={isSendingMessage}
              >
                <FiImage size={18} className="mr-2 text-primary" /> Image
              </button>
              <button
                onClick={triggerVideoInput}
                className="flex items-center px-3 py-2 text-text-primary hover:bg-background rounded-md w-full text-left transition-colors duration-150"
                disabled={isSendingMessage}
              >
                <FiVideo size={18} className="mr-2 text-accent" /> Video
              </button>
              <button
                onClick={triggerAudioInput}
                className="flex items-center px-3 py-2 text-text-primary hover:bg-background rounded-md w-full text-left transition-colors duration-150"
                disabled={isSendingMessage}
              >
                <FiMusic size={18} className="mr-2 text-green-400" /> Audio
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <input
          type="file"
          ref={imageInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
        <input
          type="file"
          ref={videoInputRef}
          className="hidden"
          accept="video/*"
          onChange={handleFileChange}
        />
        <input
          type="file"
          ref={audioInputRef}
          className="hidden"
          accept="audio/*"
          onChange={handleFileChange}
        />

        <motion.textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={selectedMediaFile ? selectedMediaFile.name : "Type a message..."}
          rows={1}
          className="flex-1 mx-2 p-2 rounded-xl bg-transparent text-text-primary resize-none outline-none focus:ring-2 focus:ring-primary text-base placeholder-text-secondary"
          style={{ maxHeight: '100px', overflowY: 'auto' }}
          whileFocus={{ scale: 1.005 }}
          transition={{ duration: 0.1 }}
          disabled={isSendingMessage || !!selectedMediaFile}
        />

        <motion.button
          onClick={handleSend}
          className="p-2 rounded-full bg-gradient-to-r from-primary to-secondary text-[var(--color-button-text)] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
          disabled={isSendButtonDisabled}
          title="Send message"
          whileHover={{ scale: 1.1, boxShadow: '0 0 10px rgba(var(--color-primary-rgb), 0.5)' }}
          whileTap={{ scale: 0.9 }}
        >
          {isSendingMessage ? (
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ) : (
            <FiSend size={20} />
          )}
        </motion.button>
      </div>

      <AnimatePresence>
        {showEmojiPicker && emojiPickerOffset && (
          <motion.div
            ref={emojiPickerRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 shadow-xl rounded-lg overflow-hidden"
            style={{ bottom: emojiPickerOffset.bottom, left: emojiPickerOffset.left }}
          >
            <EmojiPicker onEmojiClick={onEmojiClick} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatInput;