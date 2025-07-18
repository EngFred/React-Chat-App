import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';

/**
 * @interface DialogProps
 * @description Props for the reusable Dialog component.
 * @property {boolean} isOpen - Controls the visibility of the dialog.
 * @property {() => void} onClose - Callback function when the dialog is requested to be closed (e.g., by clicking cancel or outside).
 * @property {() => void} onConfirm - Callback function when the confirm action is triggered.
 * @property {string} title - The title displayed at the top of the dialog.
 * @property {string} message - The main content message of the dialog.
 * @property {string} [confirmText='Confirm'] - Text for the confirmation button.
 * @property {string} [cancelText='Cancel'] - Text for the cancel button.
 * @property {boolean} [isConfirming=false] - If true, shows a loading spinner on the confirm button.
 * @property {'default' | 'danger'} [variant='default'] - Styling variant for the confirm button (e.g., 'default' for primary, 'danger' for destructive actions).
 */
interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isConfirming?: boolean;
  variant?: 'default' | 'danger';
}

/**
 * @function Dialog
 * @description A reusable modal dialog component that provides confirmation prompts.
 * It uses Framer Motion for smooth entrance and exit animations.
 * @param {DialogProps} props - The props for the Dialog component.
 * @returns {JSX.Element} The rendered dialog component.
 */
const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isConfirming = false,
  variant = 'default', // Dialog's internal variant type
}) => {
  // Map Dialog's 'default' variant to Button's 'primary' variant
  const buttonVariant = variant === 'default' ? 'primary' : 'danger';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="bg-background rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-sm border border-border text-text-primary"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <h3 className="text-xl font-bold mb-4 text-primary">{title}</h3>
            <p className="text-text-secondary mb-6">{message}</p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="secondary" // Cancel button always uses secondary variant
                onClick={onClose}
                disabled={isConfirming}
                className="min-w-[80px]"
              >
                {cancelText}
              </Button>
              <Button
                variant={buttonVariant} // Use the mapped variant for the confirm button
                onClick={onConfirm}
                disabled={isConfirming}
                className="min-w-[100px]"
              >
                {isConfirming ? (
                  <div className="flex items-center justify-center">
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
                    <span className="ml-2"></span>
                  </div>
                ) : (
                  confirmText
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Dialog;
