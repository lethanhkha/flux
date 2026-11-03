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
      className="w-full sm:w-[390px] bg-card border border-border shadow-2xl rounded-xl overflow-hidden pointer-events-auto"
    >
      <div className="p-3.5 flex items-center justify-between gap-3">
        {/* Left side: Icon & Info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-lg bg-muted text-muted-foreground flex-shrink-0">
            <Trash2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-xs text-foreground">
                Đã xóa công việc
              </span>
              <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                ({secondsLeft}s)
              </span>
            </div>
            <p
              className="text-[11px] text-muted-foreground truncate max-w-[160px] sm:max-w-[190px]"
              title={taskTitle}
            >
              &quot;{taskTitle}&quot;
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
            className="px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-medium hover:bg-foreground/90 flex items-center gap-1.5 transition-colors cursor-pointer focus-ring"
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
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              aria-label="Đóng thông báo"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Shrinking 6-second progress bar */}
      <div className="h-0.5 w-full bg-muted overflow-hidden">
        <div
          className="h-full bg-foreground transition-[width] duration-75 ease-linear"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};
