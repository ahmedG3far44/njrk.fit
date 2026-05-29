import { motion, AnimatePresence } from 'motion/react';
import { type ReactNode } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  icon?: ReactNode;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'primary';
  loading?: boolean;
  children?: ReactNode;
}

export const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  icon,
  confirmLabel = 'Confirm',
  confirmVariant = 'danger',
  loading,
  children,
}: ConfirmDialogProps) => (
  <AnimatePresence>
    {open && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={e => e.stopPropagation()}
          className="bg-peak-white rounded-container p-6 max-w-sm w-full shadow-modal"
        >
          {icon && (
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 bg-ember/5">
              {icon}
            </div>
          )}
          <h3 className="text-heading text-summit-black text-center mb-2">{title}</h3>
          <p className="text-body text-trail-gray text-center mb-4">{description}</p>
          {children}
          <div className="flex gap-3 mt-4">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-button border border-limestone font-semibold text-trail-gray text-sm hover:bg-stone transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 py-2.5 rounded-button font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                confirmVariant === 'danger'
                  ? 'bg-ember text-peak-white hover:opacity-90'
                  : 'bg-forest-canopy text-peak-white hover:bg-forest-deep'
              }`}
            >
              {loading && (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {confirmLabel}
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);
