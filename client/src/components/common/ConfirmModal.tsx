import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  highlightContent?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Xác nhận xóa',
  description = 'Hành động này không thể hoàn tác. Bạn có chắc chắn muốn tiếp tục?',
  highlightContent,
  confirmText = 'Xác Nhận Xóa',
  cancelText = 'Hủy Bỏ',
  variant = 'danger',
  isLoading = false,
}) => {
  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const isDanger = variant === 'danger';
  const isWarning = variant === 'warning';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm modal-backdrop-animate"
      onClick={() => {
        if (!isLoading) onClose();
      }}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl modal-dialog-animate space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Icon badge & Close button */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`h-11 w-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform ${
                isDanger
                  ? 'bg-rose-500/10 text-rose-500 ring-8 ring-rose-500/5'
                  : isWarning
                  ? 'bg-amber-500/10 text-amber-500 ring-8 ring-amber-500/5'
                  : 'bg-brand/10 text-brand ring-8 ring-brand/5'
              }`}
            >
              {isDanger ? (
                <Trash2 className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>

            <div>
              <h3
                id="confirm-modal-title"
                className="font-bold text-base text-slate-900 dark:text-slate-100"
              >
                {title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                {description}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            aria-label="Đóng"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 cursor-pointer flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Highlight content block (e.g. details of transaction/category) */}
        {highlightContent && (
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-100 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300">
            {highlightContent}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 pt-2">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            {cancelText}
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs text-white shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/25'
                : isWarning
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/25'
                : 'bg-brand hover:bg-brand-hover shadow-brand/25'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
