import React, { useMemo } from 'react';
import { Sun, Sunset, Moon, Calendar } from 'lucide-react';
import { format, isToday, isTomorrow, isYesterday } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ReminderItem } from '../../lib/reminderUtils';
import { ReminderCard } from './ReminderCard';

interface ReminderTimelineProps {
  reminders: ReminderItem[];
  filter?: 'today' | 'upcoming' | 'past' | 'all';
  tagColorMap?: Map<string, string> | Record<string, string>;
  onEdit: (reminder: ReminderItem) => void;
  onDelete: (reminder: ReminderItem) => void;
  onComplete: (id: string) => Promise<void>;
  onSnooze: (id: string, minutes: number) => Promise<void>;
}

const formatDayTitle = (d: Date) => {
  const str = format(d, 'EEEE, dd/MM/yyyy', { locale: vi });
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const getRelativeLabel = (d: Date) => {
  if (isToday(d)) return 'Hôm nay';
  if (isTomorrow(d)) return 'Ngày mai';
  if (isYesterday(d)) return 'Hôm qua';
  return null;
};

const getDotColor = (status: string) => {
  if (status === 'COMPLETED') return 'bg-emerald-500';
  if (status === 'SNOOZED') return 'bg-amber-500';
  return 'bg-brand';
};

export const ReminderTimeline: React.FC<ReminderTimelineProps> = ({
  reminders,
  filter = 'upcoming',
  tagColorMap,
  onEdit,
  onDelete,
  onComplete,
  onSnooze,
}) => {
  const isPast = filter === 'past';

  // Sort reminders: ascending for upcoming/today/all, descending for past
  const sorted = useMemo(() => {
    return [...reminders].sort((a, b) => {
      const timeA = new Date(a.scheduledAt).getTime();
      const timeB = new Date(b.scheduledAt).getTime();
      return isPast ? timeB - timeA : timeA - timeB;
    });
  }, [reminders, isPast]);

  // Group by Date first
  const dayGroups = useMemo(() => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const map = new Map<string, { date: Date; items: ReminderItem[] }>();

    sorted.forEach((item) => {
      const d = new Date(item.scheduledAt);
      const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      const existing = map.get(key);
      if (existing) {
        existing.items.push(item);
      } else {
        map.set(key, { date: d, items: [item] });
      }
    });

    return Array.from(map.entries()).map(([dateKey, { date, items }]) => {
      // Sort items within day chronologically
      const dayItems = [...items].sort((a, b) => {
        const timeA = new Date(a.scheduledAt).getTime();
        const timeB = new Date(b.scheduledAt).getTime();
        return isPast ? timeB - timeA : timeA - timeB;
      });

      // Group into time slots when a day has multiple items
      const morning: ReminderItem[] = [];
      const afternoon: ReminderItem[] = [];
      const evening: ReminderItem[] = [];

      dayItems.forEach((item) => {
        const hours = new Date(item.scheduledAt).getHours();
        if (hours < 12) {
          morning.push(item);
        } else if (hours < 18) {
          afternoon.push(item);
        } else {
          evening.push(item);
        }
      });

      return {
        dateKey,
        date,
        dateLabel: formatDayTitle(date),
        relativeLabel: getRelativeLabel(date),
        items: dayItems,
        timeSlots: {
          morning,
          afternoon,
          evening,
        },
      };
    });
  }, [sorted, isPast]);

  const renderTimeSlot = (
    title: string,
    icon: React.ReactNode,
    items: ReminderItem[],
    accentColor: string
  ) => {
    if (items.length === 0) return null;

    return (
      <div className="space-y-3">
        {/* Slot Header */}
        <div className="flex items-center gap-2 pl-1">
          <div className={`p-1.5 rounded-lg ${accentColor}`}>{icon}</div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            {title} ({items.length})
          </h4>
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
        </div>

        {/* Timeline Items */}
        <div className="relative pl-6 space-y-4 border-l-2 border-slate-200 dark:border-slate-800 ml-3.5">
          {items.map((item) => (
            <div key={item.id} className="relative">
              <div
                className={`absolute -left-[31px] top-5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${getDotColor(
                  item.status
                )}`}
              />
              <ReminderCard
                reminder={item}
                tagColorMap={tagColorMap}
                onEdit={onEdit}
                onDelete={onDelete}
                onComplete={onComplete}
                onSnooze={onSnooze}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10">
      {dayGroups.map((day) => (
        <div key={day.dateKey} className="space-y-4">
          {/* Date Group Header */}
          <div className="sticky top-0 z-10 py-2 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-xs flex items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand/10 dark:bg-brand/20 text-brand flex items-center justify-center font-bold shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {day.dateLabel}
                </h3>
                {day.relativeLabel && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      day.relativeLabel === 'Hôm nay'
                        ? 'bg-brand text-white shadow-xs'
                        : day.relativeLabel === 'Ngày mai'
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {day.relativeLabel}
                  </span>
                )}
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 shrink-0">
              {day.items.length} lịch hẹn
            </span>
          </div>

          {/* If only 1 activity on this date, show directly without splitting slots */}
          {day.items.length === 1 ? (
            <div className="relative pl-6 space-y-4 border-l-2 border-slate-200 dark:border-slate-800 ml-3.5 pt-1">
              <div className="relative">
                <div
                  className={`absolute -left-[31px] top-5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${getDotColor(
                    day.items[0].status
                  )}`}
                />
                <ReminderCard
                  reminder={day.items[0]}
                  tagColorMap={tagColorMap}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onComplete={onComplete}
                  onSnooze={onSnooze}
                />
              </div>
            </div>
          ) : (
            /* Multiple activities on this date: organize by time slots */
            <div className="space-y-6 pt-1">
              {renderTimeSlot(
                'Buổi Sáng (Trước 12:00)',
                <Sun className="w-4 h-4 text-amber-500" />,
                day.timeSlots.morning,
                'bg-amber-50 dark:bg-amber-950/40 text-amber-600'
              )}

              {renderTimeSlot(
                'Buổi Chiều (12:00 - 18:00)',
                <Sunset className="w-4 h-4 text-orange-500" />,
                day.timeSlots.afternoon,
                'bg-orange-50 dark:bg-orange-950/40 text-orange-600'
              )}

              {renderTimeSlot(
                'Buổi Tối (Sau 18:00)',
                <Moon className="w-4 h-4 text-indigo-500" />,
                day.timeSlots.evening,
                'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600'
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
