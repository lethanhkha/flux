import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface PaginationControlProps {
  pagination: PaginationMeta;
  onPageChange: (newPage: number) => void;
  isLoading?: boolean;
}

export const PaginationControl: React.FC<PaginationControlProps> = ({
  pagination,
  onPageChange,
  isLoading = false,
}) => {
  const { page, totalPages, total, limit } = pagination;

  if (totalPages <= 1) {
    return null;
  }

  const startItem = Math.min((page - 1) * limit + 1, total);
  const endItem = Math.min(page * limit, total);

  // Generate page numbers to display with smart ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (page < totalPages - 2) pages.push('...');
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
      {/* Information text */}
      <div className="text-slate-500 dark:text-slate-400">
        Hiển thị <span className="font-semibold text-slate-700 dark:text-slate-200">{startItem}</span> -{' '}
        <span className="font-semibold text-slate-700 dark:text-slate-200">{endItem}</span> trên tổng số{' '}
        <span className="font-semibold text-slate-700 dark:text-slate-200">{total}</span>
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || isLoading}
          aria-label="Trang trước"
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Trước</span>
        </button>

        {/* Page pills for desktop */}
        <div className="hidden sm:flex items-center gap-1">
          {getPageNumbers().map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`ellipsis-${idx}`} className="px-2 py-1 text-slate-400">
                  ...
                </span>
              );
            }

            const pageNum = p as number;
            const isActive = pageNum === page;

            return (
              <button
                key={`page-${pageNum}`}
                type="button"
                onClick={() => onPageChange(pageNum)}
                disabled={isLoading}
                aria-current={isActive ? 'page' : undefined}
                className={`min-w-[30px] h-[30px] rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-brand text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Mobile current page indicator */}
        <span className="sm:hidden text-slate-600 dark:text-slate-300 font-medium px-2">
          Trang {page} / {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || isLoading}
          aria-label="Trang sau"
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium"
        >
          <span className="hidden sm:inline">Sau</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
