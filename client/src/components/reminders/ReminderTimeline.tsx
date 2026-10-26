import React from 'react';
import { Sun, Sunset, Moon } from 'lucide-react';
import { ReminderItem } from '../../lib/reminderUtils';
import { ReminderCard } from './ReminderCard';

interface ReminderTimelineProps {
  reminders: ReminderItem[];
  tagColorMap?: Map<string, string> | Record<string, string>;
  onEdit: (reminder: ReminderItem) => void;
  onDelete: (reminder: ReminderItem) => void;
  onComplete: (id: string) => Promise<void>;
  onSnooze: (id: string, minutes: number) => Promise<void>;
}

export const ReminderTimeline: React.FC<ReminderTimelineProps> = ({
  reminders,
  tagColorMap,
  onEdit,
  onDelete,
  onComplete,
  onSnooze,
}) => {
  // Sort reminders chronologically
  const sorted = [...reminders].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );

  // Group into time periods
  const groups: {
    morning: ReminderItem[];
    afternoon: ReminderItem[];
    evening: ReminderItem[];
  } = {
    morning: [],
    afternoon: [],
    evening: [],
  };

  sorted.forEach((item) => {
    const hours = new Date(item.scheduledAt).getHours();
    if (hours < 12) {
      groups.morning.push(item);
    } else if (hours < 18) {
      groups.afternoon.push(item);
    } else {
      groups.evening.push(item);
    }
  });

  const renderSection = (
    title: string,
    icon: React.ReactNode,
    items: ReminderItem[],
    accentColor: string
  ) => {
    if (items.length === 0) return null;

    return (
      <div className="space-y-4">
        {/* Section Header */}
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-lg ${accentColor}`}>{icon}</div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            {title} ({items.length})
          </h4>
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
        </div>

        {/* Timeline Items */}
        <div className="relative pl-6 space-y-4 border-l-2 border-slate-200 dark:border-slate-800 ml-3">
          {items.map((item) => (
            <div key={item.id} className="relative">
              {/* Dot on line */}
              <div
                className={`absolute -left-[31px] top-5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${
                  item.status === 'COMPLETED'
                    ? 'bg-emerald-500'
                    : item.status === 'SNOOZED'
                    ? 'bg-amber-500'
                    : 'bg-brand'
                }`}
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
    <div className="space-y-8">
      {renderSection(
        'Buổi Sáng (Trước 12:00)',
        <Sun className="w-4 h-4 text-amber-500" />,
        groups.morning,
        'bg-amber-50 dark:bg-amber-950/40 text-amber-600'
      )}

      {renderSection(
        'Buổi Chiều (12:00 - 18:00)',
        <Sunset className="w-4 h-4 text-orange-500" />,
        groups.afternoon,
        'bg-orange-50 dark:bg-orange-950/40 text-orange-600'
      )}

      {renderSection(
        'Buổi Tối (Sau 18:00)',
        <Moon className="w-4 h-4 text-indigo-500" />,
        groups.evening,
        'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600'
      )}
    </div>
  );
};
