import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Bell,
  Calendar,
  Plus,
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
import { Tooltip } from '../components/common/Tooltip';
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
    if (!deletingReminder || isDeleting) return;
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
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Nhắc nhở
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Khác với công việc, nhắc hẹn reo chuông và kích hoạt đúng vào thời điểm diễn ra
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Test Sound Button */}
          <button
            type="button"
            onClick={() => {
              audioNotifier.playChime();
              toast.info('Đang phát thử âm chuông báo thời gian thực');
            }}
            title="Thử âm thanh chuông báo"
            className="p-2 rounded-md border border-border bg-background hover:bg-muted text-foreground transition-[background-color] cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
          </button>

          {/* Browser Notification Permission Button */}
          {notificationPermission !== 'granted' && (
            <button
              type="button"
              onClick={requestNotificationPermission}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-700/60 transition-[background-color] cursor-pointer"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>Bật Thông Báo</span>
            </button>
          )}

          {/* Create Button */}
          <button
            type="button"
            onClick={handleCreateNew}
            className="h-8 px-3 rounded-md bg-foreground text-background text-xs font-medium hover:opacity-90 active:scale-[0.98] transition-[opacity,transform] flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Nhắc Hẹn</span>
          </button>
        </div>
      </div>

      {/* 2. Unified Quick Metric Strip */}
      <div className="rounded-lg border border-border bg-card p-3 sm:p-4 grid grid-cols-3 divide-x divide-border/60">
        <div className="px-2 sm:px-4">
          <div className="text-xs text-muted-foreground font-medium">Lịch hẹn hôm nay</div>
          <div className="text-xl sm:text-2xl font-bold tabular-nums tracking-tight text-foreground mt-0.5">
            {stats.todayCount}
          </div>
        </div>

        <div className="px-2 sm:px-4">
          <div className="text-xs text-muted-foreground font-medium">Sắp diễn ra (2 giờ)</div>
          <div className="text-xl sm:text-2xl font-bold tabular-nums tracking-tight text-foreground mt-0.5">
            {stats.imminentCount}
          </div>
        </div>

        <div className="px-2 sm:px-4">
          <div className="text-xs text-muted-foreground font-medium">Đã hoàn thành</div>
          <div className="text-xl sm:text-2xl font-bold tabular-nums tracking-tight text-foreground mt-0.5">
            {stats.completedCount}
          </div>
        </div>
      </div>

      {/* 3. Filter Pills, Search Bar, and View Mode Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-0.5 p-0.5 rounded-md border border-border/40 bg-muted text-xs font-medium self-start">
          <button
            type="button"
            onClick={() => setFilter('today')}
            className={`px-2.5 py-1 rounded-sm transition-[color,background-color] cursor-pointer ${
              filter === 'today'
                ? 'bg-background text-foreground shadow-xs font-medium'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Hôm Nay
          </button>
          <button
            type="button"
            onClick={() => setFilter('upcoming')}
            className={`px-2.5 py-1 rounded-sm transition-[color,background-color] cursor-pointer ${
              filter === 'upcoming'
                ? 'bg-background text-foreground shadow-xs font-medium'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Sắp Tới
          </button>
          <button
            type="button"
            onClick={() => setFilter('past')}
            className={`px-2.5 py-1 rounded-sm transition-[color,background-color] cursor-pointer ${
              filter === 'past'
                ? 'bg-background text-foreground shadow-xs font-medium'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Lịch Sử Đã Qua
          </button>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-sm transition-[color,background-color] cursor-pointer ${
              filter === 'all'
                ? 'bg-background text-foreground shadow-xs font-medium'
                : 'text-muted-foreground hover:text-foreground'
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
              placeholder="Tìm kiếm lịch hẹn, địa điểm…"
            />
          </div>

          <div className="flex items-center gap-0.5 p-0.5 rounded-md border border-border/40 bg-muted shrink-0 text-xs font-medium">
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              title="Dòng thời gian (Timeline)"
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'timeline'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              title="Dạng thẻ (Grid)"
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3.5. Tag Filter Bar */}
      <div className="flex items-center gap-2 pb-1 pt-0.5 text-xs min-w-0">
        {/* Fixed Left Label */}
        <span className="text-xs text-muted-foreground font-medium flex items-center gap-1 pl-1 shrink-0 select-none">
          <Tag className="w-3.5 h-3.5 text-foreground" /> Thẻ:
        </span>

        {/* Scrollable Middle Container */}
        <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-x-auto custom-scrollbar-x pb-1 pt-0.5 text-xs scroll-smooth">
          <button
            type="button"
            onClick={() => setSelectedTags([])}
            className={`px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer shrink-0 border ${
              selectedTags.length === 0
                ? 'bg-foreground text-background border-foreground font-medium'
                : 'bg-card border-border text-muted-foreground hover:bg-muted'
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
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 border cursor-pointer ${
                  isActive
                    ? 'text-foreground font-semibold border-foreground'
                    : 'text-muted-foreground border-border hover:text-foreground'
                }`}
                style={{
                  backgroundColor: isActive ? `${color}25` : `${color}10`,
                  borderColor: isActive ? color : undefined,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span>#{item.name}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums ${
                      isActive
                        ? 'bg-foreground/15 text-foreground font-semibold'
                        : 'bg-muted text-muted-foreground'
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
              className="px-2.5 py-1.5 rounded-lg text-xs text-destructive hover:bg-destructive/10 border border-destructive/20 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
              title="Xóa bộ lọc thẻ"
            >
              <X className="w-3 h-3" />
              <span>Xóa lọc thẻ ({selectedTags.length})</span>
            </button>
          )}
        </div>

        {/* Fixed Right Button */}
        <Tooltip content="Quản lý thẻ phân loại, đổi màu sắc và tên thẻ" wrapperClassName="shrink-0">
          <button
            type="button"
            onClick={() => setIsTagModalOpen(true)}
            className="px-2.5 py-1.5 rounded-lg text-xs border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Quản lý thẻ</span>
          </button>
        </Tooltip>
      </div>

      {/* 4. Main Reminders Content */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-7 h-7 rounded-full border-2 border-foreground border-t-transparent animate-spin" />
          <span className="text-xs text-muted-foreground font-medium">Đang tải lịch trình…</span>
        </div>
      ) : reminders.length === 0 ? (
        <div className="py-16 px-4 text-center rounded-xl bg-card border border-dashed border-border space-y-3">
          <div className="w-10 h-10 rounded-lg bg-muted text-foreground flex items-center justify-center mx-auto">
            <Bell className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            {searchQuery
              ? 'Không tìm thấy lịch hẹn phù hợp'
              : filter === 'today'
              ? 'Hôm nay bạn không có lịch hẹn nào'
              : 'Chưa có lịch hẹn trong mục này'}
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            Tạo một lời nhắc để hệ thống phát chuông thông báo đúng giờ khi đến lúc cần đi họp, dự sự kiện hoặc thực hiện việc quan trọng.
          </p>
          <button
            type="button"
            onClick={handleCreateNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-foreground text-background text-xs font-medium hover:bg-foreground/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tạo nhắc hẹn mới</span>
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
                        ? 'bg-foreground text-background shadow-xs'
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
