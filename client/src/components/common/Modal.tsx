import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  disableClose?: boolean;
  ariaLabelledBy?: string;
}

const maxWidthMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  maxWidth = 'md',
  className = '',
  disableClose = false,
  ariaLabelledBy,
}) => {
  // Lock body scroll when modal is active to prevent page scrolling underneath
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !disableClose) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, disableClose, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledBy}
      onClick={() => {
        if (!disableClose) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm modal-backdrop-animate cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full p-6 shadow-2xl modal-dialog-animate space-y-5 cursor-default max-h-[calc(100vh-2rem)] overflow-y-auto ${maxWidthMap[maxWidth]} ${className}`}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};
