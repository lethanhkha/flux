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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 8 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden overscroll-contain"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="reminder-alert-title"
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Ringing Bell Animation */}
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <BellRing className="w-5 h-5 animate-pulse" />
              </div>

              <div>
                <span className="text-[11px] font-medium tracking-wide uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  Đến giờ nhắc hẹn
                </span>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5 tabular-nums">
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
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Volume2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Đóng"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Reminder Content */}
          <div className="mt-5 space-y-3">
            <h3
              id="reminder-alert-title"
              className="text-lg font-semibold text-foreground tracking-tight leading-snug"
            >
              {reminder.title}
            </h3>

            {reminder.description && (
              <p className="text-sm text-muted-foreground bg-muted/40 p-3.5 rounded-lg border border-border whitespace-pre-wrap leading-relaxed">
                {reminder.description}
              </p>
            )}

            {reminder.location && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg border border-border">
                <MapPin className="w-4 h-4 text-brand shrink-0" />
                {isLink ? (
                  <a
                    href={reminder.location}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="font-medium text-foreground hover:underline inline-flex items-center gap-1 break-all line-clamp-1"
                  >
                    <span>{reminder.location}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                ) : (
                  <span className="font-medium break-words text-foreground">{reminder.location}</span>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 pt-5 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Snooze button with dropdown */}
            <div className="relative">
              <div className="inline-flex rounded-lg border border-border overflow-hidden w-full sm:w-auto">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSnooze(selectedSnooze)}
                  className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-medium text-foreground bg-muted/40 hover:bg-muted transition-colors disabled:opacity-50"
                >
                  Hoãn {selectedSnooze} phút
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setShowSnoozeMenu(!showSnoozeMenu)}
                  className="px-2 py-2 bg-muted/60 hover:bg-muted text-foreground transition-colors border-l border-border"
                  aria-label="Chọn thời gian hoãn"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              <AnimatePresence>
                {showSnoozeMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 2 }}
                    transition={{ duration: 0.12 }}
                    className="absolute left-0 bottom-full mb-1.5 w-44 bg-popover border border-border rounded-lg shadow-lg py-1 z-20"
                  >
                    <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Thời gian hoãn
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
                        className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors flex items-center justify-between ${
                          selectedSnooze === preset.minutes ? 'text-foreground font-semibold bg-muted/50' : 'text-muted-foreground'
                        }`}
                      >
                        <span>Hoãn {preset.label}</span>
                        {selectedSnooze === preset.minutes && (
                          <span className="w-1.5 h-1.5 rounded-full bg-foreground" />
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
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-foreground text-background text-xs font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Đã hoàn thành</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
