export type ReminderStatus = 'SCHEDULED' | 'SNOOZED' | 'COMPLETED' | 'MISSED';

export interface ReminderItem {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  scheduledAt: string;
  remindBefore: number; // minutes: 0, 5, 10, 15, 30, 60
  location?: string | null;
  status: ReminderStatus;
  isRecurring: boolean;
  recurrenceRule?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | null;
  snoozedUntil?: string | null;
  lastAlertedAt?: string | null;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export const REMIND_BEFORE_OPTIONS = [
  { value: 0, label: 'Đúng giờ hẹn (0 phút)' },
  { value: 5, label: 'Báo trước 5 phút' },
  { value: 10, label: 'Báo trước 10 phút' },
  { value: 15, label: 'Báo trước 15 phút' },
  { value: 30, label: 'Báo trước 30 phút' },
  { value: 60, label: 'Báo trước 1 giờ' },
  { value: 120, label: 'Báo trước 2 giờ' },
  { value: 180, label: 'Báo trước 3 giờ' },
  { value: 720, label: 'Báo trước 12 giờ' },
  { value: 1440, label: 'Báo trước 1 ngày (24 giờ)' },
  { value: 2880, label: 'Báo trước 2 ngày' },
  { value: 10080, label: 'Báo trước 1 tuần' },
];

/**
 * Format minutes into readable Vietnamese string
 */
export const formatRemindBefore = (minutes: number): string => {
  if (!minutes || minutes <= 0) return 'Đúng giờ hẹn';
  if (minutes % 10080 === 0) {
    const weeks = minutes / 10080;
    return `Báo trước ${weeks} tuần`;
  }
  if (minutes % 1440 === 0) {
    const days = minutes / 1440;
    return `Báo trước ${days} ngày`;
  }
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `Báo trước ${hours} giờ`;
  }
  return `Báo trước ${minutes} phút`;
};

export const SNOOZE_PRESETS = [
  { minutes: 5, label: '5 phút' },
  { minutes: 10, label: '10 phút' },
  { minutes: 15, label: '15 phút' },
  { minutes: 30, label: '30 phút' },
];

/**
 * Format scheduled timestamp into friendly Vietnamese format
 */
export const formatScheduledTime = (dateString: string): string => {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'Thời gian không hợp lệ';

    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();

    return `${hours}:${minutes} - ${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
};

/**
 * Format only the hour:minute
 */
export const formatTimeOnly = (dateString: string): string => {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '--:--';
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '--:--';
  }
};

/**
 * Calculate countdown or elapsed time information
 */
export const getReminderCountdown = (
  scheduledAt: string,
  status: ReminderStatus,
  snoozedUntil?: string | null
): { text: string; isImminent: boolean; isPast: boolean } => {
  if (status === 'COMPLETED') {
    return { text: 'Đã hoàn thành', isImminent: false, isPast: false };
  }

  const now = Date.now();
  const targetTime =
    status === 'SNOOZED' && snoozedUntil
      ? new Date(snoozedUntil).getTime()
      : new Date(scheduledAt).getTime();

  const diffMs = targetTime - now;
  const diffMinutes = Math.round(diffMs / 60000);

  if (status === 'SNOOZED') {
    if (diffMinutes <= 0) {
      return { text: 'Hết thời gian hoãn!', isImminent: true, isPast: false };
    }
    return { text: `Tạm hoãn thêm ${diffMinutes} phút`, isImminent: diffMinutes <= 5, isPast: false };
  }

  if (diffMinutes > 1440) {
    const days = Math.round(diffMinutes / 1440);
    return { text: `Còn ${days} ngày nữa`, isImminent: false, isPast: false };
  }

  if (diffMinutes > 60) {
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    return {
      text: mins > 0 ? `Còn ${hours} giờ ${mins} phút` : `Còn ${hours} giờ nữa`,
      isImminent: false,
      isPast: false,
    };
  }

  if (diffMinutes > 0) {
    return {
      text: `Còn ${diffMinutes} phút nữa`,
      isImminent: diffMinutes <= 15,
      isPast: false,
    };
  }

  if (diffMinutes >= -15) {
    return { text: 'Đang diễn ra ngay lúc này', isImminent: true, isPast: false };
  }

  const pastMins = Math.abs(diffMinutes);
  if (pastMins < 60) {
    return { text: `Đã qua ${pastMins} phút`, isImminent: false, isPast: true };
  }

  const pastHours = Math.floor(pastMins / 60);
  return { text: `Đã qua ${pastHours} giờ trước`, isImminent: false, isPast: true };
};
