import React, { useState } from 'react';
import {
  Clock,
  MapPin,
  CheckCircle2,
  Repeat,
  Bell,
  Pencil,
  Trash2,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import {
  ReminderItem,
  formatTimeOnly,
  getReminderCountdown,
  formatRemindBefore,
  SNOOZE_PRESETS,
} from '../../lib/reminderUtils';

interface ReminderCardProps {
  reminder: ReminderItem;
  tagColorMap?: Map<string, string> | Record<string, string>;
  onEdit: (reminder: ReminderItem) => void;
  onDelete: (reminder: ReminderItem) => void;
  onComplete: (id: string) => Promise<void>;
  onSnooze: (id: string, minutes: number) => Promise<void>;
}

export const ReminderCard: React.FC<ReminderCardProps> = ({
  reminder,
  tagColorMap,
  onEdit,
  onDelete,
  onComplete,
  onSnooze,
}) => {
  const [showSnoozeMenu, setShowSnoozeMenu] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const countdown = getReminderCountdown(
    reminder.scheduledAt,
    reminder.status,
    reminder.snoozedUntil
  );

  const isCompleted = reminder.status === 'COMPLETED';
  const isSnoozed = reminder.status === 'SNOOZED';
  const isLink =
    reminder.location &&
    (reminder.location.startsWith('http://') || reminder.location.startsWith('https://'));

  const handleComplete = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await onComplete(reminder.id);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSnooze = async (minutes: number) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setShowSnoozeMenu(false);
    try {
      await onSnooze(reminder.id, minutes);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className={`relative rounded-lg border transition-[border-color] p-4 ${
        isCompleted
          ? 'bg-card/50 border-border/50 opacity-75'
          : countdown.isImminent
          ? 'bg-card border-amber-500/40 dark:border-amber-500/30'
          : 'bg-card border-border hover:border-foreground/30'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Time and Title */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Big Time Block */}
          <div
            className={`flex flex-col items-center justify-center min-w-[64px] h-[58px] rounded-md border font-mono tabular-nums transition-colors shrink-0 ${
              isCompleted
                ? 'bg-muted border-border text-muted-foreground'
                : countdown.isImminent
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold'
                : 'bg-muted border-border text-foreground font-bold'
            }`}
          >
            <span className="text-base font-bold leading-none tracking-tight">
              {formatTimeOnly(reminder.scheduledAt)}
            </span>
            <span className="text-[10px] mt-1 font-medium text-muted-foreground font-sans">
              {new Date(reminder.scheduledAt).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
              })}
            </span>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              {/* Countdown badge */}
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-medium tracking-tight border ${
                  isCompleted
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : isSnoozed
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                    : countdown.isImminent
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                    : countdown.isPast
                    ? 'bg-muted border-border text-muted-foreground'
                    : 'bg-muted border-border text-foreground'
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>{countdown.text}</span>
              </span>

              {/* Recurring Tag */}
              {reminder.isRecurring && (
                <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                  <Repeat className="w-2.5 h-2.5" />
                  <span>
                    {reminder.recurrenceRule === 'DAILY'
                      ? 'Hàng ngày'
                      : reminder.recurrenceRule === 'MONTHLY'
                      ? 'Hàng tháng'
                      : 'Hàng tuần'}
                  </span>
                </span>
              )}

              {/* Remind Before Badge */}
              {reminder.remindBefore > 0 && !isCompleted && (
                <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-medium bg-muted border border-border text-muted-foreground">
                  <Bell className="w-2.5 h-2.5" />
                  <span>{formatRemindBefore(reminder.remindBefore)}</span>
                </span>
              )}
            </div>

            {/* Title */}
            <h4
              className={`text-sm font-semibold leading-snug line-clamp-2 ${
                isCompleted
                  ? 'text-muted-foreground line-through'
                  : 'text-foreground'
              }`}
            >
              {reminder.title}
            </h4>

            {/* Location */}
            {reminder.location && (
              <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground line-clamp-1">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                {isLink ? (
                  <a
                    href={reminder.location}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="hover:underline text-foreground font-medium inline-flex items-center gap-1 break-all"
                  >
                    <span>{reminder.location}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                ) : (
                  <span>{reminder.location}</span>
                )}
              </div>
            )}

            {/* Description note */}
            {reminder.description && (
              <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {reminder.description}
              </p>
            )}

            {/* Tags */}
            {Array.isArray(reminder.tags) && reminder.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {reminder.tags.map((t, i) => {
                  const clean = t.toLowerCase().trim();
                  const color = tagColorMap instanceof Map
                    ? tagColorMap.get(clean)
                    : (tagColorMap as any)?.[clean] || 'hsl(var(--foreground))';

                  return (
                    <span
                      key={i}
                      className="text-[10px] font-medium px-1.5 py-0.2 rounded inline-flex items-center gap-1 border"
                      style={{
                        backgroundColor: `${color}15`,
                        color: color,
                        borderColor: `${color}35`,
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span>#{t}</span>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Mark Complete Button */}
          {!isCompleted && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleComplete}
              title="Đánh dấu đã hoàn thành / đã tham gia"
              className="p-1.5 rounded-md text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/30 transition-[background-color] cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}

          {/* Quick Snooze Button with Menu */}
          {!isCompleted && (
            <div className="relative">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setShowSnoozeMenu(!showSnoozeMenu)}
                title="Hoãn lời nhắc"
                className="p-1.5 rounded-md text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 border border-amber-500/30 transition-[background-color] cursor-pointer inline-flex items-center gap-0.5"
              >
                <Clock className="w-4 h-4" />
                <ChevronDown className="w-2.5 h-2.5" />
              </button>

              {showSnoozeMenu && (
                <div className="absolute right-0 top-full mt-1.5 w-36 bg-popover border border-border text-popover-foreground rounded-md shadow-md py-1 z-20">
                  <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Hoãn lại
                  </div>
                  {SNOOZE_PRESETS.map((p) => (
                    <button
                      key={p.minutes}
                      type="button"
                      onClick={() => handleSnooze(p.minutes)}
                      className="w-full text-left px-2.5 py-1.5 text-xs font-medium hover:bg-muted text-foreground transition-[background-color]"
                    >
                      Thêm {p.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Edit */}
          <button
            type="button"
            onClick={() => onEdit(reminder)}
            title="Chỉnh sửa nhắc hẹn"
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-[color,background-color]"
          >
            <Pencil className="w-4 h-4" />
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={() => onDelete(reminder)}
            title="Xóa nhắc hẹn"
            className="p-1.5 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-[color,background-color]"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
