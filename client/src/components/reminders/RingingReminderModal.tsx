import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BellRing,
  Clock,
  MapPin,
  CheckCircle2,
  X,
  Volume2,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { ReminderItem, formatScheduledTime, SNOOZE_PRESETS } from '../../lib/reminderUtils';
import { audioNotifier } from '../../lib/audioNotifier';

interface RingingReminderModalProps {
  reminder: ReminderItem | null;
  onClose: () => void;
  onSnooze: (id: string, minutes: number) => Promise<void>;
  onComplete: (id: string) => Promise<void>;
}

export const RingingReminderModal: React.FC<RingingReminderModalProps> = ({
  reminder,
  onClose,
  onSnooze,
  onComplete,
}) => {
  const [selectedSnooze, setSelectedSnooze] = useState<number>(10);
  const [showSnoozeMenu, setShowSnoozeMenu] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!reminder) return null;

  const handleTestChime = () => {
    audioNotifier.playChime();
  };

  const handleSnooze = async (minutes: number) => {
    setIsSubmitting(true);
    try {
      await onSnooze(reminder.id, minutes);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      await onComplete(reminder.id);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLink =
    reminder.location &&
    (reminder.location.startsWith('http://') || reminder.location.startsWith('https://'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-brand/30 dark:border-brand/40 rounded-2xl shadow-2xl shadow-brand/10 overflow-hidden"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="reminder-alert-title"
      >
        {/* Top Glowing Header Strip */}
        <div className="h-2 bg-gradient-to-r from-amber-500 via-brand to-emerald-500" />

        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Ringing Bell Animation */}
              <div className="relative">
                <motion.div
                  animate={{
                    rotate: [0, -14, 14, -14, 10, -10, 0],
                    scale: [1, 1.08, 1, 1.08, 1],
                  }}
                  transition={{
                    repeat: Infinity,
                    repeatDelay: 2,
                    duration: 0.8,
                  }}
                  className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-inner"
                >
                  <BellRing className="w-6 h-6 animate-pulse" />
                </motion.div>
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40">
                  Đến Giờ Nhắc Hẹn
                </span>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatScheduledTime(reminder.scheduledAt)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleTestChime}
                title="Phát lại chuông âm thanh"
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Volume2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Đóng"
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Reminder Content */}
          <div className="mt-5 space-y-3">
            <h3
              id="reminder-alert-title"
              className="text-xl font-bold text-slate-900 dark:text-white leading-snug"
            >
              {reminder.title}
            </h3>

            {reminder.description && (
              <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 whitespace-pre-wrap leading-relaxed">
                {reminder.description}
              </p>
            )}

            {reminder.location && (
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-100/70 dark:bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                <MapPin className="w-4 h-4 text-brand shrink-0" />
                {isLink ? (
                  <a
                    href={reminder.location}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="font-medium text-brand hover:underline inline-flex items-center gap-1 break-all line-clamp-1"
                  >
                    <span>{reminder.location}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                ) : (
                  <span className="font-medium break-words">{reminder.location}</span>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Snooze button with dropdown */}
            <div className="relative">
              <div className="inline-flex rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden w-full sm:w-auto">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSnooze(selectedSnooze)}
                  className="flex-1 sm:flex-none px-3.5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  Hoãn {selectedSnooze} phút
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setShowSnoozeMenu(!showSnoozeMenu)}
                  className="px-2 py-2.5 bg-slate-100 dark:bg-slate-750 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors border-l border-slate-200 dark:border-slate-700"
                  aria-label="Chọn thời gian hoãn"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              <AnimatePresence>
                {showSnoozeMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="absolute left-0 bottom-full mb-1.5 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-1 z-20"
                  >
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Chọn thời gian hoãn
                    </div>
                    {SNOOZE_PRESETS.map((preset) => (
                      <button
                        key={preset.minutes}
                        type="button"
                        onClick={() => {
                          setSelectedSnooze(preset.minutes);
                          setShowSnoozeMenu(false);
                          handleSnooze(preset.minutes);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between ${
                          selectedSnooze === preset.minutes ? 'text-brand font-bold' : ''
                        }`}
                      >
                        <span>Hoãn {preset.label}</span>
                        {selectedSnooze === preset.minutes && (
                          <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Complete button */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleComplete}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Đã hoàn thành / Đã tham gia</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
