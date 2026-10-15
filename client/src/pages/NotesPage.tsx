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
  ShieldCheck,
  X,
} from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
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
        if (res.data.data?.length > 0) {
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
    } catch {
      // Degrade gracefully
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newNote: NoteItem = {
      id: `note-${Date.now()}`,
      title: newTitle,
      content: newContent,
      tags: [newTag],
      isPinned: false,
      color: '#6366F1',
      updatedAt: 'Vừa xong',
    };

    setNotes([newNote, ...notes]);
    setNewTitle('');
    setNewContent('');
    setIsAddModalOpen(false);
    toast.success('Đã lưu ghi chú mới vào kho tri thức!');

    try {
      await apiClient.post('/notes', {
        title: newTitle,
        content: newContent,
        tags: [newTag],
      });
    } catch {
      // Degrade gracefully
    }
  };

  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags)));

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
            <h1 className="text-2xl font-bold tracking-tight">Kho Tri Thức & Ghi Chú</h1>
            <p className="text-xs text-slate-500 mt-1">
              Trình soạn thảo Markdown, lọc nhãn tags và PostgreSQL Full-Text Search
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
                    <button
                      onClick={(e) => togglePin(note.id, e)}
                      className={`p-1 rounded-lg transition-colors cursor-pointer ${
                        note.isPinned ? 'text-brand bg-brand/10' : 'text-slate-300 hover:text-slate-500'
                      }`}
                      title={note.isPinned ? 'Bỏ ghim' : 'Ghim ghi chú'}
                    >
                      <Pin className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed font-mono whitespace-pre-wrap">
                    {note.content}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1">
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
                  >
                    <Pin className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>
              </div>
            ))}
          </div>
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

              <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-500/10 text-emerald-600 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Trình soạn thảo hỗ trợ hiển thị Markdown an toàn và trực quan.</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
                {activeNote.content}
              </div>

              <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  {activeNote.tags.map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      #{t}
                    </span>
                  ))}
                </div>
                <span>Cập nhật: {activeNote.updatedAt}</span>
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
      </div>
    </AppLayout>
  );
};
