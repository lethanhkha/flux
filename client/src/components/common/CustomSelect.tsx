import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  color?: string;
  badge?: string | number;
  description?: string;
  disabled?: boolean;
}

export interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  align?: 'left' | 'right';
  disabled?: boolean;
  ariaLabel?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Chọn một mục…',
  icon,
  size = 'md',
  className = '',
  buttonClassName = '',
  menuClassName = '',
  align = 'left',
  disabled = false,
  ariaLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (optValue: string, isOptDisabled?: boolean) => {
    if (isOptDisabled) return;
    onChange(optValue);
    setIsOpen(false);
  };

  const isSmall = size === 'sm';

  return (
    <div
      ref={containerRef}
      className={cn('relative inline-block text-left', className)}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || selectedOption?.label || placeholder}
        className={cn(
          'flex items-center justify-between gap-2 rounded-lg border border-border bg-card hover:bg-muted/60 text-foreground font-medium text-xs shadow-2xs transition-[background-color,border-color] cursor-pointer focus-ring disabled:opacity-50 disabled:cursor-not-allowed group',
          isSmall ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-xs sm:text-sm',
          buttonClassName
        )}
      >
        <div className="flex items-center gap-2 truncate min-w-0">
          {/* Custom icon or option color dot */}
          {selectedOption?.color ? (
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: selectedOption.color }}
            />
          ) : (
            icon && <span className="text-brand flex-shrink-0">{icon}</span>
          )}

          {selectedOption?.icon && !selectedOption.color && (
            <span className="flex-shrink-0">{selectedOption.icon}</span>
          )}

          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>

          {selectedOption?.badge && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
              {selectedOption.badge}
            </span>
          )}
        </div>

        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform duration-200 flex-shrink-0',
            isOpen && 'rotate-180 text-brand dark:text-brand'
          )}
        />
      </button>

      {/* Custom Popover Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          tabIndex={-1}
          className={cn(
            'absolute z-50 mt-1.5 w-max min-w-full max-w-xs max-h-64 overflow-y-auto custom-scrollbar-y p-1 rounded-lg border border-border bg-popover text-popover-foreground shadow-lg animate-in fade-in zoom-in-95 duration-100 space-y-0.5',
            align === 'right' ? 'right-0' : 'left-0',
            menuClassName
          )}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={opt.disabled}
                onClick={() => handleSelect(opt.value, opt.disabled)}
                className={cn(
                  'w-full flex items-center justify-between gap-3 px-2.5 py-1.5 rounded-md text-xs transition-colors cursor-pointer text-left',
                  isSelected
                    ? 'bg-muted text-foreground font-semibold'
                    : 'text-foreground/80 hover:bg-muted/80 hover:text-foreground',
                  opt.disabled && 'opacity-40 cursor-not-allowed hover:bg-transparent'
                )}
              >
                <div className="flex items-center gap-2 truncate min-w-0">
                  {opt.color ? (
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: opt.color }}
                    />
                  ) : (
                    opt.icon && <span className="flex-shrink-0">{opt.icon}</span>
                  )}

                  <div className="truncate">
                    <span className="truncate block">{opt.label}</span>
                    {opt.description && (
                      <span className="text-[10px] text-slate-400 block truncate">
                        {opt.description}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {opt.badge && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                      {opt.badge}
                    </span>
                  )}
                  {isSelected && <Check className="w-3.5 h-3.5 text-brand" />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
