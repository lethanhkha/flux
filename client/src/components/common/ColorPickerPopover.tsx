import React, { useState, useEffect, useRef } from 'react';
import { Pipette, Check, X } from 'lucide-react';

export const PASTEL_PALETTE = [
  { name: 'Hoa đào', hex: '#F43F5E' },
  { name: 'San hô', hex: '#FB923C' },
  { name: 'Hổ phách', hex: '#F59E0B' },
  { name: 'Bạc hà', hex: '#10B981' },
  { name: 'Ngọc bích', hex: '#059669' },
  { name: 'Da trời', hex: '#0EA5E9' },
  { name: 'Tím Flux', hex: '#6366F1' },
  { name: 'Oải hương', hex: '#8B5CF6' },
  { name: 'Phong lan', hex: '#D946EF' },
  { name: 'Dâu tây', hex: '#EF4444' },
  { name: 'Ngọc lam', hex: '#06B6D4' },
  { name: 'Xám khói', hex: '#64748B' },
];

interface ColorPickerPopoverProps {
  currentColor: string;
  onSelectColor: (color: string) => void;
  onClose: () => void;
  tagName?: string;
  className?: string;
}

export const ColorPickerPopover: React.FC<ColorPickerPopoverProps> = ({
  currentColor,
  onSelectColor,
  onClose,
  tagName = 'the-mau',
  className = '',
}) => {
  const [hexInput, setHexInput] = useState(currentColor || '#6366F1');
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleApplyColor = (color: string) => {
    const formatted = color.startsWith('#') ? color : `#${color}`;
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(formatted)) {
      setHexInput(formatted);
      onSelectColor(formatted);
    }
  };

  const containerClasses = className
    ? `p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-72 space-y-3.5 animate-in fade-in zoom-in-95 duration-150 ${className}`
    : "absolute z-50 mt-2 p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-64 space-y-3 animate-in fade-in zoom-in-95 duration-150";

  return (
    <div
      ref={popoverRef}
      className={containerClasses}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Chọn Màu Thẻ</span>
          {/* Preview badge */}
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded-md border"
            style={{
              backgroundColor: `${hexInput}20`,
              borderColor: `${hexInput}40`,
              color: hexInput,
            }}
          >
            #{tagName}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng bảng màu"
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Pastel Swatches Grid (2 rows x 6 cols) */}
      <div>
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
          Bảng Màu Pastel
        </span>
        <div className="grid grid-cols-6 gap-1.5">
          {PASTEL_PALETTE.map((item) => {
            const isSelected = hexInput.toLowerCase() === item.hex.toLowerCase();
            return (
              <button
                key={item.hex}
                type="button"
                onClick={() => handleApplyColor(item.hex)}
                className="w-7 h-7 rounded-lg transition-transform hover:scale-110 flex items-center justify-center cursor-pointer border border-black/10 dark:border-white/10"
                style={{ backgroundColor: item.hex }}
                title={`${item.name} (${item.hex})`}
              >
                {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow-sm" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom RGB Color Picker & Hex Input */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
          Tùy Chỉnh RGB / Hex
        </span>
        <div className="flex items-center gap-2">
          {/* Native HTML5 Color Picker */}
          <label
            className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center cursor-pointer overflow-hidden shadow-xs relative flex-shrink-0"
            style={{ backgroundColor: hexInput }}
            title="Mở bảng màu RGB"
          >
            <Pipette className="w-3.5 h-3.5 text-white mix-blend-difference" />
            <input
              type="color"
              value={hexInput}
              onChange={(e) => handleApplyColor(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </label>

          {/* Hex input */}
          <input
            type="text"
            value={hexInput}
            onChange={(e) => setHexInput(e.target.value)}
            onBlur={() => handleApplyColor(hexInput)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleApplyColor(hexInput);
            }}
            placeholder="#6366F1"
            maxLength={7}
            className="flex-1 px-2.5 py-1.5 text-xs font-mono uppercase rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-brand"
          />

          <button
            type="button"
            onClick={() => handleApplyColor(hexInput)}
            className="px-2.5 py-1.5 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
};
