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
      className="p-3 rounded-md border border-border/50 hover:bg-muted/40 transition-[background-color,border-color] flex items-center justify-between gap-3 cursor-pointer"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="font-medium text-xs text-foreground line-clamp-1">
            {note.title}
          </div>
          <div className="text-[11px] text-muted-foreground line-clamp-1">
            {snippet}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 text-xs text-muted-foreground flex-shrink-0">
        <div className="hidden sm:flex items-center gap-1">
          {note.tags.map((t) => {
            const color = getTagColor(t);
            return (
              <span
                key={t}
                className="px-1.5 py-0.2 rounded text-[10px] font-medium border"
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
        <span className="tabular-nums">{note.updatedAt}</span>
        <Tooltip content={note.isPinned ? 'Bỏ ghim khỏi đầu danh sách' : 'Ghim ghi chú lên đầu trang và bảng điều khiển'}>
          <button
            type="button"
            onClick={(e) => onTogglePin(note.id, e)}
            aria-label={note.isPinned ? `Bỏ ghim ghi chú: ${note.title}` : `Ghim ghi chú: ${note.title}`}
            aria-pressed={note.isPinned}
            className={`p-1 rounded-md transition-[color,background-color] cursor-pointer focus-ring ${note.isPinned ? 'text-foreground bg-muted' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Pin className="w-3.5 h-3.5 fill-current" />
          </button>
        </Tooltip>
        <Tooltip content="Chỉnh sửa nội dung ghi chú">
          <button
            type="button"
            onClick={(e) => onEdit(note, e)}
            aria-label={`Chỉnh sửa ghi chú: ${note.title}`}
            className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-[color,background-color] cursor-pointer focus-ring"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
        <Tooltip content="Xóa ghi chú này">
          <button
            type="button"
            onClick={(e) => onDelete(note.id, e)}
            aria-label={`Xóa ghi chú: ${note.title}`}
            className="p-1 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-md transition-[color,background-color] cursor-pointer focus-ring"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
});

NoteRow.displayName = 'NoteRow';
