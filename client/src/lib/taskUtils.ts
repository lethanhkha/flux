export interface RemainingDaysResult {
  label: string;
  shortLabel: string;
  variant: 'overdue' | 'today' | 'tomorrow' | 'upcoming' | 'done' | 'none';
  colorClasses: string;
  isOverdue: boolean;
  days: number | null;
  formattedDue: string;
}

export const PRIORITY_TOOLTIPS = {
  URGENT: 'Khẩn cấp: Deadline sát nút (trong ngày / dưới 24h) hoặc có rủi ro nghiêm trọng nếu bị chậm trễ. Cần ưu tiên xử lý ngay lập tức!',
  HIGH: 'Ưu tiên cao: Công việc quan trọng cần hoàn thành sớm trong tuần, ảnh hưởng lớn đến tiến độ chung.',
  MEDIUM: 'Trung bình: Công việc theo kế hoạch định kỳ, giải quyết theo tiến độ thông thường.',
  LOW: 'Thấp: Công việc phụ hoặc có thể linh hoạt dời lại khi rảnh, không gây áp lực thời gian.',
};

/**
 * Calculates accurate calendar days remaining until task deadline
 */
export function getRemainingDaysInfo(
  rawDueDate?: string | null,
  status?: string
): RemainingDaysResult {
  if (status === 'DONE') {
    return {
      label: 'Đã xong',
      shortLabel: 'Đã xong',
      variant: 'done',
      colorClasses: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
      isOverdue: false,
      days: 0,
      formattedDue: rawDueDate ? new Date(rawDueDate).toLocaleString('vi-VN') : 'Đã hoàn tất',
    };
  }

  if (!rawDueDate) {
    return {
      label: 'Không thời hạn',
      shortLabel: 'Không hạn',
      variant: 'none',
      colorClasses: 'text-slate-400 bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800',
      isOverdue: false,
      days: null,
      formattedDue: 'Không có thời hạn',
    };
  }

  const dueDate = new Date(rawDueDate);
  if (isNaN(dueDate.getTime())) {
    return {
      label: 'Không hợp lệ',
      shortLabel: 'Lỗi hạn',
      variant: 'none',
      colorClasses: 'text-slate-400 bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800',
      isOverdue: false,
      days: null,
      formattedDue: 'Thời hạn không hợp lệ',
    };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDayOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

  const diffTime = dueDayOnly.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  const timeString = dueDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const dateString = dueDate.toLocaleDateString('vi-VN');

  if (diffDays < 0) {
    const overdueCount = Math.abs(diffDays);
    return {
      label: `Quá hạn ${overdueCount} ngày`,
      shortLabel: `Trễ ${overdueCount}d`,
      variant: 'overdue',
      colorClasses: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 font-bold',
      isOverdue: true,
      days: diffDays,
      formattedDue: `${timeString} ${dateString}`,
    };
  }

  if (diffDays === 0) {
    return {
      label: `Hạn hôm nay (${timeString})`,
      shortLabel: `Hôm nay ${timeString}`,
      variant: 'today',
      colorClasses: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 font-bold',
      isOverdue: false,
      days: 0,
      formattedDue: `${timeString} hôm nay`,
    };
  }

  if (diffDays === 1) {
    return {
      label: `Còn 1 ngày (Ngày mai)`,
      shortLabel: `Còn 1 ngày`,
      variant: 'tomorrow',
      colorClasses: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900 font-semibold',
      isOverdue: false,
      days: 1,
      formattedDue: `${timeString} ngày mai (${dateString})`,
    };
  }

  return {
    label: `Còn ${diffDays} ngày`,
    shortLabel: `Còn ${diffDays}d`,
    variant: 'upcoming',
    colorClasses: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-900',
    isOverdue: false,
    days: diffDays,
    formattedDue: `${timeString} ngày ${dateString}`,
  };
}

export interface SubtaskProgressConfig {
  barGradient: string;
  badgeBg: string;
  badgeText: string;
  borderLeftAccent: string;
  borderTopAccent: string;
  stageLabel: string;
  glowClass: string;
}

/**
 * Multi-tier intuitive color system for subtask progress bars & visual indicators
 */
export function getSubtaskProgressConfig(percentage: number): SubtaskProgressConfig {
  if (percentage <= 0) {
    return {
      barGradient: 'bg-slate-300 dark:bg-slate-700',
      badgeBg: 'bg-slate-100 dark:bg-slate-800 text-slate-500',
      badgeText: 'text-slate-400 dark:text-slate-500',
      borderLeftAccent: 'border-l-slate-300 dark:border-l-slate-700',
      borderTopAccent: 'border-t-slate-300 dark:border-t-slate-700',
      stageLabel: 'Chưa bắt đầu',
      glowClass: '',
    };
  }
  if (percentage <= 25) {
    return {
      barGradient: 'bg-gradient-to-r from-rose-500 to-orange-400',
      badgeBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
      badgeText: 'text-rose-600 dark:text-rose-400 font-bold',
      borderLeftAccent: 'border-l-rose-500',
      borderTopAccent: 'border-t-rose-500',
      stageLabel: 'Mới bắt đầu',
      glowClass: 'shadow-xs shadow-rose-500/20',
    };
  }
  if (percentage <= 50) {
    return {
      barGradient: 'bg-gradient-to-r from-amber-500 to-yellow-400',
      badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
      badgeText: 'text-amber-600 dark:text-amber-400 font-bold',
      borderLeftAccent: 'border-l-amber-500',
      borderTopAccent: 'border-t-amber-500',
      stageLabel: 'Đang tiến hành',
      glowClass: 'shadow-xs shadow-amber-500/20',
    };
  }
  if (percentage <= 75) {
    return {
      barGradient: 'bg-gradient-to-r from-blue-500 to-indigo-500',
      badgeBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
      badgeText: 'text-blue-600 dark:text-blue-400 font-bold',
      borderLeftAccent: 'border-l-blue-500',
      borderTopAccent: 'border-t-blue-500',
      stageLabel: 'Tiến độ tốt',
      glowClass: 'shadow-xs shadow-blue-500/20',
    };
  }
  if (percentage < 100) {
    return {
      barGradient: 'bg-gradient-to-r from-indigo-500 to-purple-500',
      badgeBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20',
      badgeText: 'text-indigo-600 dark:text-indigo-400 font-bold',
      borderLeftAccent: 'border-l-indigo-500',
      borderTopAccent: 'border-t-indigo-500',
      stageLabel: 'Gần về đích',
      glowClass: 'shadow-xs shadow-indigo-500/20',
    };
  }
  return {
    barGradient: 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/30',
    badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    badgeText: 'text-emerald-600 dark:text-emerald-400 font-bold',
    borderLeftAccent: 'border-l-emerald-500',
    borderTopAccent: 'border-t-emerald-500',
    stageLabel: 'Hoàn thành xuất sắc',
    glowClass: 'shadow-sm shadow-emerald-500/25',
  };
}
