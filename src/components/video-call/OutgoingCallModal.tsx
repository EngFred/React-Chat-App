import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPhoneOff } from 'react-icons/fi';
import type { User } from '../../types/user';

interface OutgoingCallModalProps {
  recipient: User;
  callType: 'video' | 'audio';
  onCancel: () => void;
}

const OutgoingCallModal: React.FC<OutgoingCallModalProps> = ({ recipient, callType, onCancel }) => {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          className="bg-background rounded-lg p-6 max-w-sm w-full border border-border shadow-lg"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center justify-center mb-4">
            <img
              src={
                recipient.profilePicture ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(recipient.username || 'U')}&background=random&color=fff&size=128`
              }
              alt={recipient.username}
              className="w-12 h-12 rounded-full object-cover mr-3"
              onError={(e) => {
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(recipient.username || 'U')}&background=random&color=fff&size=128`;
              }}
            />
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                Calling {recipient.username} ({callType === 'video' ? 'Video' : 'Audio'} Call)...
              </h2>
              <p className="text-sm text-text-secondary">Waiting for response...</p>
            </div>
          </div>
          <div className="flex justify-center">
            <motion.button
              onClick={onCancel}
              className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiPhoneOff size={20} className="mr-2" /> Cancel
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OutgoingCallModal;