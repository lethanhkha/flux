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
  placeholder = 'Tìm kiếm…',
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
      ? 'pl-10 pr-9 py-2 text-sm rounded-lg'
      : 'pl-[34px] pr-8 py-1.5 text-xs rounded-md';

  return (
    <div className={`relative flex items-center ${className}`}>
      {/* Search or Loading Icon */}
      <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none text-muted-foreground">
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-foreground" />
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
        className={`w-full ${sizeClasses} border border-border bg-muted/40 focus:bg-background focus:outline-none focus:ring-1 focus:ring-ring transition-colors font-normal text-foreground placeholder:text-muted-foreground ${inputClassName}`}
      />

      {/* Clear Button (X) */}
      {value && (
        <Tooltip content="Xóa tìm kiếm (Esc)">
          <button
            type="button"
            onClick={handleClear}
            aria-label="Xóa từ khóa tìm kiếm"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer focus-ring"
          >
            <X className="w-3 h-3" />
          </button>
        </Tooltip>
      )}
    </div>
  );
};
