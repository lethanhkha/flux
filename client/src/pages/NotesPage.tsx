import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import {
  FileText,
  Plus,
  LayoutGrid,
  List,
  X,
  Trash2,
  Tag,
  Edit3,
  Check,
  Sparkles,
} from 'lucide-react';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { Modal } from '../components/common/Modal';
import { PaginationControl, PaginationMeta } from '../components/common/PaginationControl';
import { ColorPickerPopover } from '../components/common/ColorPickerPopover';
import { SearchInput } from '../components/common/SearchInput';
import { MarkdownViewer } from '../components/notes/MarkdownViewer';
import { AddNoteModal } from '../components/notes/AddNoteModal';
import { EditNoteModal } from '../components/notes/EditNoteModal';
import { NoteCard, NoteItem } from '../components/notes/NoteCard';
import { NoteRow } from '../components/notes/NoteRow';
import { Tooltip, InfoTooltip } from '../components/common/Tooltip';
import { useHorizontalScroll } from '../hooks/useHorizontalScroll';
import { useDebounce } from '../hooks/useDebounce';
import { EmptyNotes, EmptySearch } from '../components/illustrations';
import { toast } from 'sonner';

export const NotesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const noteIdFromUrl = searchParams.get('id') || searchParams.get('noteId') || searchParams.get('viewNoteId');

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeNote, setActiveNote] = useState<NoteItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);

  // Tag Manager modal state
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [tagActionLoading, setTagActionLoading] = useState(false);
  const [confirmDeleteTag, setConfirmDeleteTag] = useState<string | null>(null);
  const [colorPickerTag, setColorPickerTag] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<{ name: string; count: number; color?: string }[]>([]);
  const tagBarRef = useHorizontalScroll<HTMLDivElement>();

  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 24,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

  const tagColorMap = useMemo(() => {
    const map = new Map<string, string>();
    availableTags.forEach((t) => {
      if (t.color) map.set(t.name.toLowerCase(), t.color);
    });
    return map;
  }, [availableTags]);

  const getTagColor = useCallback((name: string) => {
    return tagColorMap.get(name.toLowerCase()) || '#6366F1';
  }, [tagColorMap]);

  const handleSelectNote = useCallback((note: NoteItem) => {
    setActiveNote(note);
  }, []);

  const handleCloseViewModal = useCallback(() => {
    setActiveNote(null);
    if (searchParams.has('id') || searchParams.has('noteId') || searchParams.has('viewNoteId')) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('id');
      nextParams.delete('noteId');
      nextParams.delete('viewNoteId');
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleUpdateTagColor = async (tag: string, color: string) => {
    setColorPickerTag(null);
    try {
      await apiClient.patch('/notes/tags/color', { tag, color });
      toast.success(`Đã cập nhật màu cho thẻ #${tag}!`);
      await fetchTags();
      window.dispatchEvent(new CustomEvent('flux:refresh-data'));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể cập nhật màu thẻ.');
    }
  };

  const fetchTags = async () => {
    try {
      const res = await apiClient.get('/notes/tags');
      const tagList = res.data?.data || [];
      setAvailableTags(tagList);
    } catch {
      // Degrade gracefully
    }
  };

  const fetchNotes = useCallback(async (page = 1) => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/notes', {
        params: {
          page,
          limit: 24,
          q: debouncedSearch.trim() || undefined,
          tag: selectedTag !== 'ALL' ? selectedTag : undefined,
        },
      });

      const rawData = res.data?.data;
      const noteList = Array.isArray(rawData) ? rawData : (rawData?.items || []);

      setNotes(
        noteList.map((n: any) => ({
          id: n.id,
          title: n.title,
          content: n.content,
          tags: (n.tags as string[]) || [],
          isPinned: n.isPinned,
          color: n.color || '#6366F1',
          updatedAt: new Date(n.updatedAt).toLocaleDateString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        }))
      );

      if (res.data?.pagination) {
        setPagination(res.data.pagination);
      } else if (rawData?.pagination) {
        setPagination(rawData.pagination);
      }
    } catch {
      // Fallback to empty list gracefully
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, selectedTag]);

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    fetchNotes(1);
  }, [fetchNotes]);

  useEffect(() => {
    const handleRefresh = () => {
      fetchNotes(pagination.page);
      fetchTags();
    };
    window.addEventListener('flux:refresh-data', handleRefresh);
    return () => window.removeEventListener('flux:refresh-data', handleRefresh);
  }, [fetchNotes, pagination.page]);

  // Tự động mở xem chi tiết ghi chú nếu có tham số trên URL (ví dụ chuyển hướng từ Dashboard ghim)
  useEffect(() => {
    if (!noteIdFromUrl) return;
    if (activeNote && activeNote.id === noteIdFromUrl) return;

    // 1. Kiểm tra ghi chú đã có trong danh sách hiện tại
    const found = notes.find((n) => n.id === noteIdFromUrl);
    if (found) {
      setActiveNote(found);
      return;
    }

    // 2. Tải trực tiếp ghi chú từ API nếu chưa có ở trang hiện tại
    let isCancelled = false;
    const fetchTargetNote = async () => {
      try {
        const res = await apiClient.get(`/notes/${noteIdFromUrl}`);
        const n = res.data?.data;
        if (n && !isCancelled) {
          setActiveNote({
            id: n.id,
            title: n.title,
            content: n.content,
            tags: (n.tags as string[]) || [],
            isPinned: n.isPinned,
            color: n.color || '#6366F1',
            updatedAt: new Date(n.updatedAt).toLocaleDateString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            }),
          });
        }
      } catch {
        // Bỏ qua nếu ID không hợp lệ hoặc ghi chú đã bị xóa
      }
    };

    fetchTargetNote();

    return () => {
      isCancelled = true;
    };
  }, [noteIdFromUrl, notes, activeNote]);

  const togglePin = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Optimistic UI update
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          const nextPinned = !n.isPinned;
          toast.success(nextPinned ? 'Đã ghim ghi chú lên đầu!' : 'Đã bỏ ghim ghi chú.');
          return { ...n, isPinned: nextPinned };
        }
        return n;
      })
    );

    try {
      await apiClient.patch(`/notes/${id}/pin`);
      window.dispatchEvent(new CustomEvent('flux:refresh-data'));
    } catch {
      // Degrade gracefully
    }
  }, []);

  const handleDeleteNote = useCallback(async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    let noteToDelete: NoteItem | undefined;
    setNotes((prev) => {
      noteToDelete = prev.find((n) => n.id === id);
      return prev.filter((n) => n.id !== id);
    });
    handleCloseViewModal();
    toast.success('Đã xóa ghi chú thành công.');

    try {
      await apiClient.delete(`/notes/${id}`);
      window.dispatchEvent(new CustomEvent('flux:refresh-data'));
    } catch {
      if (noteToDelete) setNotes((prev) => [noteToDelete!, ...prev]);
      toast.error('Không thể xóa ghi chú trên máy chủ.');
    }
  }, [handleCloseViewModal]);

  const handleOpenEditNote = useCallback((note: NoteItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingNote(note);
    setIsEditModalOpen(true);
  }, []);

  const handleStartRenameTag = (tag: string) => {
    setEditingTag(tag);
    setRenameValue(tag);
  };

  const handleSaveRenameTag = async (oldTag: string) => {
    const cleanNewTag = renameValue.trim().toLowerCase().replace(/^#/, '');
    if (!cleanNewTag || cleanNewTag === oldTag) {
      setEditingTag(null);
      return;
    }

    setTagActionLoading(true);
    try {
      await apiClient.post('/notes/tags/rename', { oldTag, newTag: cleanNewTag });
      if (selectedTag.toLowerCase() === oldTag.toLowerCase()) {
        setSelectedTag(cleanNewTag);
      }
      toast.success(`Đã đổi tên thẻ "#${oldTag}" thành "#${cleanNewTag}"!`);
      setEditingTag(null);
      await fetchTags();
      await fetchNotes(pagination.page);
      window.dispatchEvent(new CustomEvent('flux:refresh-data'));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể đổi tên thẻ.');
    } finally {
      setTagActionLoading(false);
    }
  };

  const handleConfirmDeleteTag = async () => {
    if (!confirmDeleteTag) return;
    const tagToDelete = confirmDeleteTag;

    setTagActionLoading(true);
    try {
      await apiClient.post('/notes/tags/delete', { tag: tagToDelete });
      if (selectedTag.toLowerCase() === tagToDelete.toLowerCase()) {
        setSelectedTag('ALL');
      }
      toast.success(`Đã xóa thẻ "#${tagToDelete}" khỏi toàn bộ ghi chú!`);
      await fetchTags();
      await fetchNotes(1);
      window.dispatchEvent(new CustomEvent('flux:refresh-data'));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể xóa thẻ.');
    } finally {
      setTagActionLoading(false);
      setConfirmDeleteTag(null);
    }
  };

  const filteredNotes = notes;

  return (
    <div className="space-y-6">
        {/* Header Controls */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 text-brand text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ý Tưởng & Tư Duy Không Giới Hạn</span>
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Trạm Ý Tưởng & Kho Tri Thức
              </h1>
              <InfoTooltip
                content="Kho lưu trữ tài liệu cá nhân hỗ trợ định dạng Markdown, gắn thẻ nhãn màu sắc và ghim nhanh lên bảng điều khiển"
                ariaLabel="Thông tin kho tri thức"
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Hội tụ tư duy sáng tạo, tài liệu markdown cá nhân và tổ chức nhãn thông minh
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
              <Tooltip content="Chế độ hiển thị dạng lưới thẻ trực quan">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'grid' ? 'bg-white dark:bg-slate-900 text-brand shadow-sm font-bold' : 'text-slate-500'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span>Lưới</span>
                </button>
              </Tooltip>
              <Tooltip content="Chế độ hiển thị danh sách thu gọn">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'list' ? 'bg-white dark:bg-slate-900 text-brand shadow-sm font-bold' : 'text-slate-500'
                  }`}
                >
                  <List className="w-4 h-4" />
                  <span>Danh Sách</span>
                </button>
              </Tooltip>
            </div>

            <Tooltip content="Quản lý danh sách thẻ, đổi tên hoặc tùy chỉnh màu sắc thẻ ghi chú">
              <button
                onClick={() => setIsTagManagerOpen(true)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Tag className="w-3.5 h-3.5 text-brand" />
                <span>Quản Lý Thẻ</span>
              </button>
            </Tooltip>

            <Tooltip content="Tạo tài liệu ghi chú mới với trình soạn thảo Markdown đa năng">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs shadow-md shadow-brand/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Ghi Chú Mới</span>
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Search & Tag Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Tìm kiếm nội dung ghi chú (Full-Text Search)..."
            isLoading={isLoading}
            className="flex-1 max-w-md"
          />

          <div
            ref={tagBarRef}
            className="flex items-center gap-2 overflow-x-auto custom-scrollbar-x pb-2.5 pt-0.5 text-xs scroll-smooth max-w-full"
          >
            <button
              onClick={() => setSelectedTag('ALL')}
              className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 flex-shrink-0 ${
                selectedTag === 'ALL'
                  ? 'bg-brand text-white border-brand font-bold'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-brand/40'
              }`}
            >
              <span>Tất Cả</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedTag === 'ALL'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {pagination.total}
              </span>
            </button>
            {availableTags.map((tag) => {
              const isActive = selectedTag === tag.name;
              const color = tag.color || '#6366F1';
              return (
                <button
                  key={tag.name}
                  onClick={() => setSelectedTag(isActive ? 'ALL' : tag.name)}
                  className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 flex-shrink-0 ${
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
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: isActive ? '#ffffff' : color }}
                  />
                  <span>#{tag.name}</span>
                  <span
                    className="text-[10px] px-1.5 py-0.2 rounded-full font-medium"
                    style={{
                      backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.06)',
                      color: isActive ? '#ffffff' : 'inherit',
                    }}
                  >
                    {tag.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Notes Grid Display */}
        {viewMode === 'grid' ? (
          isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 animate-pulse"
                >
                  <div className="space-y-2.5">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
                    <div className="h-3 bg-slate-100 dark:bg-slate-850 rounded w-full" />
                    <div className="h-3 bg-slate-100 dark:bg-slate-850 rounded w-4/5" />
                  </div>
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                    <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-16" />
                    <div className="h-3.5 bg-slate-100 dark:bg-slate-850 rounded w-14" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center space-y-4">
              {notes.length === 0 ? (
                <EmptyNotes width={170} height={135} />
              ) : (
                <EmptySearch width={130} height={100} />
              )}
              <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
                {notes.length === 0 ? 'Chưa có ghi chú nào' : 'Không tìm thấy ghi chú nào'}
              </h3>
              <p className="text-xs text-slate-400">
                {notes.length === 0
                  ? 'Ghi lại những ý tưởng, tài liệu học tập hoặc kế hoạch đầu tiên của bạn!'
                  : 'Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc thẻ.'}
              </p>
              {notes.length === 0 && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tạo Ghi Chú Đầu Tiên</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onSelect={handleSelectNote}
                  onTogglePin={togglePin}
                  onEdit={handleOpenEditNote}
                  onDelete={handleDeleteNote}
                  getTagColor={getTagColor}
                />
              ))}
            </div>
          )
        ) : (
          isLoading ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 animate-pulse"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-800 flex-shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                      <div className="h-3 bg-slate-100 dark:bg-slate-850 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
              ))}
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center space-y-4">
              {notes.length === 0 ? (
                <EmptyNotes width={170} height={135} />
              ) : (
                <EmptySearch width={130} height={100} />
              )}
              <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
                {notes.length === 0 ? 'Chưa có ghi chú nào' : 'Không tìm thấy ghi chú nào'}
              </h3>
              <p className="text-xs text-slate-400">
                {notes.length === 0
                  ? 'Ghi lại những ý tưởng, tài liệu học tập hoặc kế hoạch đầu tiên của bạn!'
                  : 'Thử tìm kiếm với từ khóa khác hoặc tạo ghi chú mới.'}
              </p>
              {notes.length === 0 && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tạo Ghi Chú Đầu Tiên</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm space-y-2">
              {filteredNotes.map((note) => (
                <NoteRow
                  key={note.id}
                  note={note}
                  onSelect={handleSelectNote}
                  onTogglePin={togglePin}
                  onEdit={handleOpenEditNote}
                  onDelete={handleDeleteNote}
                  getTagColor={getTagColor}
                />
              ))}
            </div>
          )
        )}

        {/* Notes Pagination Control (T2.1) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <PaginationControl
            pagination={pagination}
            onPageChange={(p) => fetchNotes(p)}
            isLoading={isLoading}
          />
        </div>

        {/* Note View / Detail Modal */}
        <Modal
          isOpen={!!activeNote}
          onClose={handleCloseViewModal}
          ariaLabelledBy="note-detail-title"
          maxWidth="lg"
        >
          {activeNote && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h3 id="note-detail-title" className="font-bold text-base line-clamp-1">{activeNote.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={handleCloseViewModal}
                  aria-label="Đóng xem chi tiết ghi chú"
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 text-xs leading-relaxed max-h-96 overflow-y-auto custom-scrollbar-y">
                <MarkdownViewer content={activeNote.content} />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 gap-3 text-xs text-slate-400">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {activeNote.tags.map((t) => {
                    const color = getTagColor(t);
                    return (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded-md text-[11px] font-semibold border"
                        style={{
                          backgroundColor: `${color}15`,
                          borderColor: `${color}35`,
                          color: color,
                        }}
                      >
                        #{t}
                      </span>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto">
                  <span>Cập nhật: {activeNote.updatedAt}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const noteToEdit = activeNote;
                        handleCloseViewModal();
                        handleOpenEditNote(noteToEdit);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-brand/10 hover:bg-brand text-brand hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Chỉnh sửa nội dung ghi chú này"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Chỉnh sửa</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteNote(activeNote.id)}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa ghi chú</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Add Note Modal */}
        <AddNoteModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          availableTags={availableTags}
          onSuccess={() => {
            fetchNotes(1);
            fetchTags();
          }}
        />

        {/* Tag Manager Modal */}
        <Modal
          isOpen={isTagManagerOpen}
          onClose={() => {
            setIsTagManagerOpen(false);
            setEditingTag(null);
            setColorPickerTag(null);
          }}
          ariaLabelledBy="tag-manager-title"
          maxWidth="lg"
          className="relative"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <h3 id="tag-manager-title" className="font-bold text-base">Quản Lý Thẻ Phân Loại</h3>
                <p className="text-[11px] text-slate-400">Đổi tên, chỉnh màu sắc hoặc xóa thẻ trên toàn bộ ghi chú</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsTagManagerOpen(false);
                setEditingTag(null);
                setColorPickerTag(null);
              }}
              aria-label="Đóng quản lý thẻ"
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {availableTags.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Chưa có thẻ phân loại nào trong ghi chú.
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar-y">
              {availableTags.map(({ name, count, color: tagCol }) => {
                const isEditing = editingTag === name;
                const color = tagCol || getTagColor(name);
                return (
                  <div
                    key={name}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 gap-3 text-xs"
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRenameTag(name);
                            if (e.key === 'Escape') setEditingTag(null);
                          }}
                          autoFocus
                          className="flex-1 px-3 py-1.5 rounded-xl border border-brand bg-white dark:bg-slate-900 text-xs focus:outline-none"
                        />
                        <button
                          onClick={() => handleSaveRenameTag(name)}
                          disabled={tagActionLoading}
                          className="p-1.5 rounded-lg bg-brand text-white hover:bg-brand-hover cursor-pointer"
                          title="Lưu tên mới"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingTag(null)}
                          className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 cursor-pointer"
                          title="Hủy"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 min-w-0">
                          {/* Color Swatch Button */}
                          <button
                            type="button"
                            onClick={() => setColorPickerTag(name)}
                            className="w-5 h-5 rounded-full border border-black/10 dark:border-white/20 shadow-xs cursor-pointer hover:scale-110 transition-transform flex-shrink-0"
                            style={{ backgroundColor: color }}
                            title="Đổi màu thẻ"
                          />

                          <span
                            className="font-semibold px-2.5 py-1 rounded-lg border truncate"
                            style={{
                              backgroundColor: `${color}15`,
                              borderColor: `${color}35`,
                              color: color,
                            }}
                          >
                            #{name}
                          </span>
                          <span className="text-[11px] text-slate-400 flex-shrink-0">
                            ({count} ghi chú)
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => setColorPickerTag(name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-brand hover:bg-brand/10 transition-colors cursor-pointer"
                            title="Đổi màu thẻ"
                          >
                            <div className="w-3.5 h-3.5 rounded-full border border-current" style={{ backgroundColor: color }} />
                          </button>
                          <button
                            onClick={() => handleStartRenameTag(name)}
                            disabled={tagActionLoading}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-brand hover:bg-brand/10 transition-colors cursor-pointer"
                            title="Đổi tên thẻ"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteTag(name)}
                            disabled={tagActionLoading}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                            title="Xóa thẻ khỏi ghi chú"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              onClick={() => {
                setIsTagManagerOpen(false);
                setEditingTag(null);
                setColorPickerTag(null);
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
            >
              Đóng
            </button>
          </div>

          {/* Color Picker Overlay: Đè lên form quản lý thẻ thay vì chen ngang vào danh sách */}
          {colorPickerTag && (
            <div
              className="absolute inset-0 z-50 bg-slate-950/50 backdrop-blur-xs rounded-3xl flex items-center justify-center p-4 animate-in fade-in duration-150 cursor-pointer"
              onClick={() => setColorPickerTag(null)}
            >
              <div onClick={(e) => e.stopPropagation()} className="cursor-default">
                <ColorPickerPopover
                  currentColor={availableTags.find((t) => t.name === colorPickerTag)?.color || getTagColor(colorPickerTag)}
                  tagName={colorPickerTag}
                  onSelectColor={(c) => {
                    handleUpdateTagColor(colorPickerTag, c);
                    setColorPickerTag(null);
                  }}
                  onClose={() => setColorPickerTag(null)}
                  className="relative mt-0 shadow-2xl"
                />
              </div>
            </div>
          )}
        </Modal>

        {/* Modern Delete Confirmation Dialog for Tags */}
        <ConfirmModal
          isOpen={!!confirmDeleteTag}
          isLoading={tagActionLoading}
          onClose={() => {
            if (!tagActionLoading) setConfirmDeleteTag(null);
          }}
          onConfirm={handleConfirmDeleteTag}
          title="Xác Nhận Xóa Thẻ Phân Loại?"
          description="Thẻ này sẽ được gỡ bỏ khỏi toàn bộ các ghi chú hiện có. Dữ liệu và nội dung ghi chú vẫn được bảo toàn nguyên vẹn."
          confirmText="Xác Nhận Xóa"
          cancelText="Hủy Bỏ"
          variant="danger"
          highlightContent={
            confirmDeleteTag && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-brand bg-brand/10 dark:bg-brand/20 px-2.5 py-1 rounded-lg">
                  #{confirmDeleteTag}
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  (Sẽ được gỡ bỏ khỏi tất cả ghi chú đang gắn thẻ này)
                </span>
              </div>
            )
          }
        />

        {/* Edit Note Modal */}
        <EditNoteModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingNote(null);
          }}
          note={editingNote}
          availableTags={availableTags}
          onSuccess={() => {
            fetchNotes(pagination.page);
            fetchTags();
          }}
        />
      </div>
  );
};
