import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import {
  FileText,
  Plus,
  Search,
  Pin,
  Clock,
  LayoutGrid,
  List,
  X,
  Trash2,
  Tag,
  Edit3,
  Check,
  Sparkles,
} from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { toast } from 'sonner';

interface NoteItem {
  id: string;
  title: string;
  content: string;
  tags: string[];
  isPinned: boolean;
  color: string;
  updatedAt: string;
}

export const NotesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeNote, setActiveNote] = useState<NoteItem | null>(null);

  // Tag Manager modal state
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [tagActionLoading, setTagActionLoading] = useState(false);
  const [confirmDeleteTag, setConfirmDeleteTag] = useState<string | null>(null);

  const [notes, setNotes] = useState<NoteItem[]>([
    {
      id: 'n1',
      title: 'Kế hoạch tích lũy tài chính dài hạn 2027',
      content:
        '# Mục tiêu chính\n- Tích lũy 5 triệu/tháng vào quỹ chỉ số VN30.\n- Phân bổ 3 ví dự phòng khẩn cấp 6 tháng chi phí sinh hoạt.\n- Học thêm chứng chỉ CFA Level 1.',
      tags: ['tài-chính', 'kế-hoạch'],
      isPinned: true,
      color: '#6366F1',
      updatedAt: 'Hôm nay, 10:15',
    },
    {
      id: 'n2',
      title: 'Checklist chuẩn bị đi Đà Lạt cuối tuần',
      content:
        '- CCCD gắn chip & Bằng lái xe\n- Sạc dự phòng Anker 20.000mAh\n- Thuốc hạ sốt & chống say xe\n- Áo ấm len và áo khoác chống nước\n- Đặt vé xe Limousine trước 2 ngày',
      tags: ['du-lịch', 'checklist'],
      isPinned: true,
      color: '#10B981',
      updatedAt: 'Hôm qua, 18:20',
    },
    {
      id: 'n3',
      title: 'Ý tưởng xây dựng kiến trúc Micro-interactions',
      content:
        'Sử dụng CSS cubic-bezier(0.16, 1, 0.3, 1) cho chuyển động mượt mà. Đảm bảo tuân thủ tiêu chuẩn trợ năng WCAG 2.1 AA.',
      tags: ['công-nghệ', 'thiết-kế'],
      isPinned: false,
      color: '#8B5CF6',
      updatedAt: '12/10/2026',
    },
    {
      id: 'n4',
      title: 'Ghi chú cuộc họp thảo luận chiến lược quý 4',
      content:
        'Kế hoạch hành động quý 4: Hoàn thiện không gian làm việc cá nhân Flux và tối ưu hiệu suất công việc hàng ngày.',
      tags: ['công-việc', 'bảo-mật'],
      isPinned: false,
      color: '#F59E0B',
      updatedAt: '10/10/2026',
    },
  ]);

  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTag, setNewTag] = useState('tài-chính');

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await apiClient.get('/notes');
        if (Array.isArray(res.data.data)) {
          setNotes(
            res.data.data.map((n: any) => ({
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
        }
      } catch {
        // Fallback to initial prototype notes seamlessly
      }
    };

    fetchNotes();
    const handleRefresh = () => {
      fetchNotes();
    };
    window.addEventListener('flux:refresh-data', handleRefresh);
    return () => window.removeEventListener('flux:refresh-data', handleRefresh);
  }, []);

  const togglePin = async (id: string, e: React.MouseEvent) => {
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
  };

  const handleDeleteNote = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const noteToDelete = notes.find((n) => n.id === id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
    setActiveNote(null);
    toast.success('Đã xóa ghi chú thành công.');

    try {
      await apiClient.delete(`/notes/${id}`);
      window.dispatchEvent(new CustomEvent('flux:refresh-data'));
    } catch {
      if (noteToDelete) setNotes((prev) => [noteToDelete, ...prev]);
      toast.error('Không thể xóa ghi chú trên máy chủ.');
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const parsedTags = newTag
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);
    const finalTags = parsedTags.length > 0 ? parsedTags : ['chung'];

    const tempId = `note-${Date.now()}`;
    const newNote: NoteItem = {
      id: tempId,
      title: newTitle.trim(),
      content: newContent.trim(),
      tags: finalTags,
      isPinned: false,
      color: '#6366F1',
      updatedAt: 'Vừa xong',
    };

    setNotes([newNote, ...notes]);
    setIsAddModalOpen(false);
    toast.success('Đã lưu ghi chú mới vào kho tri thức!');

    try {
      const res = await apiClient.post('/notes', {
        title: newTitle.trim(),
        content: newContent.trim(),
        tags: finalTags,
      });
      if (res.data.data?.id) {
        const created = res.data.data;
        setNotes((prev) =>
          prev.map((n) => (n.id === tempId ? { ...n, id: created.id } : n))
        );
      }
      setNewTitle('');
      setNewContent('');
      window.dispatchEvent(new CustomEvent('flux:refresh-data'));
    } catch {
      // Degrade gracefully
    }
  };

  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags))).filter(Boolean);

  const tagCounts = allTags.map((tag) => ({
    name: tag,
    count: notes.filter((n) => n.tags.includes(tag)).length,
  }));

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
      setNotes((prev) =>
        prev.map((n) => ({
          ...n,
          tags: Array.from(
            new Set(n.tags.map((t) => (t.toLowerCase() === oldTag.toLowerCase() ? cleanNewTag : t)))
          ),
        }))
      );
      if (selectedTag.toLowerCase() === oldTag.toLowerCase()) {
        setSelectedTag(cleanNewTag);
      }
      toast.success(`Đã đổi tên thẻ "#${oldTag}" thành "#${cleanNewTag}"!`);
      setEditingTag(null);
      window.dispatchEvent(new CustomEvent('flux:refresh-data'));
    } catch {
      // Local fallback for offline/prototype
      setNotes((prev) =>
        prev.map((n) => ({
          ...n,
          tags: Array.from(
            new Set(n.tags.map((t) => (t.toLowerCase() === oldTag.toLowerCase() ? cleanNewTag : t)))
          ),
        }))
      );
      if (selectedTag.toLowerCase() === oldTag.toLowerCase()) {
        setSelectedTag(cleanNewTag);
      }
      toast.success(`Đã cập nhật tên thẻ "#${cleanNewTag}".`);
      setEditingTag(null);
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
      setNotes((prev) =>
        prev.map((n) => ({
          ...n,
          tags: n.tags.filter((t) => t.toLowerCase() !== tagToDelete.toLowerCase()),
        }))
      );
      if (selectedTag.toLowerCase() === tagToDelete.toLowerCase()) {
        setSelectedTag('ALL');
      }
      toast.success(`Đã xóa thẻ "#${tagToDelete}" khỏi toàn bộ ghi chú!`);
      window.dispatchEvent(new CustomEvent('flux:refresh-data'));
    } catch {
      setNotes((prev) =>
        prev.map((n) => ({
          ...n,
          tags: n.tags.filter((t) => t.toLowerCase() !== tagToDelete.toLowerCase()),
        }))
      );
      if (selectedTag.toLowerCase() === tagToDelete.toLowerCase()) {
        setSelectedTag('ALL');
      }
      toast.success(`Đã xóa thẻ "#${tagToDelete}".`);
    } finally {
      setTagActionLoading(false);
      setConfirmDeleteTag(null);
    }
  };

  const filteredNotes = notes.filter((n) => {
    const matchesQuery =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag === 'ALL' || n.tags.includes(selectedTag);
    return matchesQuery && matchesTag;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header Controls */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 text-brand text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ý Tưởng & Tư Duy Không Giới Hạn</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Trạm Ý Tưởng & Kho Tri Thức
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Hội tụ tư duy sáng tạo, tài liệu markdown cá nhân và tổ chức nhãn thông minh
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white dark:bg-slate-900 text-brand shadow-sm font-bold' : 'text-slate-500'
                }`}
                title="Dạng lưới thẻ"
              >
                <LayoutGrid className="w-4 h-4" />
                <span>Lưới</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'list' ? 'bg-white dark:bg-slate-900 text-brand shadow-sm font-bold' : 'text-slate-500'
                }`}
                title="Dạng danh sách"
              >
                <List className="w-4 h-4" />
                <span>Danh Sách</span>
              </button>
            </div>

            <button
              onClick={() => setIsTagManagerOpen(true)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              title="Quản lý thẻ phân loại"
            >
              <Tag className="w-3.5 h-3.5 text-brand" />
              <span>Quản Lý Thẻ</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs shadow-md shadow-brand/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Ghi Chú Mới</span>
            </button>
          </div>
        </div>

        {/* Search & Tag Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm nội dung ghi chú (Full-Text Search)..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedTag('ALL')}
              className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                selectedTag === 'ALL'
                  ? 'bg-brand text-white border-brand font-bold'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Tất Cả ({notes.length})
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                  selectedTag === tag
                    ? 'bg-brand text-white border-brand font-bold'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>

        {/* Notes Grid Display */}
        {viewMode === 'grid' ? (
          filteredNotes.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-2">
              <FileText className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
              <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">Không tìm thấy ghi chú nào</h3>
              <p className="text-xs text-slate-400">Thử tìm kiếm với từ khóa khác hoặc tạo ghi chú mới.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => setActiveNote(note)}
                  className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover-lift cursor-pointer flex flex-col justify-between space-y-4 hover:border-brand/40"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                        {note.title}
                      </h3>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => togglePin(note.id, e)}
                          className={`p-1 rounded-lg transition-colors cursor-pointer ${
                            note.isPinned ? 'text-brand bg-brand/10' : 'text-slate-300 hover:text-slate-500'
                          }`}
                          title={note.isPinned ? 'Bỏ ghim' : 'Ghim ghi chú'}
                        >
                          <Pin className="w-3.5 h-3.5 fill-current" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteNote(note.id, e)}
                          className="p-1 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                          title="Xóa ghi chú"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed font-mono whitespace-pre-wrap">
                      {note.content}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-1 flex-wrap">
                      {note.tags.map((t) => (
                        <span key={t} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-medium text-slate-600 dark:text-slate-300">
                          #{t}
                        </span>
                      ))}
                    </div>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {note.updatedAt}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          filteredNotes.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-2">
              <FileText className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
              <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">Không tìm thấy ghi chú nào</h3>
              <p className="text-xs text-slate-400">Thử tìm kiếm với từ khóa khác hoặc tạo ghi chú mới.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm space-y-2">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => setActiveNote(note)}
                  className="p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all flex items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="w-5 h-5 text-brand flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-1">
                        {note.title}
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-1">{note.content.replace(/#/g, '')}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400 flex-shrink-0">
                    <span className="hidden sm:inline">{note.tags.map((t) => `#${t}`).join(' ')}</span>
                    <span>{note.updatedAt}</span>
                    <button
                      onClick={(e) => togglePin(note.id, e)}
                      className={`p-1 rounded-lg ${note.isPinned ? 'text-brand' : 'text-slate-300'}`}
                      title="Ghim"
                    >
                      <Pin className="w-3.5 h-3.5 fill-current" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteNote(note.id, e)}
                      className="p-1 text-slate-300 hover:text-rose-500 rounded"
                      title="Xóa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Note View / Detail Modal */}
        {activeNote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm modal-backdrop-animate">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl modal-dialog-animate space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-base line-clamp-1">{activeNote.title}</h3>
                </div>
                <button onClick={() => setActiveNote(null)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
                {activeNote.content}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 gap-3 text-xs text-slate-400">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {activeNote.tags.map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      #{t}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                  <span>Cập nhật: {activeNote.updatedAt}</span>
                  <button
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

        {/* Add Note Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm modal-backdrop-animate">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl modal-dialog-animate space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-base">Soạn Thảo Ghi Chú Mới</h3>
                </div>
                <button onClick={() => setIsAddModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateNote} className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold block mb-1">Tiêu đề ghi chú</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="VD: Kế hoạch tuần tới..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Nhãn Tag</label>
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="VD: tài-chính, công-việc"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Nội dung (Markdown)</label>
                  <textarea
                    rows={6}
                    required
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="# Tiêu đề\n- Gạch đầu dòng\n- Nhiệm vụ..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs shadow-md shadow-brand/25 transition-all cursor-pointer"
                >
                  Lưu Ghi Chú Vào CSDL
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tag Manager Modal */}
        {isTagManagerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm modal-backdrop-animate">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl modal-dialog-animate space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">Quản Lý Thẻ Phân Loại</h3>
                    <p className="text-[11px] text-slate-400">Đổi tên hoặc xóa thẻ trên toàn bộ ghi chú</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsTagManagerOpen(false);
                    setEditingTag(null);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {tagCounts.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Chưa có thẻ phân loại nào trong ghi chú.
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {tagCounts.map(({ name, count }) => {
                    const isEditing = editingTag === name;
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
                              <span className="font-semibold text-brand bg-brand/10 dark:bg-brand/20 px-2.5 py-1 rounded-lg truncate">
                                #{name}
                              </span>
                              <span className="text-[11px] text-slate-400 flex-shrink-0">
                                ({count} ghi chú)
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
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
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

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
      </div>
    </AppLayout>
  );
};
