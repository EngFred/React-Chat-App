import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheck, FiX } from 'react-icons/fi';
import type { Message } from '../../types/message';
import type { User } from '../../types/user';

interface CallNotificationModalProps {
  message: Message;
  sender: User;
  onAccept: () => void;
  onReject: () => void;
}

const CallNotificationModal: React.FC<CallNotificationModalProps> = ({ message, sender, onAccept, onReject }) => {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="bg-background rounded-2xl p-6 max-w-md w-full border border-border shadow-2xl"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-center mb-4">
            <img
              src={sender.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(sender.username || 'U')}&background=random&color=fff&size=128`}
              alt={sender.username}
              className="w-12 h-12 rounded-full object-cover mr-3"
              onError={(e) => {
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(sender.username || 'U')}&background=random&color=fff&size=128`;
              }}
            />
            <div>
              <h2 className="text-xl font-bold text-text-primary">
                Incoming {message.callData?.callType === 'video' ? 'Video' : 'Audio'} Call
              </h2>
              <p className="text-sm text-text-secondary">{sender.username}</p>
            </div>
          </div>
          <div className="flex justify-center space-x-4">
            <motion.button
              onClick={onAccept}
              className="flex items-center px-4 py-2 bg-primary text-[var(--color-button-text)] rounded-lg hover:bg-primary/80 transition-colors duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiCheck size={20} className="mr-2" /> Accept
            </motion.button>
            <motion.button
              onClick={onReject}
              className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiX size={20} className="mr-2" /> Reject
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CallNotificationModal;