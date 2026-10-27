import React, { useState } from 'react';
import { Calendar, AlertCircle, X, Check } from 'lucide-react';
import { addDays, differenceInCalendarDays, startOfWeek, endOfWeek } from 'date-fns';
import { Modal } from '../../common/Modal';

interface PlannerRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStartDate: Date;
  currentEndDate: Date;
  onApplyRange: (start: Date, end: Date) => void;
}

export const PlannerRangeModal: React.FC<PlannerRangeModalProps> = ({
  isOpen,
  onClose,
  currentStartDate,
  currentEndDate,
  onApplyRange,
}) => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const toDateInputStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const [startDateStr, setStartDateStr] = useState(() => toDateInputStr(currentStartDate));
  const [endDateStr, setEndDateStr] = useState(() => toDateInputStr(currentEndDate));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const start = new Date(`${startDateStr}T00:00:00`);
    const end = new Date(`${endDateStr}T23:59:59`);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setErrorMsg('Ngày được chọn không hợp lệ.');
      return;
    }

    if (start > end) {
      setErrorMsg('Ngày bắt đầu không được lớn hơn ngày kết thúc.');
      return;
    }

    const diffDays = differenceInCalendarDays(end, start) + 1;
    if (diffDays > 14) {
      setErrorMsg(
        `Khoảng ngày bạn chọn là ${diffDays} ngày. Để đảm bảo kích thước cột kéo thả tốt nhất, hệ thống giới hạn tối đa 14 ngày (2 tuần).`
      );
      return;
    }

    setErrorMsg(null);
    onApplyRange(start, end);
    onClose();
  };

  const applyPreset = (preset: 'this_week' | 'work_week' | 'next_7_days' | 'next_week' | 'next_14_days') => {
    const now = new Date();
    let start: Date;
    let end: Date;

    if (preset === 'this_week') {
      start = startOfWeek(now, { weekStartsOn: 1 });
      end = endOfWeek(now, { weekStartsOn: 1 });
    } else if (preset === 'work_week') {
      start = startOfWeek(now, { weekStartsOn: 1 });
      end = addDays(start, 4); // Thứ 2 -> Thứ 6
    } else if (preset === 'next_7_days') {
      start = now;
      end = addDays(now, 6);
    } else if (preset === 'next_week') {
      const nextMon = addDays(startOfWeek(now, { weekStartsOn: 1 }), 7);
      start = nextMon;
      end = addDays(nextMon, 6);
    } else {
      // next_14_days
      start = startOfWeek(now, { weekStartsOn: 1 });
      end = addDays(start, 13);
    }

    setStartDateStr(toDateInputStr(start));
    setEndDateStr(toDateInputStr(end));
    setErrorMsg(null);
  };

  const currentDiff = (() => {
    const s = new Date(`${startDateStr}T00:00:00`);
    const e = new Date(`${endDateStr}T00:00:00`);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return null;
    return differenceInCalendarDays(e, s) + 1;
  })();

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md" ariaLabelledBy="planner-range-modal-title">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 id="planner-range-modal-title" className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Chọn Khoảng Ngày Hiển Thị
            </h3>
            <p className="text-[11px] text-slate-400">
              Tùy chỉnh các ngày xuất hiện trên bảng lập kế hoạch
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 pt-3 text-xs">
        {/* Preset quick buttons */}
        <div>
          <label className="font-semibold block mb-1.5 text-slate-700 dark:text-slate-300">
            Lựa chọn nhanh
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => applyPreset('this_week')}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand hover:text-brand bg-slate-50 dark:bg-slate-950 font-medium text-[11px] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer text-center"
            >
              Tuần này (7 ngày)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('work_week')}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand hover:text-brand bg-slate-50 dark:bg-slate-950 font-medium text-[11px] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer text-center"
            >
              5 ngày làm việc (T2-T6)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('next_7_days')}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand hover:text-brand bg-slate-50 dark:bg-slate-950 font-medium text-[11px] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer text-center"
            >
              7 ngày tới (từ hôm nay)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('next_week')}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand hover:text-brand bg-slate-50 dark:bg-slate-950 font-medium text-[11px] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer text-center"
            >
              Tuần sau (T2-CN)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('next_14_days')}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand hover:text-brand bg-slate-50 dark:bg-slate-950 font-medium text-[11px] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer text-center"
            >
              2 tuần (Tối đa 14 ngày)
            </button>
          </div>
        </div>

        {/* Date pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
              Từ ngày
            </label>
            <input
              type="date"
              required
              value={startDateStr}
              onChange={(e) => {
                setStartDateStr(e.target.value);
                setErrorMsg(null);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-brand"
            />
          </div>
          <div>
            <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
              Đến ngày
            </label>
            <input
              type="date"
              required
              value={endDateStr}
              onChange={(e) => {
                setEndDateStr(e.target.value);
                setErrorMsg(null);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-brand"
            />
          </div>
        </div>

        {/* Validation and Info Pill */}
        {currentDiff !== null && (
          <div className="flex items-center justify-between text-[11px] px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400">
            <span>Tổng số ngày hiển thị:</span>
            <span
              className={`font-bold ${
                currentDiff > 14
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-brand font-semibold'
              }`}
            >
              {currentDiff} ngày {currentDiff > 14 ? '(Vượt quá giới hạn 14 ngày)' : ''}
            </span>
          </div>
        )}

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-[11px] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p className="leading-snug">{errorMsg}</p>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold shadow-sm shadow-brand/20 cursor-pointer transition-colors flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Áp Dụng Khoảng Ngày</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
