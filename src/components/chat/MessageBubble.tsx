import React from 'react';
import { FiFile, FiCheck, FiCheckCircle } from 'react-icons/fi';
import type { Message } from '../../types/message';
import type { User } from '../../types/user';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { motion } from 'framer-motion';

dayjs.extend(localizedFormat);

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  sender: User;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwnMessage, sender }) => {
  const bubbleClasses = isOwnMessage
    ? 'bg-message-bg-self text-text-primary ml-auto rounded-br-none'
    : 'bg-message-bg-other text-text-primary mr-auto rounded-bl-none';

  const isRead = isOwnMessage && message.readBy?.includes(message.receiverId);

  return (
    <motion.div
      className={`flex items-end mb-4 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {!isOwnMessage && (
        <img
          src={sender.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(sender.username || 'U')}&background=random&color=fff&size=128`}
          alt={sender.username}
          className="w-8 h-8 rounded-full object-cover mr-2"
          onError={(e) => {
            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(sender.username || 'U')}&background=random&color=fff&size=128`;
          }}
        />
      )}
      <div className={`flex flex-col max-w-[70%] sm:max-w-[60%] p-3 rounded-xl shadow-sm ${bubbleClasses}`}>
        {!isOwnMessage && (
          <span className="text-xs font-semibold mb-1 text-primary">
            {sender.username}
          </span>
        )}
        {message.type === 'text' && (
          <p className="text-sm break-words">{message.content}</p>
        )}
        {message.type === 'image' && message.imageUrl && (
          <img
            src={message.imageUrl}
            alt="Sent image"
            className="max-w-full h-auto rounded-lg mb-2"
            onError={(e) => {
              e.currentTarget.src = 'https://placehold.co/150x100/FF0000/FFFFFF?text=Image+Error';
              e.currentTarget.alt = 'Image failed to load';
            }}
          />
        )}
        {message.type === 'file' && message.fileUrl && message.fileName && (
          <a
            href={message.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-primary hover:underline text-sm"
          >
            <FiFile size={16} className="mr-1" /> {message.fileName}
          </a>
        )}
        {message.type === 'video' && message.fileUrl && (
          <video controls src={message.fileUrl} className="max-w-full h-auto rounded-lg mb-2">
            Your browser does not support the video tag.
          </video>
        )}
        <div className={`flex items-center justify-end text-xs mt-1 ${isOwnMessage ? 'text-gray-600 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>
          <span>{dayjs(message.timestamp).format('LT')}</span>
          {isOwnMessage && (
            <span className="ml-1">
              {isRead ? (
                <FiCheckCircle size={12} className="text-primary" title="Read" />
              ) : (
                <FiCheck size={12} className="text-gray-500" title="Sent" />
              )}
            </span>
          )}
        </div>
      </div>
      {isOwnMessage && (
        <img
          src={sender.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(sender.username || 'U')}&background=random&color=fff&size=128`}
          alt={sender.username}
          className="w-8 h-8 rounded-full object-cover ml-2"
          onError={(e) => {
            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(sender.username || 'U')}&background=random&color=fff&size=128`;
          }}
        />
      )}
    </motion.div>
  );
};

export default MessageBubble;