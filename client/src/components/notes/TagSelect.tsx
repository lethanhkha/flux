import React, { useState, useRef, useEffect } from 'react';
import { Tag as TagIcon, X, Plus, Check } from 'lucide-react';

export interface TagOption {
  name: string;
  count?: number;
  color?: string;
}

interface TagSelectProps {
  availableTags: TagOption[];
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export const TagSelect: React.FC<TagSelectProps> = ({
  availableTags,
  selectedTags,
  onChange,
  placeholder = 'Tìm hoặc tạo thẻ mới...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tagMap = new Map<string, TagOption>();
  for (const t of availableTags) {
    tagMap.set(t.name.toLowerCase().trim(), t);
  }

  const getTagColor = (name: string): string => {
    return tagMap.get(name.toLowerCase().trim())?.color || '#6366F1';
  };

  const handleToggleTag = (tagName: string) => {
    const clean = tagName.trim().toLowerCase().replace(/^#/, '');
    if (!clean) return;

    if (selectedTags.includes(clean)) {
      onChange(selectedTags.filter((t) => t !== clean));
    } else {
      onChange([...selectedTags, clean]);
    }
    setSearchTerm('');
  };

  const handleCreateNewTag = () => {
    const clean = searchTerm.trim().toLowerCase().replace(/^#/, '');
    if (clean && !selectedTags.includes(clean)) {
      onChange([...selectedTags, clean]);
      setSearchTerm('');
    }
  };

  const filteredOptions = availableTags.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const isExactMatch = availableTags.some(
    (t) => t.name.toLowerCase() === searchTerm.trim().toLowerCase().replace(/^#/, '')
  );

  return (
    <div ref={containerRef} className="relative space-y-2">
      {/* Selected tags badges list */}
      <div
        onClick={() => setIsOpen(true)}
        className="min-h-[42px] p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-wrap items-center gap-1.5 cursor-pointer focus-within:ring-2 focus-within:ring-brand focus-within:border-brand transition-all"
      >
        <TagIcon className="w-4 h-4 text-slate-400 ml-1 flex-shrink-0" />

        {selectedTags.map((tag) => {
          const color = getTagColor(tag);
          return (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold border transition-all"
              style={{
                backgroundColor: `${color}18`,
                borderColor: `${color}35`,
                color: color,
              }}
            >
              <span>#{tag}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleTag(tag);
                }}
                className="hover:opacity-75 p-0.5 rounded-full"
                title="Bỏ thẻ này"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          );
        })}

        {/* Search input inside container */}
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (searchTerm.trim()) {
                handleCreateNewTag();
              }
            }
          }}
          placeholder={selectedTags.length === 0 ? placeholder : 'Thêm thẻ...'}
          className="flex-1 min-w-[120px] bg-transparent text-xs text-slate-800 dark:text-slate-200 outline-none px-1"
        />
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto custom-scrollbar-y bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100">
          {/* Quick Create option if typing a new tag */}
          {searchTerm.trim() && !isExactMatch && (
            <button
              type="button"
              onClick={handleCreateNewTag}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-brand hover:bg-brand/10 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo thẻ mới: "#{searchTerm.trim().toLowerCase().replace(/^#/, '')}"</span>
            </button>
          )}

          {/* List of existing tags */}
          {filteredOptions.length === 0 && !searchTerm.trim() ? (
            <div className="p-4 text-center text-xs text-slate-400">
              Chưa có thẻ nào. Hãy gõ tên thẻ mới và nhấn Enter!
            </div>
          ) : (
            filteredOptions.map((item) => {
              const isSelected = selectedTags.includes(item.name);
              const color = item.color || '#6366F1';
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => handleToggleTag(item.name)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span>#{item.name}</span>
                    {item.count !== undefined && (
                      <span className="text-[10px] text-slate-400">({item.count})</span>
                    )}
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-brand" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
