import React, { useState, useRef } from 'react';
import {
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  List,
  CheckSquare,
  Quote,
  Code,
  Table,
  Eye,
  Edit2,
} from 'lucide-react';
import { MarkdownViewer } from './MarkdownViewer';

interface MarkdownEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  className?: string;
  minHeightClass?: string;
  maxHeightPreviewClass?: string;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = 'Nhập nội dung markdown...',
  rows = 8,
  required = false,
  className = '',
  minHeightClass = 'min-h-[160px]',
  maxHeightPreviewClass = 'max-h-96',
}) => {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertSnippet = (prefix: string, suffix = '', defaultText = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || defaultText;

    const before = value.substring(0, start);
    const after = value.substring(end);
    const replacement = `${prefix}${selectedText}${suffix}`;

    const newValue = `${before}${replacement}${after}`;
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selectedText.length
      );
    }, 0);
  };

  const toolbarButtons = [
    {
      label: 'H1',
      icon: <Heading1 className="w-3.5 h-3.5" />,
      action: () => insertSnippet('# ', '', 'Tiêu đề lớn'),
      title: 'Tiêu đề 1 (#)',
    },
    {
      label: 'H2',
      icon: <Heading2 className="w-3.5 h-3.5" />,
      action: () => insertSnippet('## ', '', 'Tiêu đề vừa'),
      title: 'Tiêu đề 2 (##)',
    },
    {
      label: 'H3',
      icon: <Heading3 className="w-3.5 h-3.5" />,
      action: () => insertSnippet('### ', '', 'Tiêu đề nhỏ'),
      title: 'Tiêu đề 3 (###)',
    },
    {
      label: 'Bold',
      icon: <Bold className="w-3.5 h-3.5" />,
      action: () => insertSnippet('**', '**', 'chữ đậm'),
      title: 'In đậm (**text**)',
    },
    {
      label: 'Italic',
      icon: <Italic className="w-3.5 h-3.5" />,
      action: () => insertSnippet('*', '*', 'chữ nghiêng'),
      title: 'In nghiêng (*text*)',
    },
    {
      label: 'List',
      icon: <List className="w-3.5 h-3.5" />,
      action: () => insertSnippet('- ', '', 'Mục danh sách'),
      title: 'Danh sách gạch đầu dòng (-)',
    },
    {
      label: 'Task',
      icon: <CheckSquare className="w-3.5 h-3.5" />,
      action: () => insertSnippet('- [ ] ', '', 'Việc cần làm'),
      title: 'Danh sách công việc (- [ ])',
    },
    {
      label: 'Quote',
      icon: <Quote className="w-3.5 h-3.5" />,
      action: () => insertSnippet('> ', '', 'Trích dẫn'),
      title: 'Khối trích dẫn (>)',
    },
    {
      label: 'Code',
      icon: <Code className="w-3.5 h-3.5" />,
      action: () => insertSnippet('```\n', '\n```', '// Mã code'),
      title: 'Khối code (```)',
    },
    {
      label: 'Table',
      icon: <Table className="w-3.5 h-3.5" />,
      action: () =>
        insertSnippet(
          '| Cột 1 | Cột 2 |\n|---|---|\n| Dữ liệu 1 | Dữ liệu 2 |\n'
        ),
      title: 'Chèn bảng mẫu',
    },
  ];

  return (
    <div className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs ${className}`}>
      {/* Editor Header: Toolbar & Mode Switcher */}
      <div className="flex items-center justify-between p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 gap-2">
        {/* Quick Toolbar (only active in write mode) */}
        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar-x py-0.5">
          {toolbarButtons.map((btn, idx) => (
            <button
              key={idx}
              type="button"
              onClick={btn.action}
              disabled={activeTab === 'preview'}
              className="p-1.5 rounded-lg text-slate-500 hover:text-brand hover:bg-white dark:hover:bg-slate-800 transition-colors disabled:opacity-40 cursor-pointer flex-shrink-0"
              title={btn.title}
            >
              {btn.icon}
            </button>
          ))}
        </div>

        {/* Tab switch: Write vs Preview */}
        <div className="flex items-center p-1 rounded-xl bg-slate-200/60 dark:bg-slate-800 text-[11px] font-semibold flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('write')}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-all ${
              activeTab === 'write'
                ? 'bg-white dark:bg-slate-900 text-brand shadow-2xs font-bold'
                : 'text-slate-500'
            }`}
          >
            <Edit2 className="w-3 h-3" />
            <span>Soạn thảo</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-all ${
              activeTab === 'preview'
                ? 'bg-white dark:bg-slate-900 text-brand shadow-2xs font-bold'
                : 'text-slate-500'
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>Xem trước</span>
          </button>
        </div>
      </div>

      {/* Editor Body */}
      {activeTab === 'write' ? (
        <textarea
          ref={textareaRef}
          rows={rows}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full p-3.5 bg-transparent font-mono text-xs leading-relaxed outline-none resize-y ${minHeightClass} text-slate-800 dark:text-slate-200`}
        />
      ) : (
        <div className={`p-4 ${minHeightClass} ${maxHeightPreviewClass} overflow-y-auto bg-slate-50/50 dark:bg-slate-950/50 custom-scrollbar-y`}>
          {value.trim() ? (
            <MarkdownViewer content={value} />
          ) : (
            <div className="py-8 text-center text-xs text-slate-400 italic">
              Chưa có nội dung để xem trước. Hãy chuyển sang tab "Soạn thảo" để nhập nội dung!
            </div>
          )}
        </div>
      )}
    </div>
  );
};
