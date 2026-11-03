import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  RotateCcw,
  Clock,
} from 'lucide-react';
import { PeriodFilter } from './types';
import { Tooltip } from '../common/Tooltip';

interface PeriodSelectorProps {
  period: PeriodFilter;
  onChange: (newPeriod: PeriodFilter) => void;
  isLoading?: boolean;
}

const MONTH_NAMES = [
  'Tháng 1',
  'Tháng 2',
  'Tháng 3',
  'Tháng 4',
  'Tháng 5',
  'Tháng 6',
  'Tháng 7',
  'Tháng 8',
  'Tháng 9',
  'Tháng 10',
  'Tháng 11',
  'Tháng 12',
];

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  period,
  onChange,
  isLoading = false,
}) => {
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(period.year);
  const pickerRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const isCurrentMonthSelected =
    period.mode === 'MONTH' && period.month === currentMonth && period.year === currentYear;

  // Close popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsMonthPickerOpen(false);
      }
    };
    if (isMonthPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMonthPickerOpen]);

  // Stepper: Previous Month
  const handlePrevMonth = () => {
    let nextMonth = period.month - 1;
    let nextYear = period.year;
    if (nextMonth < 1) {
      nextMonth = 12;
      nextYear -= 1;
    }
    onChange({
      mode: 'MONTH',
      month: nextMonth,
      year: nextYear,
    });
  };

  // Stepper: Next Month
  const handleNextMonth = () => {
    let nextMonth = period.month + 1;
    let nextYear = period.year;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    onChange({
      mode: 'MONTH',
      month: nextMonth,
      year: nextYear,
    });
  };

  // Reset to Current Month
  const handleJumpToCurrentMonth = () => {
    onChange({
      mode: 'MONTH',
      month: currentMonth,
      year: currentYear,
    });
  };

  // Select month from popover
  const handleSelectMonth = (mIndex: number) => {
    onChange({
      mode: 'MONTH',
      month: mIndex + 1,
      year: pickerYear,
    });
    setIsMonthPickerOpen(false);
  };

  // Quick preset ranges
  const applyPreset = (preset: 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_QUARTER' | 'THIS_YEAR' | 'ALL') => {
    if (preset === 'THIS_MONTH') {
      onChange({
        mode: 'MONTH',
        month: currentMonth,
        year: currentYear,
      });
    } else if (preset === 'LAST_MONTH') {
      const prevM = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevY = currentMonth === 1 ? currentYear - 1 : currentYear;
      onChange({
        mode: 'MONTH',
        month: prevM,
        year: prevY,
      });
    } else if (preset === 'THIS_QUARTER') {
      const quarter = Math.floor((currentMonth - 1) / 3);
      const startM = quarter * 3 + 1;
      const endM = startM + 2;
      const sDate = `${currentYear}-${String(startM).padStart(2, '0')}-01`;
      const lastDayOfEndM = new Date(currentYear, endM, 0).getDate();
      const eDate = `${currentYear}-${String(endM).padStart(2, '0')}-${String(lastDayOfEndM).padStart(2, '0')}`;
      onChange({
        mode: 'RANGE',
        month: currentMonth,
        year: currentYear,
        startDate: sDate,
        endDate: eDate,
      });
    } else if (preset === 'THIS_YEAR') {
      onChange({
        mode: 'RANGE',
        month: currentMonth,
        year: currentYear,
        startDate: `${currentYear}-01-01`,
        endDate: `${currentYear}-12-31`,
      });
    } else if (preset === 'ALL') {
      onChange({
        mode: 'ALL',
        month: currentMonth,
        year: currentYear,
      });
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-2.5 sm:p-3 text-card-foreground flex flex-col md:flex-row md:items-center justify-between gap-3">
      {/* Left: Mode Switcher & Presets */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-0.5 p-0.5 rounded-md border border-border/40 bg-muted text-xs font-medium">
          <Tooltip content="Lọc và theo dõi dòng tiền thu chi theo từng tháng">
            <button
              type="button"
              onClick={() =>
                onChange({
                  mode: 'MONTH',
                  month: period.month || currentMonth,
                  year: period.year || currentYear,
                })
              }
              className={`px-2.5 py-1 rounded-sm transition-[color,background-color] cursor-pointer ${
                period.mode === 'MONTH'
                  ? 'bg-background text-foreground shadow-xs font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Theo Tháng
            </button>
          </Tooltip>

          <Tooltip content="Tự chọn ngày bắt đầu và ngày kết thúc tùy ý">
            <button
              type="button"
              onClick={() => {
                const startOfMonth = `${period.year}-${String(period.month).padStart(2, '0')}-01`;
                const lastDay = new Date(period.year, period.month, 0).getDate();
                const endOfMonth = `${period.year}-${String(period.month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
                onChange({
                  mode: 'RANGE',
                  month: period.month,
                  year: period.year,
                  startDate: period.startDate || startOfMonth,
                  endDate: period.endDate || endOfMonth,
                });
              }}
              className={`px-2.5 py-1 rounded-sm transition-[color,background-color] cursor-pointer ${
                period.mode === 'RANGE'
                  ? 'bg-background text-foreground shadow-xs font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Khoảng Ngày
            </button>
          </Tooltip>

          <Tooltip content="Xem toàn bộ lịch sử giao dịch từ trước đến nay không giới hạn">
            <button
              type="button"
              onClick={() =>
                onChange({
                  mode: 'ALL',
                  month: period.month,
                  year: period.year,
                })
              }
              className={`px-2.5 py-1 rounded-sm transition-[color,background-color] cursor-pointer ${
                period.mode === 'ALL'
                  ? 'bg-background text-foreground shadow-xs font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Toàn Thời Gian
            </button>
          </Tooltip>
        </div>

        {/* Quick presets */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
          <Tooltip content="Xem các khoản thu chi trong tháng hiện tại">
            <button
              type="button"
              onClick={() => applyPreset('THIS_MONTH')}
              className={`px-2 py-0.5 rounded-md border text-xs font-medium transition-[color,background-color,border-color] cursor-pointer ${
                isCurrentMonthSelected
                  ? 'border-border bg-foreground text-background font-medium'
                  : 'border-border/60 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              Tháng này
            </button>
          </Tooltip>

          <Tooltip content="Xem lại các giao dịch của tháng vừa qua">
            <button
              type="button"
              onClick={() => applyPreset('LAST_MONTH')}
              className="px-2 py-0.5 rounded-md border border-border/60 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-medium transition-[color,background-color,border-color] cursor-pointer"
            >
              Tháng trước
            </button>
          </Tooltip>

          <Tooltip content="Xem biến động tài chính trong quý 3 tháng gần nhất">
            <button
              type="button"
              onClick={() => applyPreset('THIS_QUARTER')}
              className="px-2 py-0.5 rounded-md border border-border/60 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-medium transition-[color,background-color,border-color] cursor-pointer"
            >
              Quý này
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Right: Active Period Controller */}
      <div className="flex items-center gap-2 self-start sm:self-auto">
        {period.mode === 'MONTH' ? (
          <div className="relative flex items-center gap-1" ref={pickerRef}>
            <Tooltip content="Xem tháng trước">
              <button
                type="button"
                onClick={handlePrevMonth}
                disabled={isLoading}
                aria-label="Tháng trước"
                className="p-1.5 rounded-md border border-border bg-background hover:bg-muted text-foreground transition-[background-color] cursor-pointer disabled:opacity-50"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </Tooltip>

            {/* Current Month Trigger */}
            <Tooltip content="Nhấp để chọn nhanh tháng và năm bất kỳ">
              <button
                type="button"
                onClick={() => {
                  setPickerYear(period.year);
                  setIsMonthPickerOpen(!isMonthPickerOpen);
                }}
                className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-border bg-background hover:bg-muted text-foreground font-medium text-xs shadow-xs transition-[background-color] cursor-pointer"
              >
                <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="tabular-nums">
                  Tháng {period.month}, {period.year}
                </span>
                {isCurrentMonthSelected && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded border border-border bg-muted text-muted-foreground font-medium">
                    Hiện tại
                  </span>
                )}
              </button>
            </Tooltip>

            <Tooltip content="Xem tháng tiếp theo">
              <button
                type="button"
                onClick={handleNextMonth}
                disabled={isLoading}
                aria-label="Tháng sau"
                className="p-1.5 rounded-md border border-border bg-background hover:bg-muted text-foreground transition-[background-color] cursor-pointer disabled:opacity-50"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </Tooltip>

            {!isCurrentMonthSelected && (
              <Tooltip content="Quay về tháng hiện tại">
                <button
                  type="button"
                  onClick={handleJumpToCurrentMonth}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-border bg-secondary hover:bg-muted text-foreground text-xs font-medium transition-[background-color] cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span className="hidden sm:inline">Về tháng này</span>
                </button>
              </Tooltip>
            )}

            {/* Month Picker Popover */}
            {isMonthPickerOpen && (
              <div className="absolute top-full right-0 mt-2 z-50 w-64 p-3 bg-popover text-popover-foreground rounded-lg border border-border shadow-md space-y-2.5">
                {/* Year Controller */}
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <Tooltip content="Năm trước">
                    <button
                      type="button"
                      onClick={() => setPickerYear((y) => y - 1)}
                      className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>
                  <span className="font-semibold text-xs tabular-nums text-foreground">
                    Năm {pickerYear}
                  </span>
                  <Tooltip content="Năm sau">
                    <button
                      type="button"
                      onClick={() => setPickerYear((y) => y + 1)}
                      className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>
                </div>

                {/* 12 Months Grid */}
                <div className="grid grid-cols-3 gap-1">
                  {MONTH_NAMES.map((name, idx) => {
                    const isSelected =
                      period.month === idx + 1 && period.year === pickerYear;
                    const isThisMonth =
                      idx + 1 === currentMonth && pickerYear === currentYear;

                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => handleSelectMonth(idx)}
                        className={`p-1.5 rounded-md text-xs font-medium text-center transition-[color,background-color] cursor-pointer relative ${
                          isSelected
                            ? 'bg-foreground text-background font-medium'
                            : 'hover:bg-muted text-foreground'
                        }`}
                      >
                        {name}
                        {isThisMonth && !isSelected && (
                          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-foreground" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : period.mode === 'RANGE' ? (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Tooltip content="Chọn ngày bắt đầu của khoảng thời gian">
              <div className="flex items-center gap-1.5 bg-background border border-border rounded-md px-2 py-1 shadow-xs">
                <span className="text-muted-foreground font-medium">Từ:</span>
                <input
                  type="date"
                  value={period.startDate || ''}
                  onChange={(e) =>
                    onChange({
                      ...period,
                      startDate: e.target.value,
                    })
                  }
                  className="bg-transparent text-foreground font-medium focus-ring text-xs cursor-pointer"
                />
              </div>
            </Tooltip>
            <Tooltip content="Chọn ngày kết thúc của khoảng thời gian">
              <div className="flex items-center gap-1.5 bg-background border border-border rounded-md px-2 py-1 shadow-xs">
                <span className="text-muted-foreground font-medium">Đến:</span>
                <input
                  type="date"
                  value={period.endDate || ''}
                  onChange={(e) =>
                    onChange({
                      ...period,
                      endDate: e.target.value,
                    })
                  }
                  className="bg-transparent text-foreground font-medium focus-ring text-xs cursor-pointer"
                />
              </div>
            </Tooltip>
          </div>
        ) : (
          <Tooltip content="Đang hiển thị toàn bộ lịch sử giao dịch không giới hạn mốc thời gian">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted border border-border text-foreground font-medium text-xs cursor-help">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Toàn bộ lịch sử giao dịch</span>
            </div>
          </Tooltip>
        )}
      </div>
    </div>
  );
};
