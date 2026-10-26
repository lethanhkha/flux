import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { REMIND_BEFORE_OPTIONS, formatRemindBefore } from '../../lib/reminderUtils';

interface RemindBeforeSelectProps {
  value: number; // in minutes
  onChange: (minutes: number) => void;
  label?: string;
}

type TimeUnit = 'minutes' | 'hours' | 'days' | 'weeks';

const UNIT_MULTIPLIERS: Record<TimeUnit, number> = {
  minutes: 1,
  hours: 60,
  days: 1440,
  weeks: 10080,
};

export const RemindBeforeSelect: React.FC<RemindBeforeSelectProps> = ({
  value,
  onChange,
  label = 'Báo trước',
}) => {
  // Check if current value matches one of the standard presets
  const isStandardPreset = REMIND_BEFORE_OPTIONS.some((opt) => opt.value === value);

  const [isCustom, setIsCustom] = useState<boolean>(!isStandardPreset && value > 0);

  // Derive initial custom amount and unit from value
  const deriveAmountAndUnit = (totalMinutes: number): { amount: number; unit: TimeUnit } => {
    if (totalMinutes > 0 && totalMinutes % 10080 === 0) {
      return { amount: totalMinutes / 10080, unit: 'weeks' };
    }
    if (totalMinutes > 0 && totalMinutes % 1440 === 0) {
      return { amount: totalMinutes / 1440, unit: 'days' };
    }
    if (totalMinutes > 0 && totalMinutes % 60 === 0) {
      return { amount: totalMinutes / 60, unit: 'hours' };
    }
    return { amount: Math.max(1, totalMinutes || 15), unit: 'minutes' };
  };

  const [customAmount, setCustomAmount] = useState<number>(() => deriveAmountAndUnit(value).amount);
  const [customUnit, setCustomUnit] = useState<TimeUnit>(() => deriveAmountAndUnit(value).unit);

  useEffect(() => {
    const isPreset = REMIND_BEFORE_OPTIONS.some((opt) => opt.value === value);
    if (!isPreset && value > 0) {
      setIsCustom(true);
      const derived = deriveAmountAndUnit(value);
      setCustomAmount(derived.amount);
      setCustomUnit(derived.unit);
    } else if (isPreset) {
      setIsCustom(false);
    }
  }, [value]);

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected === 'custom') {
      setIsCustom(true);
      const calculated = Math.max(1, customAmount) * UNIT_MULTIPLIERS[customUnit];
      onChange(calculated);
    } else {
      setIsCustom(false);
      onChange(Number(selected));
    }
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = Math.max(1, parseInt(e.target.value, 10) || 1);
    setCustomAmount(newAmount);
    onChange(newAmount * UNIT_MULTIPLIERS[customUnit]);
  };

  const handleCustomUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUnit = e.target.value as TimeUnit;
    setCustomUnit(newUnit);
    onChange(Math.max(1, customAmount) * UNIT_MULTIPLIERS[newUnit]);
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Bell className="w-3.5 h-3.5 text-brand" />
          <span>{label}</span>
        </label>
      )}

      {/* Preset Dropdown */}
      <select
        value={isCustom ? 'custom' : value}
        onChange={handlePresetChange}
        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
      >
        {REMIND_BEFORE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
        <option value="custom">⚙️ Tùy chọn khác (Nhập số ngày, giờ, phút...)</option>
      </select>

      {/* Custom Inputs (When 'custom' selected) */}
      {isCustom && (
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-brand/30 dark:border-brand/40 space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">
              Báo trước:
            </span>

            {/* Number input */}
            <input
              type="number"
              min={1}
              max={365}
              value={customAmount}
              onChange={handleCustomAmountChange}
              className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-center focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
            />

            {/* Unit select */}
            <select
              value={customUnit}
              onChange={handleCustomUnitChange}
              className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
            >
              <option value="minutes">Phút</option>
              <option value="hours">Giờ</option>
              <option value="days">Ngày</option>
              <option value="weeks">Tuần</option>
            </select>
          </div>

          <div className="text-[10px] text-brand dark:text-brand font-medium">
            💡 Hệ thống sẽ nhắc trước: <span className="font-bold">{formatRemindBefore(value)}</span>
          </div>
        </div>
      )}
    </div>
  );
};
