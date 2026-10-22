import React, { useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Tooltip } from './Tooltip';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  className?: string;
  inputClassName?: string;
  onClear?: () => void;
  autoFocus?: boolean;
  size?: 'sm' | 'md';
  ariaLabel?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Tìm kiếm...',
  isLoading = false,
  className = '',
  inputClassName = '',
  onClear,
  autoFocus = false,
  size = 'sm',
  ariaLabel = 'Tìm kiếm',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    onChange('');
    onClear?.();
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape' && value) {
      e.preventDefault();
      handleClear();
    }
  };

  const sizeClasses =
    size === 'md'
      ? 'pl-10 pr-9 py-2.5 text-sm rounded-2xl'
      : 'pl-[36px] pr-8 py-2 text-xs rounded-xl';

  return (
    <div className={`relative flex items-center ${className}`}>
      {/* Search or Loading Icon */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none text-slate-400">
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-brand" />
        ) : (
          <Search className="w-3.5 h-3.5" />
        )}
      </div>

      {/* Text Input with safe left padding */}
      <input
        ref={inputRef}
        type="text"
        role="searchbox"
        aria-label={ariaLabel}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus={autoFocus}
        className={`w-full ${sizeClasses} border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-brand dark:focus:border-brand transition-colors font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 ${inputClassName}`}
      />

      {/* Clear Button (X) */}
      {value && (
        <Tooltip content="Xóa tìm kiếm (Esc)">
          <button
            type="button"
            onClick={handleClear}
            aria-label="Xóa từ khóa tìm kiếm"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </Tooltip>
      )}
    </div>
  );
};
