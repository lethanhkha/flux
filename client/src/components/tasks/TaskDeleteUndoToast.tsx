import React, { useState, useEffect } from 'react';
import { Trash2, RotateCcw, X } from 'lucide-react';

export interface TaskDeleteUndoToastProps {
  toastId?: string | number;
  taskTitle: string;
  onUndo: () => void;
  onDismiss?: () => void;
  durationMs?: number;
}

export const TaskDeleteUndoToast: React.FC<TaskDeleteUndoToastProps> = ({
  toastId: _toastId,
  taskTitle,
  onUndo,
  onDismiss,
  durationMs = 6000,
}) => {
  const [remainingMs, setRemainingMs] = useState(durationMs);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const left = Math.max(0, durationMs - elapsed);
      setRemainingMs(left);
      if (left <= 0) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [durationMs]);

  const secondsLeft = Math.max(1, Math.ceil(remainingMs / 1000));
  const progressPercent = Math.max(0, Math.min(100, (remainingMs / durationMs) * 100));

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full sm:w-[390px] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-2xl rounded-2xl overflow-hidden pointer-events-auto transition-all"
    >
      <div className="p-3.5 flex items-center justify-between gap-3">
        {/* Left side: Icon & Info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 dark:bg-rose-500/20 flex-shrink-0">
            <Trash2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                Đã xóa công việc
              </span>
              <span className="text-[11px] font-bold text-rose-500 dark:text-rose-400 tabular-nums">
                ({secondsLeft}s)
              </span>
            </div>
            <p
              className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[160px] sm:max-w-[190px]"
              title={taskTitle}
            >
              "{taskTitle}"
            </p>
          </div>
        </div>

        {/* Right side: Undo button & close */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUndo();
            }}
            className="px-3 py-1.5 rounded-xl bg-brand hover:bg-brand-hover active:scale-95 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand/40"
            aria-label={`Hoàn tác xóa công việc ${taskTitle}`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Hoàn tác</span>
          </button>

          {onDismiss && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Đóng thông báo"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Shrinking 6-second progress bar */}
      <div className="h-1 w-full bg-slate-100 dark:bg-slate-800/80 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-brand via-rose-500 to-amber-500 transition-all duration-75 ease-linear"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};
