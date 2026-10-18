import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string, currency = 'VND'): string {
  const numeric = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  const safeNum = isNaN(numeric) ? 0 : numeric;
  const isVnd = currency === 'VND';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: isVnd ? (Number.isInteger(safeNum) ? 0 : 2) : 2,
  }).format(safeNum);
}
