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
      className="p-4 rounded-lg bg-card border border-border hover:border-foreground/30 cursor-pointer flex flex-col justify-between space-y-3 transition-[border-color]"
    >
      <div className="space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm text-foreground line-clamp-1">
            {note.title}
          </h3>
          <div className="flex items-center gap-0.5">
            <Tooltip content={note.isPinned ? 'Bỏ ghim khỏi đầu danh sách' : 'Ghim ghi chú lên đầu trang và bảng điều khiển'}>
              <button
                type="button"
                onClick={(e) => onTogglePin(note.id, e)}
                aria-label={note.isPinned ? `Bỏ ghim ghi chú: ${note.title}` : `Ghim ghi chú: ${note.title}`}
                aria-pressed={note.isPinned}
                className={`p-1 rounded-md transition-[color,background-color] cursor-pointer focus-ring ${
                  note.isPinned ? 'text-foreground bg-muted' : 'text-muted-foreground hover:text-foreground'
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
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-[color,background-color] cursor-pointer focus-ring"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
            <Tooltip content="Xóa ghi chú này">
              <button
                type="button"
                onClick={(e) => onDelete(note.id, e)}
                aria-label={`Xóa ghi chú: ${note.title}`}
                className="p-1 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-[color,background-color] cursor-pointer focus-ring"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
          </div>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
          {snippet}
        </p>
      </div>

      <div className="pt-2.5 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1 flex-wrap">
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
        <span className="flex items-center gap-1 tabular-nums">
          <Clock className="w-3 h-3" /> {note.updatedAt}
        </span>
      </div>
    </div>
  );
});

NoteCard.displayName = 'NoteCard';
