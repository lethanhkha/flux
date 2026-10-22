import React, { useMemo } from 'react';
import { Pin, Edit3, Trash2, Clock } from 'lucide-react';
import { Tooltip } from '../common/Tooltip';

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  tags: string[];
  isPinned: boolean;
  color: string;
  updatedAt: string;
}

export interface NoteCardProps {
  note: NoteItem;
  onSelect: (note: NoteItem) => void;
  onTogglePin: (id: string, e: React.MouseEvent) => void;
  onEdit: (note: NoteItem, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  getTagColor: (tag: string) => string;
}

export function getPreviewSnippet(markdown: string): string {
  if (!markdown) return '';
  return markdown
    .replace(/<[^>]*>/g, '')
    .replace(/^#+\s+/gm, '')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/`{1,3}(.*?)`{1,3}/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .trim();
}

export const NoteCard = React.memo<NoteCardProps>(({
  note,
  onSelect,
  onTogglePin,
  onEdit,
  onDelete,
  getTagColor,
}) => {
  const snippet = useMemo(() => getPreviewSnippet(note.content), [note.content]);

  return (
    <div
      onClick={() => onSelect(note)}
      className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover-lift cursor-pointer flex flex-col justify-between space-y-4 hover:border-brand/40 transition-colors"
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
            {note.title}
          </h3>
          <div className="flex items-center gap-1">
            <Tooltip content={note.isPinned ? 'Bỏ ghim khỏi đầu danh sách' : 'Ghim ghi chú lên đầu trang và bảng điều khiển'}>
              <button
                type="button"
                onClick={(e) => onTogglePin(note.id, e)}
                aria-label={note.isPinned ? `Bỏ ghim ghi chú: ${note.title}` : `Ghim ghi chú: ${note.title}`}
                aria-pressed={note.isPinned}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer focus-ring ${
                  note.isPinned ? 'text-brand bg-brand/10' : 'text-slate-300 hover:text-slate-500'
                }`}
              >
                <Pin className="w-3.5 h-3.5 fill-current" />
              </button>
            </Tooltip>
            <Tooltip content="Chỉnh sửa nội dung ghi chú">
              <button
                type="button"
                onClick={(e) => onEdit(note, e)}
                aria-label={`Chỉnh sửa ghi chú: ${note.title}`}
                className="p-1.5 rounded-lg text-slate-300 hover:text-brand hover:bg-brand/10 transition-colors cursor-pointer focus-ring"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
            <Tooltip content="Xóa ghi chú này">
              <button
                type="button"
                onClick={(e) => onDelete(note.id, e)}
                aria-label={`Xóa ghi chú: ${note.title}`}
                className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer focus-ring"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
          </div>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
          {snippet}
        </p>
      </div>

      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1 flex-wrap">
          {note.tags.map((t) => {
            const color = getTagColor(t);
            return (
              <span
                key={t}
                className="px-2 py-0.5 rounded-md text-[10px] font-semibold border"
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
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" /> {note.updatedAt}
        </span>
      </div>
    </div>
  );
});

NoteCard.displayName = 'NoteCard';
