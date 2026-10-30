import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Bell,
  Clock,
  Calendar,
  Plus,
  CheckCircle2,
  Volume2,
  BellRing,
  LayoutGrid,
  CalendarDays,
  Tag,
  Settings,
  X,
} from 'lucide-react';
import { apiClient, getErrorMessage } from '../api/client';
import { toast } from 'sonner';
import { ReminderItem } from '../lib/reminderUtils';
import { audioNotifier } from '../lib/audioNotifier';
import { useReminderAlert } from '../contexts/ReminderAlertContext';
import { ReminderCard } from '../components/reminders/ReminderCard';
import { ReminderTimeline } from '../components/reminders/ReminderTimeline';
import { EditReminderModal } from '../components/reminders/EditReminderModal';
import { ReminderTagModal, ReminderTagItem } from '../components/reminders/ReminderTagModal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { SearchInput } from '../components/common/SearchInput';
import { useDebounce } from '../hooks/useDebounce';
import { PaginationControl, PaginationMeta } from '../components/common/PaginationControl';
import { format, isToday, isTomorrow, isYesterday } from 'date-fns';
import { vi } from 'date-fns/locale';

type FilterType = 'today' | 'upcoming' | 'past' | 'all';

export const RemindersPage: React.FC = () => {
  const { requestNotificationPermission, notificationPermission, checkDueReminders } =
    useReminderAlert();

  const [filter, setFilter] = useState<FilterType>('today');
  const [viewMode, setViewMode] = useState<'timeline' | 'grid'>('timeline');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

  // Tag states
  const [availableTags, setAvailableTags] = useState<ReminderTagItem[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<ReminderItem | null>(null);
  const [deletingReminder, setDeletingReminder] = useState<ReminderItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    todayCount: 0,
    imminentCount: 0,
    completedCount: 0,
  });

  const tagColorMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of availableTags) {
      if (t.color) {
        map.set(t.name.toLowerCase().trim(), t.color);
      }
    }
    return map;
  }, [availableTags]);

  const fetchTags = useCallback(async () => {
    try {
      const res = await apiClient.get('/reminders/tags');
      if (res.data?.data && Array.isArray(res.data.data)) {
        setAvailableTags(res.data.data);
      }
    } catch {
      // non-blocking
    }
  }, []);

  const fetchReminders = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/reminders', {
        params: {
          filter,
          search: debouncedSearch || undefined,
          tags: selectedTags.length > 0 ? selectedTags.join(',') : undefined,
          page: pagination.page,
          limit: pagination.limit,
        },
      });

      const items: ReminderItem[] = res.data?.data || [];
      setReminders(items);

      if (res.data?.pagination) {
        setPagination((prev) => ({
          ...prev,
          total: res.data.pagination.total,
          totalPages: res.data.pagination.totalPages,
          hasNext: res.data.pagination.hasNext,
          hasPrev: res.data.pagination.hasPrev,
        }));
      }

      // Calculate quick stats for today
      const now = Date.now();
      const in2Hours = now + 2 * 60 * 60 * 1000;

      let todayTotal = 0;
      let imminent = 0;
      let completed = 0;

      items.forEach((item) => {
        const time = new Date(item.scheduledAt).getTime();
        const isToday = new Date(item.scheduledAt).toDateString() === new Date().toDateString();

        if (isToday) todayTotal++;
        if (item.status === 'COMPLETED') completed++;
        if (
          item.status !== 'COMPLETED' &&
          time >= now - 15 * 60 * 1000 &&
          time <= in2Hours
        ) {
          imminent++;
        }
      });

      setStats({
        todayCount: todayTotal,
        imminentCount: imminent,
        completedCount: completed,
      });
    } catch (err) {
      toast.error('Không thể tải danh sách nhắc hẹn');
    } finally {
      setIsLoading(false);
    }
  }, [filter, debouncedSearch, selectedTags, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleToggleTag = useCallback((tagName: string) => {
    const clean = tagName.toLowerCase().trim();
    setSelectedTags((prev) =>
      prev.includes(clean) ? prev.filter((t) => t !== clean) : [...prev, clean]
    );
  }, []);

  const handleRenameTag = async (oldTag: string, newTag: string) => {
    try {
      await apiClient.post('/reminders/tags/rename', { oldTag, newTag });
      toast.success(`Đã đổi tên thẻ từ #${oldTag} thành #${newTag}`);
      fetchTags();
      fetchReminders();
    } catch (err) {
      toast.error(getErrorMessage(err) || 'Không thể đổi tên thẻ');
      throw err;
    }
  };

  const handleDeleteTag = async (tag: string) => {
    try {
      await apiClient.post('/reminders/tags/delete', { tag });
      toast.success(`Đã xóa thẻ #${tag} thành công`);
      setSelectedTags((prev) => prev.filter((t) => t !== tag.toLowerCase().trim()));
      fetchTags();
      fetchReminders();
    } catch (err) {
      toast.error(getErrorMessage(err) || 'Không thể xóa thẻ');
      throw err;
    }
  };

  const handleChangeTagColor = async (tag: string, color: string) => {
    try {
      await apiClient.patch('/reminders/tags/color', { tag, color });
      toast.success(`Đã cập nhật màu thẻ #${tag}`);
      fetchTags();
    } catch (err) {
      toast.error(getErrorMessage(err) || 'Không thể cập nhật màu thẻ');
      throw err;
    }
  };

  const handleCreateNew = () => {
    setEditingReminder(null);
    setIsEditModalOpen(true);
  };

  const handleEdit = (reminder: ReminderItem) => {
    setEditingReminder(reminder);
    setIsEditModalOpen(true);
  };

  const handleDeletePrompt = (reminder: ReminderItem) => {
    setDeletingReminder(reminder);
  };

  const handleConfirmDelete = async () => {
    if (!deletingReminder) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/reminders/${deletingReminder.id}`);
      toast.success('Đã xóa nhắc hẹn thành công');
      setDeletingReminder(null);
      fetchReminders();
    } catch (err) {
      toast.error(getErrorMessage(err) || 'Không thể xóa nhắc hẹn');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await apiClient.patch(`/reminders/${id}/complete`);
      toast.success('Đã xác nhận hoàn thành lịch hẹn!');
      fetchReminders();
      checkDueReminders();
    } catch (err) {
      toast.error('Không thể cập nhật trạng thái');
    }
  };

  const handleSnooze = async (id: string, minutes: number) => {
    try {
      await apiClient.patch(`/reminders/${id}/snooze`, { minutes });
      toast.info(`Đã hoãn lời nhắc thêm ${minutes} phút`);
      fetchReminders();
      checkDueReminders();
    } catch (err) {
      toast.error('Không thể hoãn lời nhắc');
    }
  };

  const handleSaved = () => {
    fetchReminders();
    fetchTags();
    checkDueReminders();
  };

  const isPast = filter === 'past';
  const gridDayGroups = useMemo(() => {
    const sorted = [...reminders].sort((a, b) => {
      const timeA = new Date(a.scheduledAt).getTime();
      const timeB = new Date(b.scheduledAt).getTime();
      return isPast ? timeB - timeA : timeA - timeB;
    });

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
      const str = format(date, 'EEEE, dd/MM/yyyy', { locale: vi });
      const dateLabel = str.charAt(0).toUpperCase() + str.slice(1);
      const relativeLabel = isToday(date)
        ? 'Hôm nay'
        : isTomorrow(date)
        ? 'Ngày mai'
        : isYesterday(date)
        ? 'Hôm qua'
        : null;

      const dayItems = [...items].sort((a, b) => {
        const timeA = new Date(a.scheduledAt).getTime();
        const timeB = new Date(b.scheduledAt).getTime();
        return isPast ? timeB - timeA : timeA - timeB;
      });

      return {
        dateKey,
        date,
        dateLabel,
        relativeLabel,
        items: dayItems,
      };
    });
  }, [reminders, isPast]);

  return (
    <div className="space-y-6">
      {/* 1. Header & Distinction Concept Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Nhắc Hẹn & Lịch Trình
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand/10 text-brand dark:bg-brand/20">
              Chính xác theo giờ
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Khác với công việc (hoàn thành trước hạn), nhắc hẹn reo chuông và kích hoạt đúng vào thời điểm diễn ra.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Test Sound Button */}
          <button
            type="button"
            onClick={() => {
              audioNotifier.playChime();
              toast.info('Đang phát thử âm chuông báo thời gian thực');
            }}
            title="Thử âm thanh chuông báo"
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
          </button>

          {/* Browser Notification Permission Button */}
          {notificationPermission !== 'granted' && (
            <button
              type="button"
              onClick={requestNotificationPermission}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-700/60 transition-all cursor-pointer"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>Bật Thông Báo Trình Duyệt</span>
            </button>
          )}

          {/* Create Button */}
          <button
            type="button"
            onClick={handleCreateNew}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold shadow-md shadow-brand/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Nhắc Hẹn</span>
          </button>
        </div>
      </div>

      {/* 2. Quick Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white">
              {stats.todayCount}
            </div>
            <div className="text-xs text-slate-500">Lịch hẹn hôm nay</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
              {stats.imminentCount}
            </div>
            <div className="text-xs text-slate-500">Sắp diễn ra trong 2 giờ</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {stats.completedCount}
            </div>
            <div className="text-xs text-slate-500">Đã tham gia / Xong</div>
          </div>
        </div>
      </div>

      {/* 3. Filter Pills, Search Bar, and View Mode Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200/60 dark:bg-slate-800/80 self-start">
          <button
            type="button"
            onClick={() => setFilter('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === 'today'
                ? 'bg-white dark:bg-slate-900 text-brand shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Hôm Nay
          </button>
          <button
            type="button"
            onClick={() => setFilter('upcoming')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === 'upcoming'
                ? 'bg-white dark:bg-slate-900 text-brand shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Sắp Tới
          </button>
          <button
            type="button"
            onClick={() => setFilter('past')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === 'past'
                ? 'bg-white dark:bg-slate-900 text-brand shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Lịch Sử Đã Qua
          </button>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-white dark:bg-slate-900 text-brand shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Tất Cả
          </button>
        </div>

        {/* Search & View Mode Switcher */}
        <div className="flex items-center gap-2">
          <div className="w-full sm:w-64">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Tìm kiếm lịch hẹn, địa điểm..."
            />
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-200/60 dark:bg-slate-800/80 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              title="Dòng thời gian (Timeline)"
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'timeline'
                  ? 'bg-white dark:bg-slate-900 text-brand shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              title="Dạng thẻ (Grid)"
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-brand shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3.5. Tag Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar-x pb-1 pt-0.5 text-xs">
        <span className="text-xs text-slate-400 font-semibold flex items-center gap-1 pl-1 shrink-0 mr-1">
          <Tag className="w-3.5 h-3.5 text-brand" /> Thẻ:
        </span>

        <button
          type="button"
          onClick={() => setSelectedTags([])}
          className={`px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer shrink-0 border ${
            selectedTags.length === 0
              ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent font-bold shadow-xs'
              : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Tất cả thẻ
        </button>

        {availableTags.map((item) => {
          const cleanName = item.name.toLowerCase().trim();
          const isActive = selectedTags.some((t) => t.toLowerCase() === cleanName);
          const color = item.color || '#6366F1';

          return (
            <button
              key={item.name}
              type="button"
              onClick={() => handleToggleTag(item.name)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 border cursor-pointer ${
                isActive
                  ? 'text-white font-bold shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:scale-[1.02]'
              }`}
              style={{
                backgroundColor: isActive ? color : `${color}15`,
                borderColor: isActive ? color : `${color}35`,
              }}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: isActive ? '#FFFFFF' : color }}
              />
              <span>#{item.name}</span>
              {item.count !== undefined && item.count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? 'bg-white/25 text-white'
                      : 'bg-slate-200/60 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}

        {/* Clear Tags Filter */}
        {selectedTags.length > 0 && (
          <button
            type="button"
            onClick={() => setSelectedTags([])}
            className="px-2.5 py-1.5 rounded-xl text-xs text-rose-500 hover:text-rose-600 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 transition-all flex items-center gap-1 cursor-pointer shrink-0"
            title="Xóa bộ lọc thẻ"
          >
            <X className="w-3 h-3" />
            <span>Xóa lọc thẻ ({selectedTags.length})</span>
          </button>
        )}

        {/* Manage Tags Button */}
        <button
          type="button"
          onClick={() => setIsTagModalOpen(true)}
          className="px-2.5 py-1.5 rounded-xl text-xs border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:text-brand hover:border-brand transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ml-auto"
          title="Quản lý thẻ phân loại, đổi màu sắc và tên thẻ"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Quản Lý Thẻ</span>
        </button>
      </div>

      {/* 4. Main Reminders Content */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Đang tải lịch trình...</span>
        </div>
      ) : reminders.length === 0 ? (
        <div className="py-16 px-4 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mx-auto">
            <Bell className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {searchQuery
              ? 'Không tìm thấy lịch hẹn phù hợp'
              : filter === 'today'
              ? 'Hôm nay bạn không có lịch hẹn nào'
              : 'Chưa có lịch hẹn trong mục này'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Tạo một lời nhắc để hệ thống phát chuông thông báo đúng giờ khi đến lúc cần đi họp, dự sự kiện hoặc thực hiện việc quan trọng.
          </p>
          <button
            type="button"
            onClick={handleCreateNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tạo Nhắc Hẹn Ngay</span>
          </button>
        </div>
      ) : viewMode === 'timeline' ? (
        <ReminderTimeline
          reminders={reminders}
          filter={filter}
          tagColorMap={tagColorMap}
          onEdit={handleEdit}
          onDelete={handleDeletePrompt}
          onComplete={handleComplete}
          onSnooze={handleSnooze}
        />
      ) : (
        <div className="space-y-8">
          {gridDayGroups.map((day) => (
            <div key={day.dateKey} className="space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-800/80 pb-2">
                <Calendar className="w-4 h-4 text-brand" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 capitalize">
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
                <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto">
                  {day.items.length} lịch hẹn
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {day.items.map((reminder) => (
                  <ReminderCard
                    key={reminder.id}
                    reminder={reminder}
                    tagColorMap={tagColorMap}
                    onEdit={handleEdit}
                    onDelete={handleDeletePrompt}
                    onComplete={handleComplete}
                    onSnooze={handleSnooze}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. Pagination */}
      {pagination.totalPages > 1 && (
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <PaginationControl
            pagination={pagination}
            onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
          />
        </div>
      )}

      {/* Reminder Tag Manager Modal */}
      <ReminderTagModal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        tags={availableTags}
        onRenameTag={handleRenameTag}
        onDeleteTag={handleDeleteTag}
        onChangeColor={handleChangeTagColor}
      />

      {/* Edit / Create Modal */}
      <EditReminderModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        reminder={editingReminder}
        onSaved={handleSaved}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingReminder)}
        onClose={() => setDeletingReminder(null)}
        onConfirm={handleConfirmDelete}
        title="Xóa nhắc hẹn"
        description={`Bạn có chắc chắn muốn xóa lời nhắc "${deletingReminder?.title || ''}"?`}
        confirmText="Xác Nhận Xóa"
        isLoading={isDeleting}
      />
    </div>
  );
};
