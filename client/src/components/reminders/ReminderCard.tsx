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
    setIsProcessing(true);
    try {
      await onComplete(reminder.id);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSnooze = async (minutes: number) => {
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
      className={`relative rounded-2xl border transition-all duration-200 p-5 ${
        isCompleted
          ? 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 opacity-75'
          : countdown.isImminent
          ? 'bg-gradient-to-br from-amber-500/5 via-white to-amber-500/10 dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900 border-amber-300 dark:border-amber-700/60 shadow-md shadow-amber-500/5 ring-1 ring-amber-400/20'
          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Time and Title */}
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          {/* Big Time Block */}
          <div
            className={`flex flex-col items-center justify-center min-w-[70px] h-[64px] rounded-xl border font-mono transition-colors shrink-0 ${
              isCompleted
                ? 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-400'
                : countdown.isImminent
                ? 'bg-amber-500/10 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-600 dark:text-amber-400 font-bold'
                : 'bg-brand/10 dark:bg-brand/20 border-brand/20 text-brand font-bold'
            }`}
          >
            <span className="text-base font-extrabold leading-none tracking-tight">
              {formatTimeOnly(reminder.scheduledAt)}
            </span>
            <span className="text-[10px] mt-1 font-semibold text-slate-500 dark:text-slate-400 font-sans">
              {new Date(reminder.scheduledAt).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
              })}
            </span>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {/* Countdown badge */}
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-tight ${
                  isCompleted
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                    : isSnoozed
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 animate-pulse'
                    : countdown.isImminent
                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 animate-pulse'
                    : countdown.isPast
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    : 'bg-brand/10 text-brand dark:bg-brand/20'
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>{countdown.text}</span>
              </span>

              {/* Recurring Tag */}
              {reminder.isRecurring && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40">
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
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500">
                  <Bell className="w-2.5 h-2.5" />
                  <span>{formatRemindBefore(reminder.remindBefore)}</span>
                </span>
              )}
            </div>

            {/* Title */}
            <h4
              className={`text-sm sm:text-base font-bold leading-snug line-clamp-2 ${
                isCompleted
                  ? 'text-slate-400 dark:text-slate-500 line-through'
                  : 'text-slate-900 dark:text-white'
              }`}
            >
              {reminder.title}
            </h4>

            {/* Location */}
            {reminder.location && (
              <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 line-clamp-1">
                <MapPin className="w-3.5 h-3.5 text-brand shrink-0" />
                {isLink ? (
                  <a
                    href={reminder.location}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="hover:underline text-brand font-medium inline-flex items-center gap-1 break-all"
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
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {reminder.description}
              </p>
            )}

            {/* Tags */}
            {Array.isArray(reminder.tags) && reminder.tags.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {reminder.tags.map((t, i) => {
                  const clean = t.toLowerCase().trim();
                  const color = tagColorMap instanceof Map
                    ? tagColorMap.get(clean)
                    : (tagColorMap as any)?.[clean] || '#6366F1';

                  return (
                    <span
                      key={i}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-md inline-flex items-center gap-1 border transition-colors"
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
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Mark Complete Button */}
          {!isCompleted && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleComplete}
              title="Đánh dấu đã hoàn thành / đã tham gia"
              className="p-2 rounded-xl text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/60 transition-colors cursor-pointer"
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
                className="p-2 rounded-xl text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/70 border border-amber-200 dark:border-amber-800/60 transition-colors cursor-pointer inline-flex items-center gap-0.5"
              >
                <Clock className="w-4 h-4" />
                <ChevronDown className="w-2.5 h-2.5" />
              </button>

              {showSnoozeMenu && (
                <div className="absolute right-0 top-full mt-1.5 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-1 z-20">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Hoãn lại
                  </div>
                  {SNOOZE_PRESETS.map((p) => (
                    <button
                      key={p.minutes}
                      type="button"
                      onClick={() => handleSnooze(p.minutes)}
                      className="w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
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
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={() => onDelete(reminder)}
            title="Xóa nhắc hẹn"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
