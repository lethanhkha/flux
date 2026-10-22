import React, { useMemo } from 'react';
import { FileText, Pin, Edit3, Trash2 } from 'lucide-react';
import { Tooltip } from '../common/Tooltip';
import { NoteItem, getPreviewSnippet } from './NoteCard';

export interface NoteRowProps {
  note: NoteItem;
  onSelect: (note: NoteItem) => void;
  onTogglePin: (id: string, e: React.MouseEvent) => void;
  onEdit: (note: NoteItem, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  getTagColor: (tag: string) => string;
}

export const NoteRow = React.memo<NoteRowProps>(({
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
      className="p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all flex items-center justify-between gap-4 cursor-pointer"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <FileText className="w-5 h-5 text-brand flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-1">
            {note.title}
          </div>
          <div className="text-[11px] text-slate-400 line-clamp-1">
            {snippet}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-slate-400 flex-shrink-0">
        <div className="hidden sm:flex items-center gap-1">
          {note.tags.map((t) => {
            const color = getTagColor(t);
            return (
              <span
                key={t}
                className="px-1.5 py-0.5 rounded text-[10px] font-semibold border"
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
        <span>{note.updatedAt}</span>
        <Tooltip content={note.isPinned ? 'Bỏ ghim khỏi đầu danh sách' : 'Ghim ghi chú lên đầu trang và bảng điều khiển'}>
          <button
            type="button"
            onClick={(e) => onTogglePin(note.id, e)}
            aria-label={note.isPinned ? `Bỏ ghim ghi chú: ${note.title}` : `Ghim ghi chú: ${note.title}`}
            aria-pressed={note.isPinned}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer focus-ring ${note.isPinned ? 'text-brand' : 'text-slate-300'}`}
          >
            <Pin className="w-3.5 h-3.5 fill-current" />
          </button>
        </Tooltip>
        <Tooltip content="Chỉnh sửa nội dung ghi chú">
          <button
            type="button"
            onClick={(e) => onEdit(note, e)}
            aria-label={`Chỉnh sửa ghi chú: ${note.title}`}
            className="p-1.5 text-slate-300 hover:text-brand hover:bg-brand/10 rounded-lg transition-colors cursor-pointer focus-ring"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
        <Tooltip content="Xóa ghi chú này">
          <button
            type="button"
            onClick={(e) => onDelete(note.id, e)}
            aria-label={`Xóa ghi chú: ${note.title}`}
            className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg transition-colors cursor-pointer focus-ring"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
});

NoteRow.displayName = 'NoteRow';
