import React from 'react';

interface MarkdownViewerProps {
  content: string;
  className?: string;
  maxLines?: number;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  content,
  className = '',
  maxLines,
}) => {
  if (!content) return null;

  // Render formatted markdown lines
  const lines = content.split('\n');

  const renderedElements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let inTable = false;
  let tableRows: string[][] = [];

  const flushCodeBlock = (key: string) => {
    if (codeBuffer.length > 0) {
      renderedElements.push(
        <pre
          key={key}
          className="p-3 my-2 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800"
        >
          <code>{codeBuffer.join('\n')}</code>
        </pre>
      );
      codeBuffer = [];
    }
  };

  const flushTable = (key: string) => {
    if (tableRows.length > 0) {
      const header = tableRows[0];
      const body = tableRows.slice(1);
      renderedElements.push(
        <div key={key} className="overflow-x-auto my-2 rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 font-bold">
              <tr>
                {header.map((col, idx) => (
                  <th key={idx} className="px-3 py-2">
                    {col.trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, rIdx) => (
                <tr key={rIdx} className="border-b border-slate-100 dark:border-slate-850 last:border-0">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3 py-2">
                      {cell.trim()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
    }
  };

  const parseInlineFormatting = (text: string): React.ReactNode => {
    // Process bold **text**, italic *text*, inline code `code`, link [text](url)
    const parts: React.ReactNode[] = [];
    let keyIdx = 0;

    // Simple parser for inline code, bold, italic
    const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      const matchText = match[0];
      if (matchText.startsWith('**') && matchText.endsWith('**')) {
        parts.push(
          <strong key={keyIdx++} className="font-bold text-slate-900 dark:text-slate-100">
            {matchText.slice(2, -2)}
          </strong>
        );
      } else if (matchText.startsWith('*') && matchText.endsWith('*')) {
        parts.push(
          <em key={keyIdx++} className="italic text-slate-800 dark:text-slate-200">
            {matchText.slice(1, -1)}
          </em>
        );
      } else if (matchText.startsWith('`') && matchText.endsWith('`')) {
        parts.push(
          <code
            key={keyIdx++}
            className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-brand font-mono text-[11px]"
          >
            {matchText.slice(1, -1)}
          </code>
        );
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Check code blocks
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        flushCodeBlock(`code-${index}`);
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      return;
    }

    // Check tables
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      // Ignore separator line like |---|---|
      if (!/^\|(\s*:?-+:?\s*\|)+$/.test(trimmed)) {
        inTable = true;
        const cols = trimmed.slice(1, -1).split('|');
        tableRows.push(cols);
      }
      return;
    } else if (inTable) {
      flushTable(`table-${index}`);
      inTable = false;
    }

    // Headings
    if (trimmed.startsWith('### ')) {
      renderedElements.push(
        <h3 key={index} className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-3 mb-1">
          {parseInlineFormatting(trimmed.slice(4))}
        </h3>
      );
    } else if (trimmed.startsWith('## ')) {
      renderedElements.push(
        <h2 key={index} className="text-base font-bold text-slate-900 dark:text-slate-100 mt-3.5 mb-1.5 border-b pb-1 border-slate-100 dark:border-slate-800">
          {parseInlineFormatting(trimmed.slice(3))}
        </h2>
      );
    } else if (trimmed.startsWith('# ')) {
      renderedElements.push(
        <h1 key={index} className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mt-4 mb-2">
          {parseInlineFormatting(trimmed.slice(2))}
        </h1>
      );
    }
    // Blockquote
    else if (trimmed.startsWith('> ')) {
      renderedElements.push(
        <blockquote
          key={index}
          className="border-l-3 border-brand/60 pl-3 py-1 my-1.5 text-xs italic text-slate-500 dark:text-slate-400 bg-brand/5 rounded-r-lg"
        >
          {parseInlineFormatting(trimmed.slice(2))}
        </blockquote>
      );
    }
    // Task Checklist
    else if (trimmed.startsWith('- [ ] ') || trimmed.startsWith('- [x] ') || trimmed.startsWith('- [X] ')) {
      const isChecked = trimmed.startsWith('- [x] ') || trimmed.startsWith('- [X] ');
      renderedElements.push(
        <div key={index} className="flex items-center gap-2 my-1 text-xs">
          <input
            type="checkbox"
            checked={isChecked}
            readOnly
            className="rounded border-slate-300 dark:border-slate-700 text-brand pointer-events-none"
          />
          <span className={isChecked ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}>
            {parseInlineFormatting(trimmed.slice(6))}
          </span>
        </div>
      );
    }
    // Bullet List
    else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      renderedElements.push(
        <li key={index} className="ml-4 list-disc text-xs text-slate-700 dark:text-slate-300 my-0.5">
          {parseInlineFormatting(trimmed.slice(2))}
        </li>
      );
    }
    // Empty line
    else if (!trimmed) {
      renderedElements.push(<div key={index} className="h-2" />);
    }
    // Regular paragraph
    else {
      renderedElements.push(
        <p key={index} className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed my-1">
          {parseInlineFormatting(line)}
        </p>
      );
    }
  });

  if (inCodeBlock) flushCodeBlock('code-end');
  if (inTable) flushTable('table-end');

  return (
    <div
      className={`markdown-content space-y-0.5 ${className}`}
      style={maxLines ? { display: '-webkit-box', WebkitLineClamp: maxLines, WebkitBoxOrient: 'vertical', overflow: 'hidden' } : undefined}
    >
      {renderedElements}
    </div>
  );
};
